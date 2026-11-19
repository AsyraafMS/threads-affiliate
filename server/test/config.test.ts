import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.ts';

const valid = { DATABASE_URL: 'postgres://u:p@localhost:5432/db', REDIS_URL: 'redis://localhost:6379' };

describe('loadConfig', () => {
  it('applies defaults', () => {
    const c = loadConfig(valid);
    expect(c.PORT).toBe(3000);
    expect(c.NODE_ENV).toBe('development');
  });

  it('lists every invalid var and never echoes values', () => {
    const secret = 'mysql://user:hunter2@host/db';
    let msg = '';
    try {
      loadConfig({ DATABASE_URL: secret, PORT: 'abc' });
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg).toMatch(/DATABASE_URL/);
    expect(msg).toMatch(/REDIS_URL/);
    expect(msg).toMatch(/PORT/);
    expect(msg).not.toContain('hunter2');
  });
});
