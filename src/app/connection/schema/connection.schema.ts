import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "../../user/schema/user.schema";

export const CONNECTION_STATUSES = ["active", "revoked"] as const;

export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];

export const connectionStatusEnum = pgEnum(
  "connection_status",
  CONNECTION_STATUSES as unknown as [string, ...string[]],
);

export const connections = pgTable(
  "connections",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    provider: text("provider").notNull(),

    accountEmail: text("account_email"),

    scopes: jsonb("scopes").$type<string[]>().notNull().default([]),

    accessToken: text("access_token").notNull(),

    refreshToken: text("refresh_token"),

    expiresAt: timestamp("expires_at", { withTimezone: true }),

    status: connectionStatusEnum("status").notNull().default("active"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("connections_user_provider_unique").on(table.userId, table.provider),
    index("connections_user_id_idx").on(table.userId),
  ],
);

export type Connection = typeof connections.$inferSelect;
export type NewConnection = typeof connections.$inferInsert;
