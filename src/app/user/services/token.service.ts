/**
 * JWT token service: signs and verifies access, refresh, and short-lived
 * email-flow tokens using the secrets and TTLs configured in env, with HS256.
 */
import crypto from "crypto";
import jwt from "jsonwebtoken";

import env from "../../../config/env.config";
import { CustomJwtPayload, EmailJwtPayload } from "../../../types/common.types";
import { AuthTokenPurpose } from "../schema/auth-token.schema";

export interface SignedEmailToken {
  token: string;
  jti: string;
  expiresAt: Date;
}

class TokenService {
  async signAccessToken(
    payload: object,
    exp: string | number = env.jwt.accessExpiresIn,
  ) {
    return jwt.sign(payload, env.jwt.accessSecret, {
      expiresIn: exp,
      algorithm: "HS256",
    } as jwt.SignOptions);
  }

  verifyAccessToken(token: string) {
    return jwt.verify(token, env.jwt.accessSecret) as CustomJwtPayload;
  }

  async signRefreshToken(
    payload: object,
    exp: string | number = env.jwt.refreshExpiresIn,
  ) {
    return jwt.sign(payload, env.jwt.refreshSecret, {
      expiresIn: exp,
      algorithm: "HS256",
    } as jwt.SignOptions);
  }

  verifyRefreshToken(token: string) {
    return jwt.verify(token, env.jwt.refreshSecret) as CustomJwtPayload;
  }

  /**
   * Signs a single-purpose token for the email verification flow. The caller is
   * expected to persist the returned jti (hashed) so the token can be consumed
   * exactly once; the token itself carries no user data beyond the subject.
   */
  signEmailToken(userId: string, purpose: AuthTokenPurpose): SignedEmailToken {
    const jti = crypto.randomUUID();
    const expiresIn =
      purpose === "email_verification"
        ? env.jwt.emailVerifyExpiresIn
        : env.jwt.passwordSetupExpiresIn;

    const token = jwt.sign({ sub: userId, purpose, jti }, env.jwt.emailSecret, {
      expiresIn,
      algorithm: "HS256",
    } as jwt.SignOptions);

    const { exp } = jwt.decode(token) as { exp: number };

    return { token, jti, expiresAt: new Date(exp * 1000) };
  }

  /**
   * Verifies signature and expiry, and asserts the token was minted for the
   * purpose being attempted — so a mail link can never be replayed against the
   * password-setup endpoint, or vice versa.
   */
  verifyEmailToken(token: string, purpose: AuthTokenPurpose): EmailJwtPayload {
    const decoded = jwt.verify(token, env.jwt.emailSecret) as EmailJwtPayload;

    if (decoded.purpose !== purpose || !decoded.sub || !decoded.jti) {
      throw new jwt.JsonWebTokenError("Token purpose mismatch");
    }

    return decoded;
  }

  /** Hashes a jti for storage; SHA-256 is enough for a random 128-bit value. */
  hashJti(jti: string): string {
    return crypto.createHash("sha256").update(jti).digest("hex");
  }
}

export default TokenService;
