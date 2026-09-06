/**
 * Express application bootstrap: wires global middleware (CORS, cookies,
 * body parsing, logging), registers feature routers and the error handler,
 * and exposes start()/getApp() for the entrypoint and tests.
 */
import cors from "cors";
import cookieParser from "cookie-parser";
import express, { Application, Request, Response } from "express";

import env from "./config/env.config";
import logger from "./logger/winston.logger";
import { connectDatabase } from "./database/connection";
import RabbitMQService from "./utils/rabbitmq";

import errorHandlerMiddleware from "./middlewares/error-handler.middleware";
import morganMiddleware from "./middlewares/morgan.middleware";

import userRouter from "./app/user/routes/user.routes";
import chatRouter from "./app/chat/routes/chat.routes";
import MailService from "./app/mail/services/mail.service";

export class App {
  private app: Application;
  private mailService: MailService;
  private rabbitmqService: RabbitMQService;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();

    this.mailService = new MailService(logger);
    this.rabbitmqService = new RabbitMQService(env.rabbitmqUrl, {
      enabled: env.app.useRabbitMQ,
      fallbackHandler: (payload) =>
        this.mailService.sendVerificationEmail(payload),
    });
  }

  private initializeMiddlewares() {
    const corsOption: cors.CorsOptions = {
      origin: env.frontendUrl,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
    };

    this.app.options("/{*path}", cors(corsOption));
    this.app.use(cors(corsOption));
    this.app.use(cookieParser());
    this.app.use(express.json({ limit: "50MB" }));
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(morganMiddleware);
    this.app.use(express.static("public"));
  }

  private healthCheck = (_req: Request, res: Response) => {
    return res.status(200).json({
      status: "OK",
      message: "Backend server is running.",
    });
  };

  private initializeRoutes() {
    this.app.get("/health", this.healthCheck);
    this.app.get("/api/v1/health", this.healthCheck);

    this.app.use("/api/v1/users", userRouter(this.rabbitmqService));
    this.app.use("/api/v1/chat", chatRouter());

    this.app.use(errorHandlerMiddleware);
  }

  async consumerSetup() {
    await this.rabbitmqService.consumeVerificationEmails(async (payload) => {
      await this.mailService.sendVerificationEmail(payload);
    });
  }

  async start() {
    const PORT = env.app.port;
    try {
      await connectDatabase();

      await this.rabbitmqService.connect();
      await this.consumerSetup();

      this.initializeRoutes();

      this.app.listen(PORT, "0.0.0.0", () =>
        logger.info(`Server listening on http://localhost:${PORT}`),
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Failed to start server: ${error.message}`);
      }
      process.exit(1);
    }
  }

  getApp() {
    return this.app;
  }
}

export default App;
