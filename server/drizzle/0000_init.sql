CREATE TYPE "public"."post_language" AS ENUM('en', 'ms', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."post_status" AS ENUM('draft', 'pending', 'approved', 'publishing', 'published', 'failed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('active', 'excluded');--> statement-breakpoint
CREATE TABLE "clicks" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "clicks_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"post_id" integer NOT NULL,
	"ts" timestamp with time zone DEFAULT now() NOT NULL,
	"user_agent" text,
	"ip_hash" text,
	"referer" text,
	"is_bot" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "conversions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"shopee_conversion_id" text NOT NULL,
	"sub_id" text,
	"post_id" integer,
	"order_time" timestamp with time zone NOT NULL,
	"commission" numeric(12, 2) NOT NULL,
	"status" text NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversions_shopeeConversionId_unique" UNIQUE("shopee_conversion_id")
);
--> statement-breakpoint
CREATE TABLE "insight_snapshots" (
	"post_id" integer NOT NULL,
	"captured_at" timestamp with time zone NOT NULL,
	"views" integer NOT NULL,
	"likes" integer NOT NULL,
	"replies" integer NOT NULL,
	"reposts" integer NOT NULL,
	"quotes" integer NOT NULL,
	CONSTRAINT "insight_snapshots_post_id_captured_at_pk" PRIMARY KEY("post_id","captured_at")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "posts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"product_id" integer NOT NULL,
	"variant_group" uuid NOT NULL,
	"hook_style" text NOT NULL,
	"language" "post_language" NOT NULL,
	"text" text NOT NULL,
	"image_path" text,
	"short_code" text NOT NULL,
	"affiliate_url" text,
	"status" "post_status" DEFAULT 'draft' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"approved_by" text,
	"threads_container_id" text,
	"threads_post_id" text,
	"link_reply_id" text,
	"permalink" text,
	"published_at" timestamp with time zone,
	"error" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_shortCode_unique" UNIQUE("short_code"),
	CONSTRAINT "posts_threadsPostId_unique" UNIQUE("threads_post_id"),
	CONSTRAINT "posts_approval_required" CHECK ("posts"."status" in ('draft', 'pending', 'rejected') or ("posts"."approved_at" is not null and "posts"."approved_by" is not null)),
	CONSTRAINT "posts_text_length" CHECK (char_length("posts"."text") <= 500)
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "products_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"shopee_item_id" text NOT NULL,
	"shop_id" text NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"price" numeric(12, 2) NOT NULL,
	"commission_rate" numeric(6, 4) NOT NULL,
	"commission" numeric(12, 2) NOT NULL,
	"image_url" text NOT NULL,
	"product_url" text NOT NULL,
	"offer_link" text NOT NULL,
	"rating" real,
	"sales" integer,
	"status" "product_status" DEFAULT 'active' NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_shopeeItemId_unique" UNIQUE("shopee_item_id")
);
--> statement-breakpoint
CREATE TABLE "threads_accounts" (
	"threads_user_id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"token_encrypted" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"refreshed_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insight_snapshots" ADD CONSTRAINT "insight_snapshots_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "clicks_post_id_ts_index" ON "clicks" USING btree ("post_id","ts");--> statement-breakpoint
CREATE INDEX "conversions_post_id_index" ON "conversions" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "posts_status_scheduled_at_index" ON "posts" USING btree ("status","scheduled_at");--> statement-breakpoint
CREATE INDEX "posts_product_id_index" ON "posts" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "products_status_commission_rate_index" ON "products" USING btree ("status","commission_rate");