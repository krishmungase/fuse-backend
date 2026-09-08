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

const getBoolean = (key: string, fallback: boolean): boolean => {
  const value = process.env[key];
  if (value === undefined || value === "") return fallback;
  return ["true", "1", "yes"].includes(value.trim().toLowerCase());
};

const useRabbitMQ = getBoolean("USE_RABBITMQ_SERVICE", true);

const env: EnvConfig = {
  app: {
    nodeEnv,
    port: getNumber("PORT", 3000),
    appName: getOptional("APP_NAME", "zenith-backend"),
    isDev: nodeEnv === "development",
    isProd: nodeEnv === "production",
    isTest: nodeEnv === "test",
    useRabbitMQ,
  },

  db: {
    host: getRequired("DB_HOST"),
    port: getNumber("DB_PORT", 5432),
    name: getRequired("DB_NAME"),
    user: getRequired("DB_USER"),
    password: getRequired("DB_PASSWORD"),
    get url() {
      const user = encodeURIComponent(this.user);
      const password = encodeURIComponent(this.password);
      const sslMode = nodeEnv === "production" ? "no-verify" : "disable";

      return `postgresql://${user}:${password}@${this.host}:${this.port}/${this.name}?sslmode=${sslMode}`;
    },
  },

  jwt: {
    accessSecret: getRequired("JWT_ACCESS_SECRET"),
    refreshSecret: getRequired("JWT_REFRESH_SECRET"),
    accessExpiresIn: getOptional("JWT_ACCESS_EXPIRES_IN", "15m"),
    refreshExpiresIn: getOptional("JWT_REFRESH_EXPIRES_IN", "7d"),

    emailSecret: getRequired("JWT_EMAIL_SECRET"),
    emailVerifyExpiresIn: getOptional("JWT_EMAIL_VERIFY_EXPIRES_IN", "30m"),
    passwordSetupExpiresIn: getOptional("JWT_PASSWORD_SETUP_EXPIRES_IN", "15m"),
  },

  smtp: {
    host: getRequired("SMTP_HOST"),
    port: getNumber("SMTP_PORT", 587),
    user: getRequired("SMTP_USER"),
    password: getRequired("SMTP_PASSWORD"),
    fromName: getOptional("SMTP_FROM_NAME", "Fuse AI"),
    fromEmail: getRequired("SMTP_FROM_EMAIL"),
  },

  llm: {
    groqApiKey: getOptional("GROQ_API_KEY"),
    openaiApiKey: getOptional("OPENAI_API_KEY"),
    serpApiKey: getOptional("SERP_API_KEY"),
  },

  rabbitmqUrl: useRabbitMQ
    ? getRequired("RABBITMQ_URL")
    : getOptional("RABBITMQ_URL"),

  frontendUrl: getOptional("FRONTEND_URL", "http://localhost:5173"),

  resendCooldownSeconds: getNumber("MAIL_RESEND_COOLDOWN_SECONDS", 60),
};

export default env;
