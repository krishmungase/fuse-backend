/**
 * Shared helpers for the user module: response sanitisation and the cookie
 * options used when issuing a session.
 */
import { CookieOptions } from "express";

import env from "../../../config/env.config";
import { User } from "../schema/user.schema";
import { SafeUser } from "../types/user.types";

/** Strips the password hash before a user is put on the wire. */
export const toSafeUser = (user: User): SafeUser => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hashPassword, ...safe } = user;
  return safe;
};

export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.app.isProd,
  sameSite: "lax",
};
