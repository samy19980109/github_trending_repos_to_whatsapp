import pino from 'pino';
import { loadConfig } from './config-loader';

const config = loadConfig();

export const logger = pino({
  level: 'info',
  transport: {
    targets: [
      {
        target: 'pino/file',
        options: { destination: config.storage.logFile },
        level: 'info',
      },
      {
        target: 'pino-pretty',
        options: { destination: 1 },
        level: 'info',
      },
    ],
  },
});
