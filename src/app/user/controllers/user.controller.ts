import { Logger } from "winston";
import { Response } from "express";

import ApiError from "../../../utils/api-error";
import ApiResponse from "../../../utils/api-response";
import ERROR_MESSAGE from "../../../constants/error-message.constants";
import { CustomRequest } from "../../../types/common.types";

import UserService from "../services/user.service";
import HashService from "../services/hash.service";
import { toSafeUser } from "../utils/user.utils";
import { IChangePasswordBody, IUpdateProfileBody } from "../types/user.types";

class UserController {
  constructor(
    private userService: UserService,
    private hashService: HashService,
    private logger: Logger,
  ) {}

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

    if (!user.hashPassword) {
      throw new ApiError(403, ERROR_MESSAGE.REGISTRATION_INCOMPLETE);
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

    const existing = await this.userService.getUserById(userId);
    if (!existing) {
      throw new ApiError(404, ERROR_MESSAGE.USER_NOT_FOUND);
    }

    const updated = await this.userService.updateUser(userId, req.body);

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
