import { randomUUID } from "crypto";

import { Logger } from "winston";
import { Response } from "express";
import { createUIMessageStream, pipeUIMessageStreamToResponse } from "ai";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

import ApiError from "../../../utils/api-error";
import ApiResponse from "../../../utils/api-response";
import { CustomRequest } from "../../../types/common.types";
import ERROR_MESSAGE from "../../../constants/error-message.constants";

import UserService from "../../user/services/user.service";
import { agent, ChatModelDefinition } from "../../workflow";
import ChatModelService from "../services/chat-model.service";
import ChatService from "../services/chat.service";
import { ChatModel } from "../schema/chat-model.schema";
import { Conversation } from "../schema/chat.schema";
import { IRenameChatBody, ISendMessageBody } from "../types/chat.types";

const TITLE_MAX_LENGTH = 60;

const STREAM_WORD_DELAY_MS = 15;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const toWords = (text: string) => text.match(/\s*\S+|\s+/g) ?? [text];

const toPublicModel = ({ slug, label, provider }: ChatModel) => ({
  id: slug,
  label,
  provider,
});

const toDefinition = ({
  slug,
  provider,
  model,
}: ChatModel): ChatModelDefinition => ({
  slug,
  provider: provider as ChatModelDefinition["provider"],
  model,
});

const toPublicMessage = ({
  id,
  role,
  content,
  model,
  createdAt,
}: Conversation) => ({
  id,
  role,
  content,
  model,
  createdAt,
});

const deriveTitle = (message: string): string => {
  const normalized = message.replace(/\s+/g, " ").trim();

  if (normalized.length <= TITLE_MAX_LENGTH) {
    return normalized;
  }

  const clipped = normalized.slice(0, TITLE_MAX_LENGTH);
  const lastSpace = clipped.lastIndexOf(" ");

  return `${lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped}…`;
};

const toLangChainMessage = ({ role, content }: Conversation) =>
  role === "assistant" ? new AIMessage(content) : new HumanMessage(content);

class ChatController {
  constructor(
    private userService: UserService,
    private chatModelService: ChatModelService,
    private chatService: ChatService,
    private logger: Logger,
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

    const chats = query
      ? await this.chatService.searchChats(req.user!.id, query)
      : await this.chatService.getChatsByUser(req.user!.id);

    return res
      .status(200)
      .json(new ApiResponse(200, { chats, query }, "Chats fetched."));
  }

  async getChat(req: CustomRequest, res: Response) {
    const { id } = req.params as { id: string };

    const chat = await this.chatService.getChatById(id, req.user!.id);

    if (!chat) {
      throw new ApiError(404, ERROR_MESSAGE.CHAT_NOT_FOUND);
    }

    const messages = await this.chatService.getMessages(chat.id);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          chat: {
            id: chat.id,
            title: chat.title,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt,
          },
          messages: messages.map(toPublicMessage),
        },
        "Chat fetched.",
      ),
    );
  }

  async streamMessage(req: CustomRequest<ISendMessageBody>, res: Response) {
    const { message, model, chatId } = req.body;
    const userId = req.user!.id;

    const selected = model
      ? await this.chatModelService.getActiveModelBySlug(model)
      : await this.chatModelService.getDefaultModel();

    if (!selected) {
      throw new ApiError(
        422,
        model
          ? ERROR_MESSAGE.CHAT_MODEL_NOT_FOUND
          : ERROR_MESSAGE.NO_CHAT_MODEL_CONFIGURED,
      );
    }

    const ownerId = await this.chatService.getChatOwnerId(chatId);

    if (ownerId && ownerId !== userId) {
      throw new ApiError(404, ERROR_MESSAGE.CHAT_NOT_FOUND);
    }

    let chat = ownerId
      ? await this.chatService.getChatById(chatId, userId)
      : undefined;

    const history = chat ? await this.chatService.getMessages(chat.id) : [];

    const controller = new AbortController();
    res.on("close", () => controller.abort());

    const stream = createUIMessageStream({
      onError: (error) => {
        this.logger.error(
          `Chat stream failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        return ERROR_MESSAGE.SERVER_ERROR;
      },
      execute: async ({ writer }) => {
        const textId = randomUUID();
        let reply = "";

        try {
          const events = await agent.stream(
            {
              messages: [
                ...history.map(toLangChainMessage),
                new HumanMessage(message),
              ],
            },
            {
              streamMode: "messages",
              context: { model: toDefinition(selected) },
              signal: controller.signal,
            },
          );

          for await (const [chunk] of events) {
            const delta = chunk?.text ?? "";
            if (!delta) {
              continue;
            }

            if (!reply) {
              chat ??= await this.chatService.createChat(
                userId,
                deriveTitle(message),
                chatId,
              );
              writer.write({ type: "text-start", id: textId });
            }

            for (const word of toWords(delta)) {
              reply += word;
              writer.write({ type: "text-delta", id: textId, delta: word });

              if (STREAM_WORD_DELAY_MS) {
                await delay(STREAM_WORD_DELAY_MS);
              }
            }
          }

          if (reply) {
            writer.write({ type: "text-end", id: textId });
          }
        } finally {
          if (chat && reply) {
            await this.chatService.appendMessages(chat.id, [
              { role: "user", content: message },
              { role: "assistant", content: reply, model: selected.slug },
            ]);
          }
        }
      },
    });

    return pipeUIMessageStreamToResponse({ response: res, stream });
  }

  async renameChat(req: CustomRequest<IRenameChatBody>, res: Response) {
    const { id } = req.params as { id: string };
    const { title } = req.body;

    const chat = await this.chatService.renameChat(id, req.user!.id, title);

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
    const { id } = req.params as { id: string };

    const chat = await this.chatService.deleteChat(id, req.user!.id);

    if (!chat) {
      throw new ApiError(404, ERROR_MESSAGE.CHAT_NOT_FOUND);
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { id: chat.id }, "Chat deleted."));
  }
}

export default ChatController;
