/**
 * Auth controller: the registration -> email verification -> set password
 * flow, plus login, refresh, and logout.
 *
 * Registration deliberately creates a `pending` user with no password hash.
 * The account only becomes usable once the emailed link is redeemed and a
 * password is set, at which point it flips to `active`.
 */
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

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

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

  /**
   * Step 1. Records the name and email as a pending user and queues the
   * verification link. Signing up again with a pending address re-sends the
   * link rather than erroring, since the user has no way to log in yet.
   */
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

      // Name may have changed since the abandoned attempt; keep the latest.
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

  /**
   * Re-sends the verification link. Always answers with the same message
   * whether or not the address exists, so the endpoint can't be used to test
   * which emails are registered.
   */
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

  /**
   * Step 2. Redeems the token from the emailed link and hands back a separate,
   * shorter-lived token that authorises exactly one password write. The link
   * token itself is burned here, so it can't be replayed later.
   */
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

  /**
   * Step 3. Writes the password and activates the account. No session is
   * issued: the user is sent to the login page to sign in with the
   * credentials they just chose.
   */
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

    // A pending account has no password to compare against, so this is
    // reported distinctly rather than as bad credentials.
    if (user.status === "pending" || !user.hashPassword) {
      throw new ApiError(403, ERROR_MESSAGE.REGISTRATION_INCOMPLETE);
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

    res.cookie("accessToken", accessToken, authCookieOptions);
    res.cookie("refreshToken", refreshToken, authCookieOptions);

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
