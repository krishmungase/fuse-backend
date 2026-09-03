/**
 * User module type contracts: SafeUser (User without hashPassword) plus
 * the request body interfaces consumed by the auth and user controllers.
 */
import { User, UserStatus } from "../schema/user.schema";

export type SafeUser = Omit<User, "hashPassword">;

export interface IRegisterBody {
  name: string;
  email: string;
}

export interface IResendVerificationBody {
  email: string;
}

export interface IVerifyEmailBody {
  token: string;
}

export interface ISetPasswordBody {
  setupToken: string;
  password: string;
  confirmPassword: string;
}

export interface ILoginBody {
  email: string;
  password: string;
}

export interface IRefreshBody {
  refreshToken?: string;
}

export interface IChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

export interface IUpdateProfileBody {
  name?: string;
  phone?: string;
  gender?: string;
  dob?: string;
  avatar?: string;
  status?: UserStatus;
}
