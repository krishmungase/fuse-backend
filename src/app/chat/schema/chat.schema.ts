import {
  pgTable,
  uuid,
  text,
  index,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

import { users } from "../../user/schema/user.schema";

export const CONVERSATION_ROLES = ["user", "assistant"] as const;

export type ConversationRole = (typeof CONVERSATION_ROLES)[number];

export const conversationRoleEnum = pgEnum(
  "conversation_role",
  CONVERSATION_ROLES as unknown as [string, ...string[]],
);

export const chats = pgTable(
  "chats",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    title: text("title").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("chats_user_id_updated_at_idx").on(table.userId, table.updatedAt),
  ],
);

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    chatId: uuid("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),

    role: conversationRoleEnum("role").notNull(),

    content: text("content").notNull(),

    model: text("model"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("conversations_chat_id_created_at_idx").on(
      table.chatId,
      table.createdAt,
    ),
  ],
);

export type Chat = typeof chats.$inferSelect;
export type NewChat = typeof chats.$inferInsert;

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
