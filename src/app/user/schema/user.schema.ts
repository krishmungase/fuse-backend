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
  integer,
  varchar,
  pgEnum,
} from "drizzle-orm/pg-core";

export const USER_STATUSES = [
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

  schoolId: uuid("school_id").notNull(),

  firstName: text("first_name").notNull(),
  middleName: text("middle_name").notNull(),
  lastName: text("last_name").notNull(),
  fullName: text("full_name").notNull(),

  email: text("email").notNull().unique(),
  hashPassword: text("hash_password").notNull(),
  phone: text("phone"),

  isEmailVerified: boolean("is_email_verified").notNull().default(false),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),

  isPhoneVerified: boolean("is_phone_verified").notNull().default(false),
  phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),

  gender: text("gender"),
  dob: date("dob"),
  avatar: text("avatar"),

  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  lastLoginIp: varchar("last_login_ip", { length: 45 }),
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),

  status: userStatusEnum("status").notNull().default("active"),

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
