/**
 * express-validator chains for the chat endpoints. Used by the routes
 * together with validateMiddleware to enforce request body shape.
 */
import { body } from "express-validator";

import { CHAT_MODEL_IDS } from "../../workflow";

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
  // Rejecting anything outside the registry is what keeps a client from
  // running a model -- or a provider -- you never approved.
  body("model")
    .optional()
    .isIn(CHAT_MODEL_IDS)
    .withMessage(`model must be one of: ${CHAT_MODEL_IDS.join(", ")}`),
];
