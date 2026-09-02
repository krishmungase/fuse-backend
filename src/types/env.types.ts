/**
 * Type definitions backing the env config: NodeEnv and the nested
 * AppConfig / DatabaseConfig / JwtConfig shapes consumed by env.config.ts.
 */
export type NodeEnv = "development" | "production" | "test";

export interface AppConfig {
  nodeEnv: NodeEnv;
  port: number;
  appName: string;
  isDev: boolean;
  isProd: boolean;
  isTest: boolean;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
  url: string;
}

export interface JwtConfig {
  accessSecret: string;
  refreshSecret: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
}

export interface EnvConfig {
  app: AppConfig;
  db: DatabaseConfig;
  jwt: JwtConfig;
  frontendUrl: string;
}
