/**
 * User route definitions: wires the auth and user controllers with their
 * service dependencies, and exposes the registration/verification flow
 * (/register, /resend-verification, /verify-email, /set-password), the session
 * endpoints (/login, /refresh, /logout), and the authenticated profile
 * endpoints (/me, /change-password).
 */
import { Router } from "express";

import logger from "../../../logger/winston.logger";
import asyncHandler from "../../../utils/async-handler";
import validateMiddleware from "../../../middlewares/validate.middleware";
import { verifyJWT } from "../../../middlewares/auth.middleware";

import RabbitMQService from "../../../utils/rabbitmq";

import { users } from "../schema/user.schema";
import { authTokens } from "../schema/auth-token.schema";
import UserService from "../services/user.service";
import HashService from "../services/hash.service";
import TokenService from "../services/token.service";
import AuthTokenService from "../services/auth-token.service";
import EmailVerificationService from "../services/email-verification.service";
import AuthController from "../controllers/auth.controller";
import UserController from "../controllers/user.controller";
import {
  changePasswordValidator,
  loginValidator,
  refreshValidator,
  registerValidator,
  resendVerificationValidator,
  setPasswordValidator,
  updateProfileValidator,
  verifyEmailValidator,
} from "../validators/user.validator";

const userRouter = (rabbitmqService: RabbitMQService): Router => {
  const userRouter: Router = Router();

  const userService = new UserService(users);
  const hashService = new HashService();
  const tokenService = new TokenService();
  const authTokenService = new AuthTokenService(authTokens);

  const emailVerificationService = new EmailVerificationService(
    tokenService,
    authTokenService,
    rabbitmqService,
  );

  const authController = new AuthController(
    userService,
    hashService,
    tokenService,
    emailVerificationService,
    logger,
  );

  const userController = new UserController(userService, hashService, logger);

  /* Registration and email verification */

  userRouter.post(
    "/register",
    registerValidator,
    validateMiddleware,
    asyncHandler((req, res) => authController.register(req, res)),
  );

  userRouter.post(
    "/resend-verification",
    resendVerificationValidator,
    validateMiddleware,
    asyncHandler((req, res) => authController.resendVerification(req, res)),
  );

  userRouter.post(
    "/verify-email",
    verifyEmailValidator,
    validateMiddleware,
    asyncHandler((req, res) => authController.verifyEmail(req, res)),
  );

  userRouter.post(
    "/set-password",
    setPasswordValidator,
    validateMiddleware,
    asyncHandler((req, res) => authController.setPassword(req, res)),
  );

  /* Session */

  userRouter.post(
    "/login",
    loginValidator,
    validateMiddleware,
    asyncHandler((req, res) => authController.login(req, res)),
  );

  userRouter.post(
    "/refresh",
    refreshValidator,
    validateMiddleware,
    asyncHandler((req, res) => authController.refresh(req, res)),
  );

  userRouter.post(
    "/logout",
    verifyJWT,
    asyncHandler((req, res) => authController.logout(req, res)),
  );

  /* Profile */

  userRouter.get(
    "/me",
    verifyJWT,
    asyncHandler((req, res) => userController.me(req, res)),
  );

  userRouter.post(
    "/change-password",
    verifyJWT,
    changePasswordValidator,
    validateMiddleware,
    asyncHandler((req, res) => userController.changePassword(req, res)),
  );

  userRouter.patch(
    "/me",
    verifyJWT,
    updateProfileValidator,
    validateMiddleware,
    asyncHandler((req, res) => userController.updateProfile(req, res)),
  );

  return userRouter;
};

export default userRouter;
