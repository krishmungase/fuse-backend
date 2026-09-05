/**
 * Chat controller: HTTP handlers for listing the available models and running
 * a message through the workflow. Model selection is resolved here -- the
 * request names a slug, the database decides whether it is real -- so the
 * graph only ever receives a model it is allowed to run.
 */
import { Logger } from "winston";
import { Response } from "express";
import { HumanMessage } from "@langchain/core/messages";

import ApiError from "../../../utils/api-error";
import ApiResponse from "../../../utils/api-response";
import { CustomRequest } from "../../../types/common.types";
import ERROR_MESSAGE from "../../../constants/error-message.constants";

import UserService from "../../user/services/user.service";
import { agent, ChatModelDefinition } from "../../workflow";
import ChatModelService from "../services/chat-model.service";
import { ChatModel } from "../schema/chat-model.schema";
import { ISendMessageBody } from "../types/chat.types";

/** The client only ever needs the public half of a chat_models row. */
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

class ChatController {
  constructor(
    private userService: UserService,
    private chatModelService: ChatModelService,
    private logger: Logger,
  ) {}

  /** Models the frontend may offer in its picker. */
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

  async sendMessage(req: CustomRequest<ISendMessageBody>, res: Response) {
    const { message, model } = req.body;

    // An unknown or retired slug is a client error, not a server one, so it
    // is rejected before the request reaches a provider.
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

    const result = await agent.invoke(
      { messages: [new HumanMessage(message)] },
      { context: { model: toDefinition(selected) } },
    );

    const messages = result.messages.map((entry) => ({
      type: entry.type,
      text: entry.text,
    }));

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { model: selected.slug, messages },
          "Message sent successfully.",
        ),
      );
  }
}

export default ChatController;
