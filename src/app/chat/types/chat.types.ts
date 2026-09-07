import { ChatModel } from "../schema/chat-model.schema";

export interface ISendMessageBody {
  message: string;
  model?: string;
  chatId: string;
}

export interface IRenameChatBody {
  title: string;
}

export interface IStreamTurnParams {
  chatId: string;
  userId: string;
  message: string;
  model: ChatModel;
  signal: AbortSignal;
}
