CREATE TYPE "public"."chat_provider" AS ENUM('groq', 'openai');--> statement-breakpoint
CREATE TABLE "chat_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"provider" "chat_provider" NOT NULL,
	"model" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chat_models_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
-- Seed the initial allowlist. Models are data from here on: adding or
-- retiring one is an INSERT/UPDATE, not a deploy. Idempotent on slug so a
-- re-run cannot duplicate rows.
--
-- The OpenAI rows ship inactive: they are valid configuration, but no request
-- should be able to select them until OPENAI_API_KEY is set. Flipping
-- is_active is then a one-row UPDATE.
INSERT INTO "chat_models" ("slug", "label", "provider", "model", "is_active", "is_default", "sort_order") VALUES
	('groq/gpt-oss-120b', 'GPT-OSS 120B', 'groq', 'openai/gpt-oss-120b', true, true, 10),
	('groq/gpt-oss-20b', 'GPT-OSS 20B', 'groq', 'openai/gpt-oss-20b', true, false, 20),
	('groq/qwen3.8-27b', 'Qwen3.8 27B', 'groq', 'qwen/qwen3.8-27b', true, false, 30),
	('groq/compound-mini', 'Compound Mini', 'groq', 'groq/compound-mini', true, false, 40),
	('openai/gpt-5-nano', 'GPT-5 nano', 'openai', 'gpt-5-nano', false, false, 50),
	('openai/gpt-5-mini', 'GPT-5 mini', 'openai', 'gpt-5-mini', false, false, 60)
ON CONFLICT ("slug") DO NOTHING;
