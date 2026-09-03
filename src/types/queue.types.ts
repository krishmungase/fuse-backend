/**
 * RabbitMQ topology names and the payloads that travel over it.
 */
export const MAIL_QUEUES = {
  VERIFICATION: "verification",
  VERIFICATION_FAILED: "verification.failed",
} as const;

export const MAIL_EXCHANGES = {
  MAIN: "verification.exchange",
  DEAD_LETTER: "verification.dlx",
} as const;

export const ROUTING_KEYS = {
  VERIFICATION: "verification",
} as const;

export interface VerificationEmailPayload {
  name: string;
  email: string;
  verificationLink: string;
  expiresInMinutes: number;
  timestamp: Date;
}
