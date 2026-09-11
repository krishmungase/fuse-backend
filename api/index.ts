import type { IncomingMessage, ServerResponse } from "node:http";
import type { Request, Response } from "express";

import { App } from "../src/app";
import logger from "../src/logger/winston.logger";

const application = new App();

const server = application.getApp();

let bootError: unknown = null;

const ready = application.bootstrap().catch((error: unknown) => {
  bootError = error;

  logger.error(
    `Bootstrap failed: ${error instanceof Error ? error.stack : String(error)}`,
  );
});

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  await ready;

  if (bootError) {
    const message =
      bootError instanceof Error ? bootError.message : String(bootError);

    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "Startup failed", message }));

    return;
  }

  return server(req as Request, res as Response);
}
