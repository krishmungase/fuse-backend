import { Logger } from "winston";
import { Response } from "express";

import ApiError from "../../../utils/api-error";
import ApiResponse from "../../../utils/api-response";
import ERROR_MESSAGE from "../../../constants/error-message.constants";
import { CustomRequest } from "../../../types/common.types";

import UserService from "../services/user.service";
import HashService from "../services/hash.service";
import TokenService from "../services/token.service";
import EmailVerificationService from "../services/email-verification.service";
import { authCookieOptions, toSafeUser } from "../utils/user.utils";
import {
  ILoginBody,
  IRefreshBody,
  IRegisterBody,
  IResendVerificationBody,
  ISetPasswordBody,
  IVerifyEmailBody,
} from "../types/user.types";

const CHECK_INBOX_MESSAGE =
  "If that email can be registered, a verification link is on its way.";

class AuthController {
  constructor(
    private userService: UserService,
    private hashService: HashService,
    private tokenService: TokenService,
    private emailVerificationService: EmailVerificationService,
    private logger: Logger,
  ) {}

  async register(req: CustomRequest<IRegisterBody>, res: Response) {
    const email = req.body.email.toLowerCase();
    const name = req.body.name.trim();

    this.logger.info({ event: "USER_REGISTER_ATTEMPT", email });

    const existing = await this.userService.getUserByEmail(email);

    if (existing && existing.status !== "pending") {
      throw new ApiError(409, ERROR_MESSAGE.USER_ALREADY_EXISTS);
    }

    if (existing) {
      await this.emailVerificationService.assertNotRateLimited(existing.id);

      const refreshed = await this.userService.updateUser(existing.id, {
        name,
      });
      await this.emailVerificationService.sendVerificationEmail(refreshed);

      this.logger.info({
        event: "USER_REGISTER_RESENT",
        userId: existing.id,
      });

      return res
        .status(202)
        .json(new ApiResponse(202, { email }, CHECK_INBOX_MESSAGE));
    }

    const user = await this.userService.createUser({
      name,
      email,
      status: "pending",
    });

    await this.emailVerificationService.sendVerificationEmail(user);

    this.logger.info({ event: "USER_REGISTER_SUCCESS", userId: user.id });

    return res
      .status(202)
      .json(new ApiResponse(202, { email }, CHECK_INBOX_MESSAGE));
  }

  async resendVerification(
    req: CustomRequest<IResendVerificationBody>,
    res: Response,
  ) {
    const email = req.body.email.toLowerCase();
    const user = await this.userService.getUserByEmail(email);

    if (user && user.status === "pending") {
      await this.emailVerificationService.assertNotRateLimited(user.id);
      await this.emailVerificationService.sendVerificationEmail(user);

      this.logger.info({ event: "VERIFICATION_RESENT", userId: user.id });
    }

    return res
      .status(202)
      .json(new ApiResponse(202, { email }, CHECK_INBOX_MESSAGE));
  }

  async verifyEmail(req: CustomRequest<IVerifyEmailBody>, res: Response) {
    const userId = await this.emailVerificationService.consumeToken(
      req.body.token,
      "email_verification",
    );

    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new ApiError(400, ERROR_MESSAGE.INVALID_VERIFICATION_TOKEN);
    }

    if (user.hashPassword) {
      throw new ApiError(409, ERROR_MESSAGE.PASSWORD_ALREADY_SET);
    }

    await this.userService.updateUser(user.id, {
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    });

    const setupToken =
      await this.emailVerificationService.issuePasswordSetupToken(user.id);

    this.logger.info({ event: "EMAIL_VERIFIED", userId: user.id });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { setupToken, name: user.name, email: user.email },
          "Email verified. You can now set your password.",
        ),
      );
  }

  async setPassword(req: CustomRequest<ISetPasswordBody>, res: Response) {
    const { setupToken, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      throw new ApiError(400, ERROR_MESSAGE.PASSWORD_MISMATCH);
    }

    const userId = await this.emailVerificationService.consumeToken(
      setupToken,
      "password_setup",
    );

    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new ApiError(400, ERROR_MESSAGE.INVALID_SETUP_TOKEN);
    }

    if (user.hashPassword) {
      throw new ApiError(409, ERROR_MESSAGE.PASSWORD_ALREADY_SET);
    }

    const hashed = await this.hashService.hashData(password);

    await this.userService.updateUser(user.id, {
      hashPassword: hashed,
      status: "active",
    });

    this.logger.info({ event: "PASSWORD_SET", userId: user.id });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { email: user.email },
          "Password created successfully. Please sign in.",
        ),
      );
  }

  async login(req: CustomRequest<ILoginBody>, res: Response) {
    const { email, password } = req.body;

    this.logger.info({ event: "USER_LOGIN_ATTEMPT", email });

    const user = await this.userService.getUserByEmail(email.toLowerCase());
    if (!user) {
      throw new ApiError(401, ERROR_MESSAGE.INVALID_CREDENTIALS);
    }

    if (user.status === "pending" || !user.hashPassword) {
      throw new ApiError(403, ERROR_MESSAGE.REGISTRATION_INCOMPLETE);
    }

    if (user.status !== "active") {
      throw new ApiError(403, ERROR_MESSAGE.ACCOUNT_INACTIVE);
    }

    const isMatch = await this.hashService.hashCompare(
      password,
      user.hashPassword,
    );

    if (!isMatch) {
      throw new ApiError(401, ERROR_MESSAGE.INVALID_CREDENTIALS);
    }

    const accessToken = await this.tokenService.signAccessToken({
      user: { id: user.id },
    });
    const refreshToken = await this.tokenService.signRefreshToken({
      user: { id: user.id },
    });

    res.cookie("accessToken", accessToken, authCookieOptions);
    res.cookie("refreshToken", refreshToken, authCookieOptions);

    this.logger.info({ event: "USER_LOGIN_SUCCESS", userId: user.id });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          user: toSafeUser(user),
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

    if (user.status !== "active") {
      throw new ApiError(403, ERROR_MESSAGE.ACCOUNT_INACTIVE);
    }

    const accessToken = await this.tokenService.signAccessToken({
      user: { id: user.id },
    });

    res.cookie("accessToken", accessToken, authCookieOptions);

    return res
      .status(200)
      .json(new ApiResponse(200, { accessToken }, "Token refreshed."));
  }

  async logout(_req: CustomRequest, res: Response) {
    res.clearCookie("accessToken", authCookieOptions);
    res.clearCookie("refreshToken", authCookieOptions);

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Logged out successfully."));
  }
}

export default AuthController;
