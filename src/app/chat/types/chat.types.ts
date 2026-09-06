export interface ISendMessageBody {
  message: string;
  model?: string;
  chatId: string;
}

export interface IRenameChatBody {
  title: string;
}
