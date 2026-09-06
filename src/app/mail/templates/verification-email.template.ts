import env from "../../../config/env.config";

interface VerificationEmailTemplate {
  name: string;
  email: string;
  verificationLink: string;
  expiresInMinutes: number;
}

export const buildVerificationEmail = ({
  name,
  email,
  verificationLink,
  expiresInMinutes,
}: VerificationEmailTemplate): { html: string; text: string } => {
  const appName = env.app.appName;

  const text = [
    `Hi ${name},`,
    "",
    `Confirm your email address to finish setting up your ${appName} account.`,
    "",
    verificationLink,
    "",
    `This link expires in ${expiresInMinutes} minutes and can only be used once.`,
    "If you didn't sign up, you can safely ignore this email.",
  ].join("\n");

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;padding:40px 32px;">
      <tr>
        <td>
          <h1 style="margin:0 0 24px;font-size:22px;font-weight:600;color:#18181b;">Confirm your email</h1>

          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46;">
            Hi ${name}, confirm your email address to finish setting up your ${appName} account.
          </p>

          <p style="margin:0 0 32px;">
            <a href="${verificationLink}"
               style="display:inline-block;padding:12px 28px;border-radius:999px;background:#18181b;color:#ffffff;font-size:15px;font-weight:500;text-decoration:none;">
              Verify email
            </a>
          </p>

          <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#71717a;">
            This link expires in ${expiresInMinutes} minutes and can only be used once.
          </p>
          <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#71717a;">
            If the button doesn't work, paste this into your browser:<br />
            <span style="word-break:break-all;color:#3f3f46;">${verificationLink}</span>
          </p>

          <p style="margin:0;padding-top:24px;border-top:1px solid #e4e4e7;font-size:12px;line-height:1.6;color:#a1a1aa;">
            You're receiving this because someone signed up for ${appName} with ${email}.
            If that wasn't you, you can safely ignore this email.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { html, text };
};
