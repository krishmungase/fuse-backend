/**
 * Auth token data-access service: persists, looks up, and consumes the
 * server-side records backing the email verification flow.
 *
 * Only the SHA-256 of a token's jti is stored, so a row on its own can never
 * be turned back into a usable token.
 */
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

  /**
   * Most recently issued token of a purpose for a user, consumed or not.
   * Used to enforce the resend cooldown.
   */
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

  /**
   * Marks a token used. The `consumed_at IS NULL` predicate makes this the
   * atomic gate for single use: two concurrent requests race on the same row
   * and exactly one gets a result back.
   */
  async consumeToken(id: string) {
    const [token] = await db
      .update(this.tokens)
      .set({ consumedAt: new Date() })
      .where(and(eq(this.tokens.id, id), isNull(this.tokens.consumedAt)))
      .returning();

    return token;
  }

  /** Invalidates a user's outstanding tokens of a purpose before issuing a new one. */
  async deleteForUser(userId: string, purpose: AuthTokenPurpose) {
    return db
      .delete(this.tokens)
      .where(
        and(eq(this.tokens.userId, userId), eq(this.tokens.purpose, purpose)),
      );
  }
}

export default AuthTokenService;
