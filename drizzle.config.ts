import path from "path";
import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

const nodeEnv = process.env.NODE_ENV || "development";
const envFile =
  nodeEnv === "production"
    ? ".env.production"
    : nodeEnv === "test"
      ? ".env.test"
      : ".env";

dotenv.config({ path: path.resolve(process.cwd(), envFile), override: true });

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[drizzle.config] Missing required env var "${key}" (env file: ${envFile})`,
    );
  }
  return value;
};

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/*",
  out: "./drizzle",
  dbCredentials: {
    host: required("DB_HOST"),
    port: Number(process.env.DB_PORT ?? 5432),
    user: required("DB_USER"),
    password: required("DB_PASSWORD"),
    database: required("DB_NAME"),
    ssl: nodeEnv === "production" ? { rejectUnauthorized: false } : false,
  },
  verbose: true,
  strict: true,
});
