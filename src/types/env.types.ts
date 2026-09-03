/**
 * Type definitions backing the env config: NodeEnv and the nested
 * AppConfig / DatabaseConfig / JwtConfig / SmtpConfig shapes consumed by
 * env.config.ts.
 */
export type NodeEnv = "development" | "production" | "test";

export interface AppConfig {
  nodeEnv: NodeEnv;
  port: number;
  appName: string;
  isDev: boolean;
  isProd: boolean;
  isTest: boolean;
  useRabbitMQ: boolean;
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

  /**
   * Secret for the short-lived tokens in verification emails. Kept separate
   * from the session secrets so a leaked mail link can never act as a session.
   */
  emailSecret: string;
  emailVerifyExpiresIn: string;
  passwordSetupExpiresIn: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  fromName: string;
  fromEmail: string;
}

export interface EnvConfig {
  app: AppConfig;
  db: DatabaseConfig;
  jwt: JwtConfig;
  smtp: SmtpConfig;
  rabbitmqUrl: string;
  frontendUrl: string;
  resendCooldownSeconds: number;
}
