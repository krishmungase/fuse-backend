import { Logger } from "winston";
import nodemailer, { Transporter } from "nodemailer";

import env from "../../../config/env.config";
import { VerificationEmailPayload } from "../../../types/queue.types";
import { buildVerificationEmail } from "../templates/verification-email.template";

class MailService {
  private transporter: Transporter;

  constructor(private logger: Logger) {
    this.transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.password,
      },
    });
  }

  async sendVerificationEmail(
    payload: VerificationEmailPayload,
  ): Promise<void> {
    const { name, email, verificationLink, expiresInMinutes } = payload;

    this.logger.info({ event: "VERIFICATION_EMAIL_ATTEMPT", email });

    const { html, text } = buildVerificationEmail({
      name,
      email,
      verificationLink,
      expiresInMinutes,
    });

    try {
      await this.transporter.sendMail({
        from: `"${env.smtp.fromName}" <${env.smtp.fromEmail}>`,
        to: email,
        subject: `Confirm your email for ${env.app.appName}`,
        html,
        text,
      });

      this.logger.info({ event: "VERIFICATION_EMAIL_SENT", email });
    } catch (error) {
      this.logger.error({ event: "VERIFICATION_EMAIL_FAILED", email, error });
      throw error;
    }
  }
}

export default MailService;
