import { resolve } from 'path';
import { existsSync } from 'fs';
import { loadConfig } from '../src/utils/config-loader';
import makeWASocket, { useMultiFileAuthState, ConnectionState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';

async function listGroups() {
  console.log('Listing WhatsApp groups...\n');

  const config = loadConfig();
  const authDir = resolve(config.storage.authDir);

  if (!existsSync(authDir)) {
    console.error('WhatsApp auth directory not found. Please run setup first.');
    process.exit(1);
  }

  const { state, saveCreds } = await useMultiFileAuthState(authDir);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
  });

  sock.ev.on('creds.update', saveCreds);

  // Wait for connection
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Connection timeout')), 30000);

    const handler = (update: Partial<ConnectionState>) => {
      if (update.connection === 'open') {
        clearTimeout(timeout);
        sock.ev.off('connection.update', handler);
        resolve();
      } else if (update.connection === 'close') {
        clearTimeout(timeout);
        sock.ev.off('connection.update', handler);
        const shouldReconnect =
          (update.lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        reject(new Error(shouldReconnect ? 'Connection closed' : 'Logged out'));
      }
    };

    sock.ev.on('connection.update', handler);
  });

  console.log('Connected! Fetching groups...\n');

  const groups = await sock.groupFetchAllParticipating();
  const groupList = Object.values(groups).sort((a, b) => a.subject.localeCompare(b.subject));

  if (groupList.length === 0) {
    console.log('No groups found.');
  } else {
    console.log(`Found ${groupList.length} group(s):\n`);
    for (const group of groupList) {
      console.log(`  "${group.subject}" (${Object.keys(group.participants).length} members)`);
    }
    console.log(`\nSet "groupName" in config.json to one of these names to send notifications there.`);
  }

  sock.end(undefined);
  process.exit(0);
}

listGroups().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
