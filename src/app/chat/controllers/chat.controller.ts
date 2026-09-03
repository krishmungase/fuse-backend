import { Logger } from "winston";
import { Response } from "express";

import ApiError from "../../../utils/api-error";
import ApiResponse from "../../../utils/api-response";
import { CustomRequest } from "../../../types/common.types";
import ERROR_MESSAGE from "../../../constants/error-message.constants";

import UserService from "../../user/services/user.service";
import { agent } from "../../workflow";
import { HumanMessage } from "@langchain/core/messages";
import { ISendMessageBody } from "../types/chat.types";

class ChatController {
  constructor(
    private userService: UserService,
    private logger: Logger,
  ) {}

  async sendMessage(req: CustomRequest<ISendMessageBody>, res: Response) {
    const { message } = req.body;

    const result = await agent.invoke({
      messages: [new HumanMessage(message)],
    });

    const messages = result.messages.map((entry) => ({
      type: entry.type,
      text: entry.text,
    }));

    return res
      .status(200)
      .json(new ApiResponse(200, { messages }, "Message sent successfully."));
  }
}

export default ChatController;
