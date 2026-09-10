import { Router } from "express";

import asyncHandler from "../../../utils/async-handler";
import { verifyJWT } from "../../../middlewares/auth.middleware";
import validateMiddleware from "../../../middlewares/validate.middleware";

import { connections } from "../schema/connection.schema";
import ConnectionService from "../services/connection.service";
import OAuthService from "../services/oauth.service";
import OAuthStateService from "../services/oauth-state.service";
import ConnectionController from "../controllers/connection.controller";
import {
  callbackValidator,
  providerValidator,
} from "../validators/connection.validator";

const connectionRouter = (): Router => {
  const connectionRouter: Router = Router();

  const connectionService = new ConnectionService(connections);
  const oauthService = new OAuthService();
  const oauthStateService = new OAuthStateService();

  const connectionController = new ConnectionController(
    connectionService,
    oauthService,
    oauthStateService,
  );

  connectionRouter.get(
    "/callback",
    callbackValidator,
    validateMiddleware,
    asyncHandler((req, res) => connectionController.callback(req, res)),
  );

  connectionRouter.use(verifyJWT);

  connectionRouter.get(
    "/",
    asyncHandler((req, res) => connectionController.list(req, res)),
  );

  connectionRouter.get(
    "/:provider/authorize",
    providerValidator,
    validateMiddleware,
    asyncHandler((req, res) => connectionController.authorize(req, res)),
  );

  connectionRouter.delete(
    "/:provider",
    providerValidator,
    validateMiddleware,
    asyncHandler((req, res) => connectionController.disconnect(req, res)),
  );

  return connectionRouter;
};

export default connectionRouter;
