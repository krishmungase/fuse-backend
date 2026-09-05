/**
 * Router for chat. Mounted at /api/v1/chat and guarded by JWT: /models feeds
 * the client's model picker, and POST / runs a message through the workflow
 * using whichever model the request selected.
 */
import { Router } from "express";

import logger from "../../../logger/winston.logger";
import asyncHandler from "../../../utils/async-handler";
import { verifyJWT } from "../../../middlewares/auth.middleware";
import validateMiddleware from "../../../middlewares/validate.middleware";

import { users } from "../../../schema/user.schema";
import { chatModels } from "../schema/chat-model.schema";
import UserService from "../../user/services/user.service";
import ChatModelService from "../services/chat-model.service";
import ChatController from "../controllers/chat.controller";
import { sendMessageValidator } from "../validators/chat.validator";

const chatRouter = (): Router => {
  const chatRouter: Router = Router();

  const userService = new UserService(users);
  const chatModelService = new ChatModelService(chatModels);

  const chatController = new ChatController(
    userService,
    chatModelService,
    logger,
  );

  chatRouter.use(verifyJWT);

  chatRouter.get(
    "/models",
    asyncHandler((req, res) => chatController.listModels(req, res)),
  );

  chatRouter.post(
    "/",
    sendMessageValidator,
    validateMiddleware,
    asyncHandler((req, res) => chatController.sendMessage(req, res)),
  );

  return chatRouter;
};

export default chatRouter;
