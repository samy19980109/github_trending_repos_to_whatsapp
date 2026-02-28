import makeWASocket, { useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestWaWebVersion } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { resolve } from 'path';
import * as qrcode from 'qrcode-terminal';
import pino from 'pino';
import { loadConfig } from '../src/utils/config-loader';

async function setup() {
  console.log('🚀 GitHub Stars WhatsApp Notifier - Setup\n');

  // Load config
  const config = loadConfig();

  console.log(`📱 Phone number: ${config.whatsapp.phoneNumber}`);
  console.log(`📂 Auth directory: ${config.storage.authDir}\n`);

  console.log('⏳ Initializing WhatsApp connection...\n');

  const { state, saveCreds } = await useMultiFileAuthState(config.storage.authDir);

  // Fetch latest WhatsApp Web version
  const { version } = await fetchLatestWaWebVersion();

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 30000,
    browser: Browsers.macOS('Chrome'),
    version: version,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n📱 Scan the QR code below with WhatsApp (Linked Devices)\n');
      qrcode.generate(qr, { small: true });
      console.log('\n');
    }

    if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

      if (!shouldReconnect) {
        console.log('\n✅ Setup complete! Credentials saved.\n');
        console.log('📝 Next steps:');
        console.log('   1. Edit config.json and set your phone number');
        console.log('   2. Run: npm run test');
        console.log('   3. Run: npm start\n');
        process.exit(0);
      } else {
        console.log('🔄 Connection closed, waiting for automatic reconnection...\n');
      }
    } else if (connection === 'connecting') {
      console.log('🔄 Connecting to WhatsApp...\n');
    } else if (connection === 'open') {
      console.log('\n✅ Connected to WhatsApp!\n');
      console.log('📤 Sending test message...\n');

      try {
        const jid = `${config.whatsapp.phoneNumber}@s.whatsapp.net`;
        await sock.sendMessage(jid, {
          text: '✅ GitHub Stars WhatsApp Notifier is now set up!\n\nYou will receive notifications for trending GitHub repositories every 6 hours.',
        });

        console.log('✅ Test message sent successfully!\n');
        console.log('📝 Setup complete. You can now:');
        console.log('   1. Run: npm run test (to test notifications)');
        console.log('   2. Run: npm start (for manual run)');
        console.log('   3. Set up cron/launchd for automated runs\n');
      } catch (error) {
        console.error('❌ Failed to send test message:', error);
      }

      sock.end(undefined);
      process.exit(0);
    }
  });
}

setup().catch((error) => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
