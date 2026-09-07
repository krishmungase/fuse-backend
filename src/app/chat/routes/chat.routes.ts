import { Router } from "express";

import logger from "../../../logger/winston.logger";
import asyncHandler from "../../../utils/async-handler";
import { verifyJWT } from "../../../middlewares/auth.middleware";
import validateMiddleware from "../../../middlewares/validate.middleware";

import { chatModels } from "../schema/chat-model.schema";
import { chats, conversations } from "../schema/chat.schema";
import ChatModelService from "../services/chat-model.service";
import ChatService from "../services/chat.service";
import ChatStreamService from "../services/chat-stream.service";
import ChatController from "../controllers/chat.controller";
import {
  chatIdValidator,
  listChatsValidator,
  renameChatValidator,
  sendMessageValidator,
} from "../validators/chat.validator";

const chatRouter = (): Router => {
  const chatRouter: Router = Router();

  const chatModelService = new ChatModelService(chatModels);
  const chatService = new ChatService(chats, conversations);
  const chatStreamService = new ChatStreamService(chatService, logger);

  const chatController = new ChatController(
    chatModelService,
    chatService,
    chatStreamService,
  );

  chatRouter.use(verifyJWT);

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

  chatRouter.patch(
    "/:id",
    renameChatValidator,
    validateMiddleware,
    asyncHandler((req, res) => chatController.renameChat(req, res)),
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
