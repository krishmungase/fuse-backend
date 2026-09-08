import { randomUUID } from "crypto";

import { Logger } from "winston";
import { createUIMessageStream } from "ai";
import { HumanMessage } from "@langchain/core/messages";

import ApiError from "../../../utils/api-error";
import ERROR_MESSAGE from "../../../constants/error-message.constants";

import { agent, checkpointer } from "../../workflow";
import ChatService from "./chat.service";
import { ChatModel } from "../schema/chat-model.schema";
import { IStreamTurnParams } from "../types/chat.types";
import {
  deriveTitle,
  toLangChainMessage,
  toModelDefinition,
  toWords,
} from "../utils/chat.utils";
import { PRODUCT_TOOL_NAME, toProductGroup } from "../utils/product.utils";
import { ProductGroup } from "../schema/chat.schema";

const STREAM_WORD_DELAY_MS = 15;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class ChatStreamService {
  constructor(
    private chatService: ChatService,
    private logger: Logger,
  ) {}

  async createStream({
    chatId,
    userId,
    message,
    model,
    signal,
  }: IStreamTurnParams) {
    const chat = await this.resolveChat(chatId, userId);
    const history = chat ? await this.chatService.getMessages(chat.id) : [];

    return createUIMessageStream({
      onError: (error) => {
        this.logger.error(
          `Chat stream failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        return ERROR_MESSAGE.SERVER_ERROR;
      },
      execute: async ({ writer }) => {
        const textId = randomUUID();
        let target = chat;
        let reply = "";
        const productGroups: ProductGroup[] = [];

        try {
          const events = await this.runGraph({
            chatId,
            message,
            model,
            history,
            signal,
          });

          for await (const [chunk] of events) {
            if (chunk?.getType() === "tool") {
              if (chunk.name !== PRODUCT_TOOL_NAME) {
                continue;
              }

              const group = toProductGroup(chunk.content);
              if (!group) {
                continue;
              }

              target ??= await this.chatService.createChat(
                userId,
                deriveTitle(message),
                chatId,
              );

              productGroups.push(group);
              writer.write({
                type: "data-products",
                id: randomUUID(),
                data: group,
              });

              continue;
            }

            if (chunk?.getType() !== "ai") {
              continue;
            }

            const delta = chunk.text ?? "";
            if (!delta) {
              continue;
            }

            if (!reply) {
              target ??= await this.chatService.createChat(
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
          if (target && (reply || productGroups.length)) {
            await this.chatService.appendMessages(target.id, [
              { role: "user", content: message },
              {
                role: "assistant",
                content: reply,
                model: model.slug,
                metadata: productGroups.length ? { productGroups } : null,
              },
            ]);
          }
        }
      },
    });
  }

  async forgetThread(chatId: string) {
    await checkpointer.deleteThread(chatId);
  }

  private async resolveChat(chatId: string, userId: string) {
    const ownerId = await this.chatService.getChatOwnerId(chatId);

    if (ownerId && ownerId !== userId) {
      throw new ApiError(404, ERROR_MESSAGE.CHAT_NOT_FOUND);
    }

    return ownerId
      ? await this.chatService.getChatById(chatId, userId)
      : undefined;
  }

  private async runGraph({
    chatId,
    message,
    model,
    history,
    signal,
  }: {
    chatId: string;
    message: string;
    model: ChatModel;
    history: Awaited<ReturnType<ChatService["getMessages"]>>;
    signal: AbortSignal;
  }) {
    const thread = { configurable: { thread_id: chatId } };

    const checkpoint = await agent.getState(thread);
    const isCheckpointEmpty = !checkpoint.values?.messages?.length;

    return agent.stream(
      {
        messages: isCheckpointEmpty
          ? [...history.map(toLangChainMessage), new HumanMessage(message)]
          : [new HumanMessage(message)],
      },
      {
        ...thread,
        streamMode: "messages",
        context: { model: toModelDefinition(model) },
        signal,
      },
    );
  }
}

export default ChatStreamService;
