/**
 * Centralized error message strings returned by ApiError responses,
 * kept in one place so wording stays consistent across the API.
 */
const ERROR_MESSAGE = {
  SERVER_ERROR: "Something went wrong",
  INVALID_JWT_TOKEN: "Invalid JWT token",
  UNAUTHORIZED_REQUEST: "Unauthorized request",
  PERMISSION_DENIED: "You are not allowed to perform this action",
  INVALID_CREDENTIALS: "Invalid email or password",
  USER_NOT_FOUND: "User not found",
  USER_ALREADY_EXISTS: "User with this email already exists",
  ACCOUNT_LOCKED: "Account is locked. Try again later.",
  ACCOUNT_INACTIVE: "Account is not active",
};

export default ERROR_MESSAGE;
