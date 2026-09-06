DROP INDEX "chats_title_search_idx";--> statement-breakpoint
DROP INDEX "conversations_content_search_idx";--> statement-breakpoint
CREATE INDEX "chats_title_search_idx" ON "chats" USING gin (to_tsvector('simple', "title"));--> statement-breakpoint
CREATE INDEX "conversations_content_search_idx" ON "conversations" USING gin (to_tsvector('simple', "content"));