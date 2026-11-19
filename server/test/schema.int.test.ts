import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import postgres from 'postgres';
import { runMigrations } from '../src/db/migrate.ts';

// Integration test: needs a real Postgres (docker compose up postgres, or the CI service container).
const url = process.env.DATABASE_URL;

describe.skipIf(!url)('posts approval constraint', () => {
  const sql = postgres(url!, { max: 1, onnotice: () => {} });
  let productId: number;

  beforeAll(async () => {
    await runMigrations(url!);
    const [p] = await sql`
      insert into products (shopee_item_id, shop_id, name, price, commission_rate, commission, image_url, product_url, offer_link)
      values (${'test-' + Date.now()}, 's1', 'Test', 10, 0.1, 1, 'https://x/i.png', 'https://x/p', 'https://x/o')
      returning id`;
    productId = p!.id;
  });
  afterAll(async () => {
    await sql`delete from posts where product_id = ${productId}`;
    await sql`delete from products where id = ${productId}`;
    await sql.end();
  });

  const insert = (status: string, approved: boolean) => sql`
    insert into posts (product_id, variant_group, hook_style, language, text, short_code, status, approved_at, approved_by)
    values (${productId}, gen_random_uuid(), 'curiosity', 'en', 'hi #ad', ${crypto.randomUUID()}, ${status},
            ${approved ? new Date() : null}, ${approved ? 'admin' : null})`;

  it('allows pending without approval', async () => {
    await expect(insert('pending', false)).resolves.toBeDefined();
  });

  it.each(['approved', 'publishing', 'published', 'failed'])('rejects %s without approval', async (status) => {
    await expect(insert(status, false)).rejects.toThrow(/posts_approval_required/);
  });

  it('allows approved with approval stamp', async () => {
    await expect(insert('approved', true)).resolves.toBeDefined();
  });
});
