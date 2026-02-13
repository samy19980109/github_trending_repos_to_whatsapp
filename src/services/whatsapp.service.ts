import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  ConnectionState,
  proto,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { logger } from '../utils/logger';
import type { Config } from '../types';

export class WhatsAppService {
  private config: Config;
  private sock: WASocket | null = null;

  constructor(config: Config) {
    this.config = config;
  }

  public async connect(timeoutMs: number = 30000): Promise<WASocket> {
    try {
      logger.info('Connecting to WhatsApp');

      const { state, saveCreds } = await useMultiFileAuthState(
        this.config.storage.authDir
      );

      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        markOnlineOnConnect: this.config.whatsapp.markOnlineOnConnect,
        logger: logger.child({ module: 'baileys' }),
      });

      this.sock.ev.on('creds.update', saveCreds);

      // Wait for connection to open
      await this.waitForConnection(timeoutMs);

      logger.info('Successfully connected to WhatsApp');
      return this.sock;
    } catch (error) {
      logger.error({ error }, 'Failed to connect to WhatsApp');
      throw error;
    }
  }

  private waitForConnection(timeoutMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.sock) {
        reject(new Error('Socket not initialized'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error(`Connection timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      const updateHandler = (update: Partial<ConnectionState>) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
          clearTimeout(timeout);
          this.sock?.ev.off('connection.update', updateHandler);
          resolve();
        } else if (connection === 'close') {
          clearTimeout(timeout);
          this.sock?.ev.off('connection.update', updateHandler);

          const shouldReconnect =
            (lastDisconnect?.error as Boom)?.output?.statusCode !==
            DisconnectReason.loggedOut;

          if (shouldReconnect) {
            reject(new Error('Connection closed, reconnection needed'));
          } else {
            reject(new Error('Logged out, please re-authenticate'));
          }
        }
      };

      this.sock.ev.on('connection.update', updateHandler);
    });
  }

  public async findGroupByName(groupName: string): Promise<string> {
    if (!this.sock) {
      throw new Error('WhatsApp not connected');
    }

    logger.info({ groupName }, 'Searching for WhatsApp group');
    const groups = await this.sock.groupFetchAllParticipating();

    for (const [jid, metadata] of Object.entries(groups)) {
      if (metadata.subject === groupName) {
        logger.info({ groupName, jid }, 'Found WhatsApp group');
        return jid;
      }
    }

    throw new Error(`WhatsApp group "${groupName}" not found. Create the group first, then retry.`);
  }

  public async sendMessage(jid: string, message: string): Promise<void> {
    if (!this.sock) {
      throw new Error('WhatsApp not connected');
    }

    try {
      await this.sock.sendMessage(jid, { text: message });
      logger.info({ jid }, 'Message sent successfully');
    } catch (error) {
      logger.error({ error, jid }, 'Failed to send message');
      throw error;
    }
  }

  public async sendMessages(
    jid: string,
    messages: string[]
  ): Promise<void> {
    for (let i = 0; i < messages.length; i++) {
      try {
        await this.sendMessage(jid, messages[i]);

        // Add delay between messages (except after the last one)
        if (i < messages.length - 1) {
          await this.sleep(this.config.whatsapp.messageDelay);
        }
      } catch (error) {
        logger.error({ error, messageIndex: i }, 'Failed to send message, continuing');
      }
    }
  }

  public async disconnect(): Promise<void> {
    if (this.sock) {
      try {
        // Don't logout - just end the connection to preserve credentials
        this.sock.end(undefined);
        logger.info('Disconnected from WhatsApp');
      } catch (error) {
        logger.warn({ error }, 'Error during disconnect, ignoring');
      }
      this.sock = null;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
