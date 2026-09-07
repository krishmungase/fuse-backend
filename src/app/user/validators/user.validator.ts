import { body } from "express-validator";

import { USER_STATUSES } from "../schema/user.schema";

const GENDERS = ["male", "female", "other", "prefer_not_to_say"];

const passwordRule = (field: string) =>
  body(field)
    .isString()
    .withMessage(`${field} must be a string`)
    .bail()
    .isLength({ min: 8, max: 128 })
    .withMessage(`${field} must be between 8 and 128 characters`);

export const registerValidator = [
  body("name")
    .isString()
    .withMessage("name must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("name is required")
    .isLength({ max: 100 })
    .withMessage("name must be 100 characters or fewer"),
  body("email")
    .isEmail()
    .withMessage("email must be a valid email")
    .normalizeEmail(),
];

export const resendVerificationValidator = [
  body("email")
    .isEmail()
    .withMessage("email must be a valid email")
    .normalizeEmail(),
];

export const verifyEmailValidator = [
  body("token")
    .isString()
    .withMessage("token must be a string")
    .bail()
    .notEmpty()
    .withMessage("token is required"),
];

export const setPasswordValidator = [
  body("setupToken")
    .isString()
    .withMessage("setupToken must be a string")
    .bail()
    .notEmpty()
    .withMessage("setupToken is required"),
  passwordRule("password"),
  body("confirmPassword")
    .isString()
    .withMessage("confirmPassword must be a string")
    .bail()
    .custom((value, { req }) => value === req.body.password)
    .withMessage("confirmPassword must match password"),
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
  passwordRule("newPassword"),
];

export const updateProfileValidator = [
  body("name").optional().isString().trim().notEmpty().isLength({ max: 100 }),
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
