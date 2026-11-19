import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

// Column names are camelCase here and snake_case in Postgres (casing: 'snake_case' in drizzle config).

const createdAt = () => timestamp({ withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const productStatus = pgEnum('product_status', ['active', 'excluded']);

export const products = pgTable(
  'products',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    shopeeItemId: text().notNull().unique(), // dedupe key across sourcing runs
    shopId: text().notNull(),
    name: text().notNull(),
    category: text(),
    price: numeric({ precision: 12, scale: 2 }).notNull(),
    commissionRate: numeric({ precision: 6, scale: 4 }).notNull(), // 0.0850 = 8.5%
    commission: numeric({ precision: 12, scale: 2 }).notNull(),
    imageUrl: text().notNull(),
    productUrl: text().notNull(),
    offerLink: text().notNull(),
    rating: real(),
    sales: integer(),
    status: productStatus().notNull().default('active'),
    firstSeenAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.status, t.commissionRate)],
);

export const postStatus = pgEnum('post_status', [
  'draft',
  'pending', // waiting in the approval queue
  'approved',
  'publishing',
  'published',
  'failed',
  'rejected',
]);
export const postLanguage = pgEnum('post_language', ['en', 'ms', 'mixed']);

/** One row per copy variant. Variants of the same product share variantGroup for A/B comparison. */
export const posts = pgTable(
  'posts',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    productId: integer()
      .notNull()
      .references(() => products.id),
    variantGroup: uuid().notNull(),
    hookStyle: text().notNull(),
    language: postLanguage().notNull(),
    text: text().notNull(),
    imagePath: text(),
    shortCode: text().notNull().unique(), // our /r/:code link, also sent to Shopee as subId1
    affiliateUrl: text(), // Shopee generateShortLink result; set at generation time
    status: postStatus().notNull().default('draft'),
    scheduledAt: timestamp({ withTimezone: true }),
    approvedAt: timestamp({ withTimezone: true }),
    approvedBy: text(),
    threadsContainerId: text(), // stored before publish so a crashed worker can't double-post
    threadsPostId: text().unique(),
    linkReplyId: text(),
    permalink: text(),
    publishedAt: timestamp({ withTimezone: true }),
    error: text(),
    attempts: integer().notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index().on(t.status, t.scheduledAt),
    index().on(t.productId),
    // Hard rule: nothing reaches approved/publishing/published/failed without a human approval stamp.
    check(
      'posts_approval_required',
      sql`${t.status} in ('draft', 'pending', 'rejected') or (${t.approvedAt} is not null and ${t.approvedBy} is not null)`,
    ),
    check('posts_text_length', sql`char_length(${t.text}) <= 500`),
  ],
);

export const clicks = pgTable(
  'clicks',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    postId: integer()
      .notNull()
      .references(() => posts.id),
    ts: createdAt(),
    userAgent: text(),
    ipHash: text(), // HMAC(ip, secret): never the raw IP
    referer: text(),
    isBot: boolean().notNull().default(false),
  },
  (t) => [index().on(t.postId, t.ts)],
);

export const insightSnapshots = pgTable(
  'insight_snapshots',
  {
    postId: integer()
      .notNull()
      .references(() => posts.id),
    capturedAt: timestamp({ withTimezone: true }).notNull(),
    views: integer().notNull(),
    likes: integer().notNull(),
    replies: integer().notNull(),
    reposts: integer().notNull(),
    quotes: integer().notNull(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.capturedAt] })],
);

export const conversions = pgTable(
  'conversions',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    shopeeConversionId: text().notNull().unique(),
    subId: text(),
    postId: integer().references(() => posts.id), // null when subId doesn't map to one of our posts
    orderTime: timestamp({ withTimezone: true }).notNull(),
    commission: numeric({ precision: 12, scale: 2 }).notNull(),
    status: text().notNull(),
    syncedAt: createdAt(),
  },
  (t) => [index().on(t.postId)],
);

export const threadsAccounts = pgTable('threads_accounts', {
  threadsUserId: text().primaryKey(),
  username: text().notNull(),
  tokenEncrypted: text().notNull(), // AES-256-GCM, key from env
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  refreshedAt: timestamp({ withTimezone: true }).notNull(),
});
