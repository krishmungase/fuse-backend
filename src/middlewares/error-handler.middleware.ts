import { NextFunction, Request, Response } from "express";

import env from "../config/env.config";
import logger from "../logger/winston.logger";
import ApiError from "../utils/api-error";
import ERROR_MESSAGE from "../constants/error-message.constants";

const errorHandlerMiddleware = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode ? error.statusCode : 500;
    const message = error.message || ERROR_MESSAGE.SERVER_ERROR;
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  const response = {
    ...error,
    message: error.message,
    ...(env.app.isDev ? { stack: error.stack } : {}),
  };

  logger.error(`${error.message}`, { cause: err?.cause });

  return res.status(error.statusCode).json(response);
};

export default errorHandlerMiddleware;
