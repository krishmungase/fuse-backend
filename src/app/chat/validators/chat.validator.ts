import { body } from "express-validator";

export const sendMessageValidator = [
  body("message")
    .isString()
    .withMessage("message must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("message is required")
    .isLength({ max: 4000 })
    .withMessage("message must be 4000 characters or fewer"),
  body("model")
    .optional()
    .isString()
    .withMessage("model must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("model cannot be empty"),
];
