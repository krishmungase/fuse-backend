import amqp, { Channel, ChannelModel, ConsumeMessage } from "amqplib";

import logger from "../logger/winston.logger";
import {
  MAIL_EXCHANGES,
  MAIL_QUEUES,
  ROUTING_KEYS,
  VerificationEmailPayload,
} from "../types/queue.types";

interface RabbitMQOptions {
  enabled?: boolean;
  fallbackHandler?: (payload: VerificationEmailPayload) => Promise<void>;
}

class RabbitMQService {
  private connection!: ChannelModel;
  private channel!: Channel;
  private url: string;
  private enabled: boolean;
  private fallbackHandler?: (
    payload: VerificationEmailPayload,
  ) => Promise<void>;

  constructor(url: string, options: RabbitMQOptions = {}) {
    this.url = url;
    this.enabled = options.enabled ?? true;
    this.fallbackHandler = options.fallbackHandler;
  }

  async connect(): Promise<void> {
    if (!this.enabled) {
      logger.info(
        "RabbitMQ disabled (USE_RABBITMQ_SERVICE=false) — verification emails will be sent inline",
      );
      return;
    }
    try {
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      await this.setup();
      logger.info("RabbitMQ Connected");
    } catch (error) {
      logger.error({ event: "RabbitMQ connection failed", error });
      throw error;
    }
  }

  private async setup(): Promise<void> {
    await this.channel.assertExchange(MAIL_EXCHANGES.DEAD_LETTER, "direct", {
      durable: true,
    });
    await this.channel.assertQueue(MAIL_QUEUES.VERIFICATION_FAILED, {
      durable: true,
    });
    await this.channel.bindQueue(
      MAIL_QUEUES.VERIFICATION_FAILED,
      MAIL_EXCHANGES.DEAD_LETTER,
      ROUTING_KEYS.VERIFICATION,
    );

    await this.channel.assertExchange(MAIL_EXCHANGES.MAIN, "direct", {
      durable: true,
    });

    await this.channel.assertQueue(MAIL_QUEUES.VERIFICATION, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": MAIL_EXCHANGES.DEAD_LETTER,
        "x-dead-letter-routing-key": ROUTING_KEYS.VERIFICATION,
        "x-message-ttl": 86400000,
      },
    });

    await this.channel.bindQueue(
      MAIL_QUEUES.VERIFICATION,
      MAIL_EXCHANGES.MAIN,
      ROUTING_KEYS.VERIFICATION,
    );

    logger.info("RabbitMQ exchanges, queues and bindings ready");
  }

  async publishVerificationEmail(
    payload: VerificationEmailPayload,
  ): Promise<void> {
    if (!this.enabled) {
      if (!this.fallbackHandler) {
        throw new Error(
          "RabbitMQ disabled and no fallbackHandler configured for verification emails",
        );
      }
      await this.fallbackHandler(payload);
      logger.info({
        event: "VerificationEmailSentInline",
        email: payload.email,
      });
      return;
    }

    if (!this.channel) {
      throw new Error(
        "RabbitMQ channel not initialised — call connect() first",
      );
    }

    try {
      const buffer = Buffer.from(JSON.stringify(payload));

      const enqueued = this.channel.publish(
        MAIL_EXCHANGES.MAIN,
        ROUTING_KEYS.VERIFICATION,
        buffer,
        {
          persistent: true,
          contentType: "application/json",
          messageId: `verification-${payload.email}-${Date.now()}`,
          timestamp: Date.now(),
        },
      );

      if (!enqueued) {
        throw new Error("RabbitMQ write buffer full — message not enqueued");
      }

      logger.info({
        event: "VerificationEmailPublished",
        email: payload.email,
      });
    } catch (error) {
      logger.error({ event: "PublishVerificationEmailFailed", error });
      throw error;
    }
  }

  async consumeVerificationEmails(
    handler: (data: VerificationEmailPayload) => Promise<void>,
  ): Promise<void> {
    if (!this.enabled) {
      logger.info("RabbitMQ disabled — skipping verification email consumer");
      return;
    }

    await this.channel.prefetch(1);

    await this.channel.consume(
      MAIL_QUEUES.VERIFICATION,
      async (msg: ConsumeMessage | null) => {
        if (!msg) return;

        const payload: VerificationEmailPayload = JSON.parse(
          msg.content.toString(),
        );

        try {
          logger.info({
            event: "VerificationEmailReceived",
            email: payload.email,
          });

          await handler(payload);
          this.channel.ack(msg);

          logger.info({
            event: "VerificationEmailProcessed",
            email: payload.email,
          });
        } catch (error) {
          logger.error({
            event: "VerificationEmailFailed",
            email: payload.email,
            error,
          });
          this.channel.nack(msg, false, false);
        }
      },
    );

    logger.info("Consuming verification email events");
  }

  async close(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
      logger.info("RabbitMQ connection closed");
    } catch (error) {
      logger.error({ event: "RabbitMQ close failed", error });
    }
  }
}

export default RabbitMQService;
