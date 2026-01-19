import pino from 'pino';

// Cloud-native structured logger for frontend
// Logs are JSON formatted for easy aggregation with API logs
const isDev = import.meta.env.DEV;

export const logger = pino({
  level: isDev ? 'debug' : 'info',
  browser: {
    asObject: true,
    transmit: {
      level: 'error',
      send: (_level, logEvent) => {
        // In production, you could send logs to a logging service
        // For now, we just console them in structured format
        if (!isDev) {
          console.log(JSON.stringify({
            ...logEvent,
            service: 'event-feedback-hub-frontend',
            version: '1.0.0',
          }));
        }
      },
    },
  },
  base: {
    service: 'event-feedback-hub-frontend',
    version: '1.0.0',
  },
});

// Convenience methods with context
export const log = {
  info: (msg: string, data?: object) => logger.info({ ...data }, msg),
  warn: (msg: string, data?: object) => logger.warn({ ...data }, msg),
  error: (msg: string, data?: object) => logger.error({ ...data }, msg),
  debug: (msg: string, data?: object) => logger.debug({ ...data }, msg),
};
