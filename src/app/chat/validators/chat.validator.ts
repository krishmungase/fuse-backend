/**
 * express-validator chains for the chat endpoints. Used by the routes
 * together with validateMiddleware to enforce request body shape.
 */
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
];
