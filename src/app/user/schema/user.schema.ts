/**
 * Drizzle schema for the users table: defines columns, the user_status
 * pgEnum, and exports inferred User / NewUser / UpdateUser types used
 * throughout the user module.
 */
import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";

export const USER_STATUSES = [
  "pending",
  "active",
  "inactive",
  "suspended",
  "blocked",
  "deleted",
] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

export const userStatusEnum = pgEnum(
  "user_status",
  USER_STATUSES as unknown as [string, ...string[]],
);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: text("name").notNull(),

  email: text("email").notNull().unique(),

  // Null between registration and the set-password step. Every read path must
  // treat a null hash as "cannot authenticate" rather than assume a string.
  hashPassword: text("hash_password"),

  isEmailVerified: boolean("is_email_verified").notNull().default(false),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),

  gender: text("gender"),
  dob: date("dob"),
  avatar: text("avatar"),

  // Defaults to `pending` so no code path can mint a login-capable account
  // without explicitly going through email verification.
  status: userStatusEnum("status").notNull().default("pending"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UpdateUser = Partial<NewUser>;
