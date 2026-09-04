import { Logger } from "winston";
import { Response } from "express";

import ApiError from "../../../utils/api-error";
import ApiResponse from "../../../utils/api-response";
import { CustomRequest } from "../../../types/common.types";
import ERROR_MESSAGE from "../../../constants/error-message.constants";

import UserService from "../../user/services/user.service";
import { HumanMessage } from "@langchain/core/messages";
import { agent, CHAT_MODELS, DEFAULT_CHAT_MODEL_ID } from "../../workflow";
import { ISendMessageBody } from "../types/chat.types";

class ChatController {
  constructor(
    private userService: UserService,
    private logger: Logger,
  ) {}

  async listModels(req: CustomRequest, res: Response) {
    const models = CHAT_MODELS.map(({ id, label, provider }) => ({
      id,
      label,
      provider,
    }));

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { models, defaultModel: DEFAULT_CHAT_MODEL_ID },
          "Models fetched.",
        ),
      );
  }

  async sendMessage(req: CustomRequest<ISendMessageBody>, res: Response) {
    const { message, model } = req.body;

    const modelId = model ?? DEFAULT_CHAT_MODEL_ID;

    const result = await agent.invoke(
      { messages: [new HumanMessage(message)] },
      { context: { modelId } },
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
          { model: modelId, messages },
          "Message sent successfully.",
        ),
      );
  }
}

export default ChatController;
