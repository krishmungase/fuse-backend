import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "../../../database/connection";
import {
  authTokens,
  AuthTokenPurpose,
  NewAuthToken,
} from "../schema/auth-token.schema";

class AuthTokenService {
  private tokens;

  constructor(authTokensTable: typeof authTokens) {
    this.tokens = authTokensTable;
  }

  async createToken(data: NewAuthToken) {
    const [token] = await db.insert(this.tokens).values(data).returning();
    return token;
  }

  async getByJtiHash(jtiHash: string) {
    const [token] = await db
      .select()
      .from(this.tokens)
      .where(eq(this.tokens.jtiHash, jtiHash));

    return token;
  }

  async getLatestForUser(userId: string, purpose: AuthTokenPurpose) {
    const [token] = await db
      .select()
      .from(this.tokens)
      .where(
        and(eq(this.tokens.userId, userId), eq(this.tokens.purpose, purpose)),
      )
      .orderBy(desc(this.tokens.createdAt))
      .limit(1);

    return token;
  }

  async consumeToken(id: string) {
    const [token] = await db
      .update(this.tokens)
      .set({ consumedAt: new Date() })
      .where(and(eq(this.tokens.id, id), isNull(this.tokens.consumedAt)))
      .returning();

    return token;
  }

  async deleteForUser(userId: string, purpose: AuthTokenPurpose) {
    return db
      .delete(this.tokens)
      .where(
        and(eq(this.tokens.userId, userId), eq(this.tokens.purpose, purpose)),
      );
  }
}

export default AuthTokenService;
