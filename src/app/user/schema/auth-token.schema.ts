/**
 * Drizzle schema for auth_tokens: the server-side half of the short-lived
 * tokens used by the email verification flow.
 *
 * The JWT handed to the user carries only a `jti`; the SHA-256 of that jti is
 * what lives here. That makes each token single-use (via consumedAt),
 * revocable (rows are deleted when a fresh token is issued), and useless to
 * anyone who reads the table.
 */
import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

import { users } from "./user.schema";

export const AUTH_TOKEN_PURPOSES = [
  "email_verification",
  "password_setup",
] as const;

export type AuthTokenPurpose = (typeof AUTH_TOKEN_PURPOSES)[number];

export const authTokenPurposeEnum = pgEnum(
  "auth_token_purpose",
  AUTH_TOKEN_PURPOSES as unknown as [string, ...string[]],
);

export const authTokens = pgTable(
  "auth_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    purpose: authTokenPurposeEnum("purpose").notNull(),

    jtiHash: text("jti_hash").notNull().unique(),

    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("auth_tokens_user_purpose_idx").on(table.userId, table.purpose),
  ],
);

export type AuthToken = typeof authTokens.$inferSelect;
export type NewAuthToken = typeof authTokens.$inferInsert;
