import { pino } from 'pino';

export function createLogger(level: string) {
  return pino({
    level,
    // Tokens must never reach logs (hard rule). Extend this list when new secret-bearing fields appear.
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        '*.access_token',
        '*.accessToken',
        '*.token',
        '*.secret',
        '*.password',
      ],
      censor: '[redacted]',
    },
  });
}
