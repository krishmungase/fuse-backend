/**
 * User module type contracts: SafeUser (User without hashPassword) plus
 * the request body interfaces consumed by the user controller endpoints.
 */
import { User, UserStatus } from "../schema/user.schema";

export type SafeUser = Omit<User, "hashPassword">;

export interface IRegisterBody {
  schoolId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  gender?: string;
  dob?: string;
  avatar?: string;
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
  firstName?: string;
  middleName?: string;
  lastName?: string;
  phone?: string;
  gender?: string;
  dob?: string;
  avatar?: string;
  status?: UserStatus;
}
