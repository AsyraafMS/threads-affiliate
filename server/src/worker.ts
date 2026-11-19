import { loadConfig } from './config.ts';
import { createLogger } from './logger.ts';
import { createDeps } from './deps.ts';

// Job processors are registered here from Phase 2 onward (sourcing, publishing, insights, token refresh).
const config = loadConfig();
const logger = createLogger(config.LOG_LEVEL);
const deps = createDeps(config);

await deps.redis.connect();
await deps.sql`select 1`;
logger.info('worker ready');

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, async () => {
    logger.info({ signal }, 'shutting down');
    await deps.close();
    process.exit(0);
  });
}
