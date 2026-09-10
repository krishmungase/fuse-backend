import crypto from "crypto";

import env from "../../../config/env.config";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const KEY_LENGTH = 32;
const SEPARATOR = ".";

const getKey = (): Buffer => {
  const key = Buffer.from(env.security.tokenEncryptionKey, "base64");

  if (key.length !== KEY_LENGTH) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY must be 32 bytes encoded as base64. Generate one with: openssl rand -base64 32",
    );
  }

  return key;
};

export const encryptSecret = (plainText: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);

  return [iv, cipher.getAuthTag(), encrypted]
    .map((part) => part.toString("base64"))
    .join(SEPARATOR);
};

export const decryptSecret = (payload: string): string => {
  const [ivPart, tagPart, dataPart] = payload.split(SEPARATOR);

  if (!ivPart || !tagPart || !dataPart) {
    throw new Error("Stored secret is malformed.");
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivPart, "base64"),
  );

  decipher.setAuthTag(Buffer.from(tagPart, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(dataPart, "base64")),
    decipher.final(),
  ]).toString("utf8");
};
