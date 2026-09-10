import jwt from "jsonwebtoken";

import env from "../../../config/env.config";
import ApiError from "../../../utils/api-error";
import ERROR_MESSAGE from "../../../constants/error-message.constants";
import {
  OAUTH_STATE_EXPIRES_IN,
  OAUTH_STATE_PURPOSE,
} from "../constants/connector.constants";
import { OAuthStatePayload } from "../types/connection.types";

class OAuthStateService {
  sign(payload: Omit<OAuthStatePayload, "purpose">): string {
    return jwt.sign(
      { ...payload, purpose: OAUTH_STATE_PURPOSE },
      env.jwt.accessSecret,
      { expiresIn: OAUTH_STATE_EXPIRES_IN },
    );
  }

  verify(state: string): OAuthStatePayload {
    try {
      const decoded = jwt.verify(
        state,
        env.jwt.accessSecret,
      ) as OAuthStatePayload;

      if (decoded.purpose !== OAUTH_STATE_PURPOSE || !decoded.userId) {
        throw new ApiError(400, ERROR_MESSAGE.INVALID_OAUTH_STATE);
      }

      return decoded;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(400, ERROR_MESSAGE.INVALID_OAUTH_STATE);
    }
  }
}

export default OAuthStateService;
