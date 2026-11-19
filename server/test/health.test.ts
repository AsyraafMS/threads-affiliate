import { describe, expect, it } from 'vitest';
import { pino } from 'pino';
import { buildApp } from '../src/http/app.ts';

const logger = pino({ level: 'silent' });
const fakeDeps = (dbOk: boolean, redisOk: boolean) =>
  ({
    sql: () => (dbOk ? Promise.resolve([{ '?column?': 1 }]) : Promise.reject(new Error('db down'))),
    redis: { ping: () => (redisOk ? Promise.resolve('PONG') : Promise.reject(new Error('redis down'))) },
  }) as never;

describe('GET /health', () => {
  it('200 when db and redis respond', async () => {
    const res = await buildApp({ deps: fakeDeps(true, true), logger }).inject('/health');
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok', checks: { db: 'ok', redis: 'ok' } });
  });

  it('503 when a dependency is down', async () => {
    const res = await buildApp({ deps: fakeDeps(true, false), logger }).inject('/health');
    expect(res.statusCode).toBe(503);
    expect(res.json().checks.redis).toBe('down');
  });
});
