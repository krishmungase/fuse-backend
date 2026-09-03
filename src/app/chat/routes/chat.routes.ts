import { Router } from "express";

import logger from "../../../logger/winston.logger";
import asyncHandler from "../../../utils/async-handler";
import { verifyJWT } from "../../../middlewares/auth.middleware";
import validateMiddleware from "../../../middlewares/validate.middleware";

import UserService from "../../user/services/user.service";
import { users } from "../../../schema/user.schema";
import ChatController from "../controllers/chat.controller";
import { sendMessageValidator } from "../validators/chat.validator";

const chatRouter = (): Router => {
  const chatRouter: Router = Router();

  const userService = new UserService(users);

  const chatController = new ChatController(userService, logger);

  chatRouter.post(
    "/",
    verifyJWT,
    sendMessageValidator,
    validateMiddleware,
    asyncHandler((req, res) => chatController.sendMessage(req, res)),
  );
  return chatRouter;
};

export default chatRouter;
