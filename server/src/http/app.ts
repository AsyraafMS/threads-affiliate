import Fastify from 'fastify';
import type { Logger } from 'pino';
import type { Deps } from '../deps.ts';

export function buildApp({ deps, logger }: { deps: Pick<Deps, 'sql' | 'redis'>; logger: Logger }) {
  const app = Fastify({ loggerInstance: logger });

  // Readiness: 200 only when both backing services answer. Docker/K8s healthchecks hit this.
  app.get('/health', async (_req, reply) => {
    const timeout = <T>(p: Promise<T>) =>
      Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 2000))]);

    const [db, redis] = await Promise.allSettled([timeout(deps.sql`select 1`), timeout(deps.redis.ping())]);
    const checks = { db: db.status === 'fulfilled' ? 'ok' : 'down', redis: redis.status === 'fulfilled' ? 'ok' : 'down' };
    const ok = checks.db === 'ok' && checks.redis === 'ok';
    return reply.code(ok ? 200 : 503).send({ status: ok ? 'ok' : 'degraded', checks });
  });

  return app;
}
