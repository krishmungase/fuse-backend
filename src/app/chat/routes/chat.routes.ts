import { Router } from "express";

import logger from "../../../logger/winston.logger";
import asyncHandler from "../../../utils/async-handler";
import { verifyJWT } from "../../../middlewares/auth.middleware";
import validateMiddleware from "../../../middlewares/validate.middleware";

import { users } from "../../../schema/user.schema";
import { chatModels } from "../schema/chat-model.schema";
import { chats, conversations } from "../schema/chat.schema";
import UserService from "../../user/services/user.service";
import ChatModelService from "../services/chat-model.service";
import ChatService from "../services/chat.service";
import ChatController from "../controllers/chat.controller";
import {
  chatIdValidator,
  listChatsValidator,
  sendMessageValidator,
} from "../validators/chat.validator";

const chatRouter = (): Router => {
  const chatRouter: Router = Router();

  const userService = new UserService(users);
  const chatModelService = new ChatModelService(chatModels);
  const chatService = new ChatService(chats, conversations);

  const chatController = new ChatController(
    userService,
    chatModelService,
    chatService,
    logger,
  );

  chatRouter.use(verifyJWT);

  // Declared before "/:id" so the literal path is not swallowed by the param.
  chatRouter.get(
    "/models",
    asyncHandler((req, res) => chatController.listModels(req, res)),
  );

  chatRouter.get(
    "/",
    listChatsValidator,
    validateMiddleware,
    asyncHandler((req, res) => chatController.listChats(req, res)),
  );

  chatRouter.get(
    "/:id",
    chatIdValidator,
    validateMiddleware,
    asyncHandler((req, res) => chatController.getChat(req, res)),
  );

  chatRouter.post(
    "/",
    sendMessageValidator,
    validateMiddleware,
    asyncHandler((req, res) => chatController.streamMessage(req, res)),
  );

  chatRouter.delete(
    "/:id",
    chatIdValidator,
    validateMiddleware,
    asyncHandler((req, res) => chatController.deleteChat(req, res)),
  );

  return chatRouter;
};

export default chatRouter;
