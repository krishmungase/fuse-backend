import { body, param } from "express-validator";

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
  body("chatId").optional().isUUID().withMessage("chatId must be a valid id"),
];

export const chatIdValidator = [
  param("id").isUUID().withMessage("Invalid chat id"),
];
