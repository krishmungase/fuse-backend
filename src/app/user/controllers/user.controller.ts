/**
 * User controller: HTTP handlers for register, login, refresh, logout, me,
 * change-password, and profile update. Orchestrates UserService,
 * HashService, and TokenService, enforces login lockouts, and shapes
 * responses with ApiResponse / ApiError.
 */
import { Logger } from "winston";
import { Response } from "express";

import ApiError from "../../../utils/api-error";
import ApiResponse from "../../../utils/api-response";
import ERROR_MESSAGE from "../../../constants/error-message.constants";
import env from "../../../config/env.config";
import { CustomRequest } from "../../../types/common.types";

import UserService from "../services/user.service";
import HashService from "../services/hash.service";
import TokenService from "../services/token.service";
import { User } from "../schema/user.schema";
import {
  IChangePasswordBody,
  ILoginBody,
  IRefreshBody,
  IRegisterBody,
  IUpdateProfileBody,
} from "../types/user.types";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

const toSafeUser = (user: User) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hashPassword, ...safe } = user;
  return safe;
};

const buildFullName = (
  firstName: string,
  middleName: string,
  lastName: string,
): string => {
  return [firstName, middleName, lastName].filter(Boolean).join(" ").trim();
};

class UserController {
  constructor(
    private userService: UserService,
    private hashService: HashService,
    private tokenService: TokenService,
    private logger: Logger,
  ) {}

  async register(req: CustomRequest<IRegisterBody>, res: Response) {
    const data = req.body;

    this.logger.info({
      event: "USER_REGISTER_ATTEMPT",
      email: data.email,
      schoolId: data.schoolId,
    });

    const existing = await this.userService.getUserByEmail(data.email);
    if (existing) {
      throw new ApiError(409, ERROR_MESSAGE.USER_ALREADY_EXISTS);
    }

    const hashed = await this.hashService.hashData(data.password);

    const user = await this.userService.createUser({
      schoolId: data.schoolId,
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      fullName: buildFullName(data.firstName, data.middleName, data.lastName),
      email: data.email.toLowerCase(),
      hashPassword: hashed,
      phone: data.phone ?? null,
      gender: data.gender ?? null,
      dob: data.dob ?? null,
      avatar: data.avatar ?? null,
    });

    this.logger.info({
      event: "USER_REGISTER_SUCCESS",
      userId: user.id,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(201, toSafeUser(user), "User registered successfully."),
      );
  }

  async login(req: CustomRequest<ILoginBody>, res: Response) {
    const { email, password } = req.body;

    this.logger.info({ event: "USER_LOGIN_ATTEMPT", email });

    const user = await this.userService.getUserByEmail(email.toLowerCase());
    if (!user) {
      throw new ApiError(401, ERROR_MESSAGE.INVALID_CREDENTIALS);
    }

    if (user.status !== "active") {
      throw new ApiError(403, ERROR_MESSAGE.ACCOUNT_INACTIVE);
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ApiError(423, ERROR_MESSAGE.ACCOUNT_LOCKED);
    }

    const isMatch = await this.hashService.hashCompare(
      password,
      user.hashPassword,
    );

    if (!isMatch) {
      const attempts = user.failedLoginAttempts + 1;
      const shouldLock = attempts >= MAX_FAILED_ATTEMPTS;

      await this.userService.updateUser(user.id, {
        failedLoginAttempts: attempts,
        lockedUntil: shouldLock
          ? new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000)
          : null,
      });

      throw new ApiError(401, ERROR_MESSAGE.INVALID_CREDENTIALS);
    }

    const updated = await this.userService.updateUser(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: req.ip ?? null,
    });

    const accessToken = await this.tokenService.signAccessToken({
      user: { id: user.id },
    });
    const refreshToken = await this.tokenService.signRefreshToken({
      user: { id: user.id },
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: env.app.isProd,
      sameSite: "lax",
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: env.app.isProd,
      sameSite: "lax",
    });

    this.logger.info({ event: "USER_LOGIN_SUCCESS", userId: user.id });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          user: toSafeUser(updated),
          accessToken,
          refreshToken,
        },
        "Login successful.",
      ),
    );
  }

  async refresh(req: CustomRequest<IRefreshBody>, res: Response) {
    const token = req.body?.refreshToken || req.cookies?.refreshToken;

    if (!token) {
      throw new ApiError(401, ERROR_MESSAGE.UNAUTHORIZED_REQUEST);
    }

    let decoded;
    try {
      decoded = this.tokenService.verifyRefreshToken(token);
    } catch {
      throw new ApiError(401, ERROR_MESSAGE.INVALID_JWT_TOKEN);
    }

    if (!decoded?.user?.id) {
      throw new ApiError(401, ERROR_MESSAGE.INVALID_JWT_TOKEN);
    }

    const user = await this.userService.getUserById(decoded.user.id);
    if (!user) {
      throw new ApiError(401, ERROR_MESSAGE.USER_NOT_FOUND);
    }

    const accessToken = await this.tokenService.signAccessToken({
      user: { id: user.id },
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: env.app.isProd,
      sameSite: "lax",
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { accessToken }, "Token refreshed."));
  }

  async logout(_req: CustomRequest, res: Response) {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Logged out successfully."));
  }

  async me(req: CustomRequest, res: Response) {
    const user = req.user!;
    return res
      .status(200)
      .json(new ApiResponse(200, user, "Current user fetched."));
  }

  async changePassword(req: CustomRequest<IChangePasswordBody>, res: Response) {
    const { id: userId } = req.user!;
    const { currentPassword, newPassword } = req.body;

    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new ApiError(404, ERROR_MESSAGE.USER_NOT_FOUND);
    }

    const isMatch = await this.hashService.hashCompare(
      currentPassword,
      user.hashPassword,
    );
    if (!isMatch) {
      throw new ApiError(401, ERROR_MESSAGE.INVALID_CREDENTIALS);
    }

    const hashed = await this.hashService.hashData(newPassword);
    await this.userService.updateUser(userId, { hashPassword: hashed });

    this.logger.info({ event: "USER_PASSWORD_CHANGED", userId });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Password updated successfully."));
  }

  async updateProfile(req: CustomRequest<IUpdateProfileBody>, res: Response) {
    const { id: userId } = req.user!;
    const data = req.body;

    const existing = await this.userService.getUserById(userId);
    if (!existing) {
      throw new ApiError(404, ERROR_MESSAGE.USER_NOT_FOUND);
    }

    const firstName = data.firstName ?? existing.firstName;
    const middleName = data.middleName ?? existing.middleName;
    const lastName = data.lastName ?? existing.lastName;

    const updated = await this.userService.updateUser(userId, {
      ...data,
      fullName: buildFullName(firstName, middleName, lastName),
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          toSafeUser(updated),
          "Profile updated successfully.",
        ),
      );
  }
}

export default UserController;
