import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const CHAT_PROVIDERS = ["groq", "openai"] as const;

export type ChatProvider = (typeof CHAT_PROVIDERS)[number];

export const chatProviderEnum = pgEnum(
  "chat_provider",
  CHAT_PROVIDERS as unknown as [string, ...string[]],
);

export const chatModels = pgTable("chat_models", {
  id: uuid("id").defaultRandom().primaryKey(),

  slug: text("slug").notNull().unique(),

  label: text("label").notNull(),

  provider: chatProviderEnum("provider").notNull(),

  model: text("model").notNull(),

  isActive: boolean("is_active").notNull().default(true),

  isDefault: boolean("is_default").notNull().default(false),

  sortOrder: integer("sort_order").notNull().default(0),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ChatModel = typeof chatModels.$inferSelect;
export type NewChatModel = typeof chatModels.$inferInsert;
export type UpdateChatModel = Partial<NewChatModel>;
