import { Response } from "express";

import ApiError from "../../../utils/api-error";
import { importAiSdk } from "../../../utils/esm-import";
import ApiResponse from "../../../utils/api-response";
import { CustomRequest } from "../../../types/common.types";
import ERROR_MESSAGE from "../../../constants/error-message.constants";

import ChatModelService from "../services/chat-model.service";
import ChatService from "../services/chat.service";
import ChatStreamService from "../services/chat-stream.service";
import { IRenameChatBody, ISendMessageBody } from "../types/chat.types";
import {
  toPublicChat,
  toPublicMessage,
  toPublicModel,
} from "../utils/chat.utils";

const chatIdOf = <T>(req: CustomRequest<T>) =>
  (req.params as { id: string }).id;

class ChatController {
  constructor(
    private chatModelService: ChatModelService,
    private chatService: ChatService,
    private chatStreamService: ChatStreamService,
  ) {}

  async listModels(req: CustomRequest, res: Response) {
    const [models, defaultModel] = await Promise.all([
      this.chatModelService.getActiveModels(),
      this.chatModelService.getDefaultModel(),
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          models: models.map(toPublicModel),
          defaultModel: defaultModel?.slug ?? null,
        },
        "Models fetched.",
      ),
    );
  }

  async listChats(req: CustomRequest, res: Response) {
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const userId = req.user!.id;

    const chats = query
      ? await this.chatService.searchChats(userId, query)
      : await this.chatService.getChatsByUser(userId);

    return res
      .status(200)
      .json(new ApiResponse(200, { chats, query }, "Chats fetched."));
  }

  async getChat(req: CustomRequest, res: Response) {
    const chat = await this.chatService.getChatById(
      chatIdOf(req),
      req.user!.id,
    );

    if (!chat) {
      throw new ApiError(404, ERROR_MESSAGE.CHAT_NOT_FOUND);
    }

    const messages = await this.chatService.getMessages(chat.id);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          chat: toPublicChat(chat),
          messages: messages.map(toPublicMessage),
        },
        "Chat fetched.",
      ),
    );
  }

  async streamMessage(req: CustomRequest<ISendMessageBody>, res: Response) {
    const { message, model, chatId } = req.body;

    const selected = await this.chatModelService.resolveModel(model);

    const controller = new AbortController();
    res.on("close", () => controller.abort());

    const stream = await this.chatStreamService.createStream({
      chatId,
      userId: req.user!.id,
      message,
      model: selected,
      signal: controller.signal,
    });

    const { pipeUIMessageStreamToResponse } = await importAiSdk();

    return pipeUIMessageStreamToResponse({ response: res, stream });
  }

  async renameChat(req: CustomRequest<IRenameChatBody>, res: Response) {
    const chat = await this.chatService.renameChat(
      chatIdOf(req),
      req.user!.id,
      req.body.title,
    );

    if (!chat) {
      throw new ApiError(404, ERROR_MESSAGE.CHAT_NOT_FOUND);
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { id: chat.id, title: chat.title },
          "Chat renamed.",
        ),
      );
  }

  async deleteChat(req: CustomRequest, res: Response) {
    const chat = await this.chatService.deleteChat(chatIdOf(req), req.user!.id);

    if (!chat) {
      throw new ApiError(404, ERROR_MESSAGE.CHAT_NOT_FOUND);
    }

    await this.chatStreamService.forgetThread(chat.id);

    return res
      .status(200)
      .json(new ApiResponse(200, { id: chat.id }, "Chat deleted."));
  }
}

export default ChatController;
