import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import env from "../config/env.config";
import logger from "../logger/winston.logger";
import { users } from "../app/user/schema/user.schema";
import { authTokens } from "../app/user/schema/auth-token.schema";

const schema = { users, authTokens };

export const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
  ssl: env.app.isProd ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const db: NodePgDatabase<typeof schema> = drizzle(pool, {
  schema,
  logger: env.app.isDev,
});

export type DB = typeof db;

export const connectDatabase = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    logger.info(`Database connected successfully`);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        "Database connection failed:" +
          JSON.stringify({
            message: error.message,
            stack: error.stack,
          }),
      );
    } else {
      logger.error("Database connection failed:", error);
    }
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await pool.end();
  logger.info("Database disconnected");
};
