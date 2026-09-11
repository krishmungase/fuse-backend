import type { IncomingMessage, ServerResponse } from "node:http";
import type { Request, Response } from "express";

import { App } from "../src/app";

const application = new App();

const ready = application.bootstrap();

const server = application.getApp();

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  await ready;

  return server(req as Request, res as Response);
}
