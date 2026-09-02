/**
 * express-validator chains for the user endpoints: registration, login,
 * refresh, change-password, and profile update. Used by the routes
 * together with validateMiddleware to enforce request body shape.
 */
import { body } from "express-validator";

import { USER_STATUSES } from "../schema/user.schema";

const GENDERS = ["male", "female", "other", "prefer_not_to_say"];

export const registerValidator = [
  body("schoolId").isUUID().withMessage("schoolId must be a valid UUID"),
  body("firstName")
    .isString()
    .withMessage("firstName must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("firstName is required")
    .isLength({ max: 100 })
    .withMessage("firstName must be 100 characters or fewer"),
  body("middleName")
    .isString()
    .withMessage("middleName must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("middleName is required")
    .isLength({ max: 100 })
    .withMessage("middleName must be 100 characters or fewer"),
  body("lastName")
    .isString()
    .withMessage("lastName must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("lastName is required")
    .isLength({ max: 100 })
    .withMessage("lastName must be 100 characters or fewer"),
  body("email")
    .isEmail()
    .withMessage("email must be a valid email")
    .normalizeEmail(),
  body("password")
    .isString()
    .withMessage("password must be a string")
    .bail()
    .isLength({ min: 8, max: 128 })
    .withMessage("password must be between 8 and 128 characters"),
  body("phone")
    .optional({ nullable: true, values: "falsy" })
    .isString()
    .isLength({ max: 20 }),
  body("gender")
    .optional({ nullable: true, values: "falsy" })
    .isIn(GENDERS)
    .withMessage(`gender must be one of: ${GENDERS.join(", ")}`),
  body("dob")
    .optional({ nullable: true, values: "falsy" })
    .isISO8601()
    .withMessage("dob must be a valid ISO date"),
  body("avatar").optional({ nullable: true, values: "falsy" }).isString(),
];

export const loginValidator = [
  body("email")
    .isEmail()
    .withMessage("email must be a valid email")
    .normalizeEmail(),
  body("password")
    .isString()
    .withMessage("password must be a string")
    .bail()
    .notEmpty()
    .withMessage("password is required"),
];

export const refreshValidator = [
  body("refreshToken")
    .optional()
    .isString()
    .withMessage("refreshToken must be a string"),
];

export const changePasswordValidator = [
  body("currentPassword")
    .isString()
    .withMessage("currentPassword must be a string")
    .bail()
    .notEmpty()
    .withMessage("currentPassword is required"),
  body("newPassword")
    .isString()
    .withMessage("newPassword must be a string")
    .bail()
    .isLength({ min: 8, max: 128 })
    .withMessage("newPassword must be between 8 and 128 characters"),
];

export const updateProfileValidator = [
  body("firstName")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .isLength({ max: 100 }),
  body("middleName")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .isLength({ max: 100 }),
  body("lastName")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .isLength({ max: 100 }),
  body("phone")
    .optional({ nullable: true, values: "falsy" })
    .isString()
    .isLength({ max: 20 }),
  body("gender")
    .optional({ nullable: true, values: "falsy" })
    .isIn(GENDERS)
    .withMessage(`gender must be one of: ${GENDERS.join(", ")}`),
  body("dob")
    .optional({ nullable: true, values: "falsy" })
    .isISO8601()
    .withMessage("dob must be a valid ISO date"),
  body("avatar").optional({ nullable: true, values: "falsy" }).isString(),
  body("status")
    .optional()
    .isIn(USER_STATUSES as unknown as string[])
    .withMessage(`status must be one of: ${USER_STATUSES.join(", ")}`),
];
