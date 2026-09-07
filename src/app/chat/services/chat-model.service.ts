import { and, asc, eq } from "drizzle-orm";

import ApiError from "../../../utils/api-error";
import { db } from "../../../database/connection";
import ERROR_MESSAGE from "../../../constants/error-message.constants";
import { chatModels } from "../schema/chat-model.schema";

class ChatModelService {
  private chatModels;

  constructor(chatModelsTable: typeof chatModels) {
    this.chatModels = chatModelsTable;
  }

  async resolveModel(slug?: string) {
    const model = slug
      ? await this.getActiveModelBySlug(slug)
      : await this.getDefaultModel();

    if (!model) {
      throw new ApiError(
        422,
        slug
          ? ERROR_MESSAGE.CHAT_MODEL_NOT_FOUND
          : ERROR_MESSAGE.NO_CHAT_MODEL_CONFIGURED,
      );
    }

    return model;
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
