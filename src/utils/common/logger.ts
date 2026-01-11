import { pino, type Logger } from 'pino';

const pinoConfig =
  process.env.NODE_ENV !== 'production'
    ? {
        level: process.env.PINO_LOG_LEVEL || 'info',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        },
      }
    : {
        level: process.env.PINO_LOG_LEVEL || 'info',
      };

const logger: Logger = pino(pinoConfig);
export default logger;
