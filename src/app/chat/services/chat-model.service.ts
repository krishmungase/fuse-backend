import { and, asc, eq } from "drizzle-orm";

import { db } from "../../../database/connection";
import { chatModels } from "../schema/chat-model.schema";

class ChatModelService {
  private chatModels;

  constructor(chatModelsTable: typeof chatModels) {
    this.chatModels = chatModelsTable;
  }

  async getActiveModels() {
    return db
      .select()
      .from(this.chatModels)
      .where(eq(this.chatModels.isActive, true))
      .orderBy(asc(this.chatModels.sortOrder), asc(this.chatModels.label));
  }

  async getActiveModelBySlug(slug: string) {
    const [model] = await db
      .select()
      .from(this.chatModels)
      .where(
        and(eq(this.chatModels.slug, slug), eq(this.chatModels.isActive, true)),
      );

    return model;
  }

  async getDefaultModel() {
    const [flagged] = await db
      .select()
      .from(this.chatModels)
      .where(
        and(
          eq(this.chatModels.isDefault, true),
          eq(this.chatModels.isActive, true),
        ),
      )
      .limit(1);

    if (flagged) {
      return flagged;
    }

    const [fallback] = await db
      .select()
      .from(this.chatModels)
      .where(eq(this.chatModels.isActive, true))
      .orderBy(asc(this.chatModels.sortOrder), asc(this.chatModels.label))
      .limit(1);

    return fallback;
  }
}

export default ChatModelService;
