import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { Redis } from 'ioredis';
import type { Config } from './config.ts';
import * as schema from './db/schema.ts';

/** Shared connections for both the API and the worker. */
export function createDeps(config: Config) {
  const sql = postgres(config.DATABASE_URL, { max: 10 });
  const db = drizzle(sql, { schema, casing: 'snake_case' });
  // maxRetriesPerRequest: null is what BullMQ requires for its connections.
  const redis = new Redis(config.REDIS_URL, { maxRetriesPerRequest: null, lazyConnect: true });

  return {
    sql,
    db,
    redis,
    async close() {
      await Promise.allSettled([sql.end({ timeout: 5 }), redis.quit()]);
    },
  };
}

export type Deps = ReturnType<typeof createDeps>;
