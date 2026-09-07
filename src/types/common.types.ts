import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";

import { SafeUser } from "../app/user/types/user.types";
import { AuthTokenPurpose } from "../app/user/schema/auth-token.schema";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends SafeUser {}
  }
}

export interface CustomJwtPayload extends JwtPayload {
  user: { id: string };
}

export interface EmailJwtPayload extends JwtPayload {
  sub: string;
  jti: string;
  purpose: AuthTokenPurpose;
}

export interface CustomRequest<T = null> extends Request {
  body: T;
  user?: Express.User;
}
