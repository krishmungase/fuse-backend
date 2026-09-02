/**
 * JWT token service: signs and verifies access and refresh tokens using
 * the secrets and TTLs configured in env, with HS256.
 */
import jwt from "jsonwebtoken";

import env from "../../../config/env.config";
import { CustomJwtPayload } from "../../../types/common.types";

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
}

export default TokenService;
