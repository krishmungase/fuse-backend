/**
 * Chat request types: the body shapes accepted by the chat endpoints.
 */
export interface ISendMessageBody {
  message: string;
  /** Allowlisted model id; falls back to the default when omitted. */
  model?: string;
}
