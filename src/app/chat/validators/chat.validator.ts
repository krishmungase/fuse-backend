import { body, param, query } from "express-validator";

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

export const listChatsValidator = [
  query("q")
    .optional()
    .isString()
    .withMessage("q must be a string")
    .bail()
    .trim()
    .isLength({ max: 200 })
    .withMessage("q must be 200 characters or fewer"),
];

export const renameChatValidator = [
  param("id").isUUID().withMessage("Invalid chat id"),
  body("title")
    .isString()
    .withMessage("title must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("title is required")
    .isLength({ max: 200 })
    .withMessage("title must be 200 characters or fewer"),
];
