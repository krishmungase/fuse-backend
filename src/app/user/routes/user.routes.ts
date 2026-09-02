/**
 * User route definitions: wires the UserController and its service
 * dependencies, and exposes auth endpoints (/register, /login, /refresh,
 * /logout) plus profile endpoints (/me, /change-password) with their
 * validators and JWT guards.
 */
import { Router } from "express";

import logger from "../../../logger/winston.logger";
import asyncHandler from "../../../utils/async-handler";
import validateMiddleware from "../../../middlewares/validate.middleware";
import { verifyJWT } from "../../../middlewares/auth.middleware";

import { users } from "../schema/user.schema";
import UserService from "../services/user.service";
import HashService from "../services/hash.service";
import TokenService from "../services/token.service";
import UserController from "../controllers/user.controller";
import {
  changePasswordValidator,
  loginValidator,
  refreshValidator,
  registerValidator,
  updateProfileValidator,
} from "../validators/user.validator";

const userRouter: Router = Router();

const userService = new UserService(users);
const hashService = new HashService();
const tokenService = new TokenService();
const userController = new UserController(
  userService,
  hashService,
  tokenService,
  logger,
);

userRouter.post(
  "/register",
  registerValidator,
  validateMiddleware,
  asyncHandler((req, res) => userController.register(req, res)),
);

userRouter.post(
  "/login",
  loginValidator,
  validateMiddleware,
  asyncHandler((req, res) => userController.login(req, res)),
);

userRouter.post(
  "/refresh",
  refreshValidator,
  validateMiddleware,
  asyncHandler((req, res) => userController.refresh(req, res)),
);

userRouter.post(
  "/logout",
  verifyJWT,
  asyncHandler((req, res) => userController.logout(req, res)),
);

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

export default userRouter;
