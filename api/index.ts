import type { IncomingMessage, ServerResponse } from "node:http";
import type { Request, Response } from "express";

type ExpressServer = (req: Request, res: Response) => void;

let cachedServer: Promise<ExpressServer> | null = null;

const loadServer = async (): Promise<ExpressServer> => {
  const { App } = await import("../src/app");

  const application = new App();
  await application.bootstrap();

  return application.getApp() as unknown as ExpressServer;
};

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  try {
    cachedServer ??= loadServer();

    const server = await cachedServer;

    return server(req as Request, res as Response);
  } catch (error) {
    cachedServer = null;

    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    console.error("Startup failed:", stack ?? message);

    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "Startup failed", message }));
  }
}
