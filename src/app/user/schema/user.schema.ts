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

  hashPassword: text("hash_password"),

  isEmailVerified: boolean("is_email_verified").notNull().default(false),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),

  gender: text("gender"),
  dob: date("dob"),
  avatar: text("avatar"),

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
