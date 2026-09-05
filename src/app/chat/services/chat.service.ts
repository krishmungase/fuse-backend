import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "../../../database/connection";
import { chats, conversations, NewConversation } from "../schema/chat.schema";

class ChatService {
  private chats;
  private conversations;

  constructor(
    chatsTable: typeof chats,
    conversationsTable: typeof conversations,
  ) {
    this.chats = chatsTable;
    this.conversations = conversationsTable;
  }

  async getChatsByUser(userId: string) {
    return db
      .select({
        id: this.chats.id,
        title: this.chats.title,
        createdAt: this.chats.createdAt,
        updatedAt: this.chats.updatedAt,
      })
      .from(this.chats)
      .where(eq(this.chats.userId, userId))
      .orderBy(desc(this.chats.updatedAt));
  }

  async getChatById(id: string, userId: string) {
    const [chat] = await db
      .select()
      .from(this.chats)
      .where(and(eq(this.chats.id, id), eq(this.chats.userId, userId)));

    return chat;
  }

  async getMessages(chatId: string) {
    return db
      .select()
      .from(this.conversations)
      .where(eq(this.conversations.chatId, chatId))
      .orderBy(asc(this.conversations.createdAt));
  }

  /**
   * The id is optional so the client can mint it before the first token and
   * route to /chat/<id> immediately, the way ChatGPT does. Postgres fills it
   * in when omitted.
   */
  async createChat(userId: string, title: string, id?: string) {
    const [chat] = await db
      .insert(this.chats)
      .values({ id, userId, title })
      .returning();

    return chat;
  }

  /**
   * Owner of a chat regardless of who is asking. Used to tell "does not exist"
   * apart from "belongs to someone else" before a stream is opened, since a
   * client-supplied id could collide with another user's chat.
   */
  async getChatOwnerId(id: string) {
    const [chat] = await db
      .select({ userId: this.chats.userId })
      .from(this.chats)
      .where(eq(this.chats.id, id));

    return chat?.userId;
  }

  async appendMessages(
    chatId: string,
    messages: Omit<NewConversation, "chatId">[],
  ) {
    return db.transaction(async (tx) => {
      const rows = await tx
        .insert(this.conversations)
        .values(messages.map((message) => ({ ...message, chatId })))
        .returning();

      await tx
        .update(this.chats)
        .set({ updatedAt: new Date() })
        .where(eq(this.chats.id, chatId));

      return rows;
    });
  }

  async deleteChat(id: string, userId: string) {
    const [chat] = await db
      .delete(this.chats)
      .where(and(eq(this.chats.id, id), eq(this.chats.userId, userId)))
      .returning();

    return chat;
  }
}

export default ChatService;
