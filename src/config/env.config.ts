/**
 * Environment configuration: loads the correct .env file based on NODE_ENV
 * and exposes a typed, validated config object (app, db, jwt, frontendUrl).
 * Throws at startup if any required variable is missing.
 */
import path from "path";
import dotenv from "dotenv";

import { EnvConfig, NodeEnv } from "../types/env.types";

const nodeEnv = (process.env.NODE_ENV || "development") as NodeEnv;

const envFilePath = path.resolve(
  process.cwd(),
  nodeEnv === "production"
    ? ".env.production"
    : nodeEnv === "test"
      ? ".env.test"
      : ".env",
);

dotenv.config({ path: envFilePath });

const getRequired = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: "${key}"`);
  }
  return value;
};

const getOptional = (key: string, fallback: string = ""): string => {
  return process.env[key] || fallback;
};

const getNumber = (key: string, fallback: number): number => {
  const value = process.env[key];
  const parsed = Number(value);
  return isNaN(parsed) ? fallback : parsed;
};

const env: EnvConfig = {
  app: {
    nodeEnv,
    port: getNumber("PORT", 3000),
    appName: getOptional("APP_NAME", "zenith-backend"),
    isDev: nodeEnv === "development",
    isProd: nodeEnv === "production",
    isTest: nodeEnv === "test",
  },

  db: {
    host: getRequired("DB_HOST"),
    port: getNumber("DB_PORT", 5432),
    name: getRequired("DB_NAME"),
    user: getRequired("DB_USER"),
    password: getRequired("DB_PASSWORD"),
    get url() {
      return `postgresql://${this.user}:${this.password}@${this.host}:${this.port}/${this.name}`;
    },
  },

  jwt: {
    accessSecret: getRequired("JWT_ACCESS_SECRET"),
    refreshSecret: getRequired("JWT_REFRESH_SECRET"),
    accessExpiresIn: getOptional("JWT_ACCESS_EXPIRES_IN", "15m"),
    refreshExpiresIn: getOptional("JWT_REFRESH_EXPIRES_IN", "7d"),
  },

  frontendUrl: getOptional("FRONTEND_URL", "http://localhost:5173"),
};

export default env;
