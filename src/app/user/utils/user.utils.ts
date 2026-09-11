import { CookieOptions } from "express";

import env from "../../../config/env.config";
import { User } from "../schema/user.schema";
import { SafeUser } from "../types/user.types";

export const toSafeUser = (user: User): SafeUser => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hashPassword, ...safe } = user;
  return safe;
};

export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.app.isProd,
  sameSite: env.app.isProd ? "none" : "lax",
};
