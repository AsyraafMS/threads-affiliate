import { loadConfig } from './config.ts';
import { createLogger } from './logger.ts';
import { createDeps } from './deps.ts';
import { buildApp } from './http/app.ts';

const config = loadConfig();
const logger = createLogger(config.LOG_LEVEL);
const deps = createDeps(config);
const app = buildApp({ deps, logger });

await app.listen({ port: config.PORT, host: '0.0.0.0' });

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, async () => {
    logger.info({ signal }, 'shutting down');
    await app.close();
    await deps.close();
    process.exit(0);
  });
}
