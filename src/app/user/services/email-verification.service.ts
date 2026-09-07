import ApiError from "../../../utils/api-error";
import env from "../../../config/env.config";
import ERROR_MESSAGE from "../../../constants/error-message.constants";

import RabbitMQService from "../../../utils/rabbitmq";

import TokenService from "./token.service";
import AuthTokenService from "./auth-token.service";
import { User } from "../schema/user.schema";
import { AuthTokenPurpose } from "../schema/auth-token.schema";

class EmailVerificationService {
  constructor(
    private tokenService: TokenService,
    private authTokenService: AuthTokenService,
    private rabbitmqService: RabbitMQService,
  ) {}

  private async issueToken(userId: string, purpose: AuthTokenPurpose) {
    await this.authTokenService.deleteForUser(userId, purpose);

    const signed = this.tokenService.signEmailToken(userId, purpose);

    await this.authTokenService.createToken({
      userId,
      purpose,
      jtiHash: this.tokenService.hashJti(signed.jti),
      expiresAt: signed.expiresAt,
    });

    return signed;
  }

  async assertNotRateLimited(userId: string): Promise<void> {
    const latest = await this.authTokenService.getLatestForUser(
      userId,
      "email_verification",
    );

    if (!latest) {
      return;
    }

    const elapsedSeconds = (Date.now() - latest.createdAt.getTime()) / 1000;

    if (elapsedSeconds < env.resendCooldownSeconds) {
      throw new ApiError(429, ERROR_MESSAGE.RESEND_COOLDOWN);
    }
  }

  async sendVerificationEmail(user: User): Promise<void> {
    const signed = await this.issueToken(user.id, "email_verification");

    await this.rabbitmqService.publishVerificationEmail({
      name: user.name,
      email: user.email,
      verificationLink: `${env.frontendUrl}/auth/verify-email?token=${encodeURIComponent(signed.token)}`,
      expiresInMinutes: Math.round(
        (signed.expiresAt.getTime() - Date.now()) / 60000,
      ),
      timestamp: new Date(),
    });
  }

  async issuePasswordSetupToken(userId: string): Promise<string> {
    const signed = await this.issueToken(userId, "password_setup");
    return signed.token;
  }

  async consumeToken(
    token: string,
    purpose: AuthTokenPurpose,
  ): Promise<string> {
    const invalidMessage =
      purpose === "email_verification"
        ? ERROR_MESSAGE.INVALID_VERIFICATION_TOKEN
        : ERROR_MESSAGE.INVALID_SETUP_TOKEN;

    let payload;
    try {
      payload = this.tokenService.verifyEmailToken(token, purpose);
    } catch (error) {
      const isExpired =
        error instanceof Error && error.name === "TokenExpiredError";

      throw new ApiError(
        400,
        isExpired && purpose === "email_verification"
          ? ERROR_MESSAGE.EXPIRED_VERIFICATION_TOKEN
          : invalidMessage,
      );
    }

    const record = await this.authTokenService.getByJtiHash(
      this.tokenService.hashJti(payload.jti),
    );

    if (!record || record.userId !== payload.sub || record.consumedAt) {
      throw new ApiError(400, invalidMessage);
    }

    if (record.expiresAt <= new Date()) {
      throw new ApiError(
        400,
        purpose === "email_verification"
          ? ERROR_MESSAGE.EXPIRED_VERIFICATION_TOKEN
          : invalidMessage,
      );
    }

    const consumed = await this.authTokenService.consumeToken(record.id);
    if (!consumed) {
      throw new ApiError(400, invalidMessage);
    }

    return record.userId;
  }
}

export default EmailVerificationService;
