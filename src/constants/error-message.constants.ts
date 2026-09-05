const ERROR_MESSAGE = {
  SERVER_ERROR: "Something went wrong",
  INVALID_JWT_TOKEN: "Invalid JWT token",
  UNAUTHORIZED_REQUEST: "Unauthorized request",
  PERMISSION_DENIED: "You are not allowed to perform this action",
  INVALID_CREDENTIALS: "Invalid email or password",
  USER_NOT_FOUND: "User not found",
  USER_ALREADY_EXISTS: "User with this email already exists",
  ACCOUNT_INACTIVE: "Account is not active",

  // Email verification flow
  INVALID_VERIFICATION_TOKEN:
    "This link is invalid or has already been used. Please request a new one.",
  EXPIRED_VERIFICATION_TOKEN:
    "This link has expired. Please request a new one.",
  INVALID_SETUP_TOKEN:
    "Your session has expired. Please verify your email again.",
  REGISTRATION_INCOMPLETE:
    "Your registration is not complete. Please check your email to set a password.",
  EMAIL_ALREADY_VERIFIED: "This email address is already verified",
  PASSWORD_MISMATCH: "Password and confirm password do not match",
  PASSWORD_ALREADY_SET: "A password has already been set for this account",
  // Chat
  CHAT_MODEL_NOT_FOUND: "The selected model is not available",
  NO_CHAT_MODEL_CONFIGURED: "No chat model is configured",

  RESEND_COOLDOWN:
    "A verification email was just sent. Please wait a moment before requesting another.",
};

export default ERROR_MESSAGE;
