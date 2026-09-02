/**
 * Shared application types: augments Express with the authenticated user
 * shape and defines CustomRequest/CustomJwtPayload helpers used by
 * controllers and middlewares.
 */
import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";

import { SafeUser } from "../app/user/types/user.types";

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

export interface CustomRequest<T = null> extends Request {
  body: T;
  user?: Express.User;
}
