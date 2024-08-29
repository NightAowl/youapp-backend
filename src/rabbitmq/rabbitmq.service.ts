import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private readonly logger = new Logger(RabbitMQService.name);
  private connectionPromise: Promise<void>;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.connectionPromise = this.connect();
    await this.connectionPromise;
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      const rabbitmqUrl = this.configService.get<string>('RABBITMQ_URL');
      this.logger.log(`Connecting to RabbitMQ at ${rabbitmqUrl}`);
      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();
      this.logger.log('Successfully connected to RabbitMQ');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error.stack);
      throw error;
    }
  }

  private async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ', error.stack);
    }
  }

  private async ensureConnection() {
    if (!this.channel) {
      await this.connectionPromise;
    }
  }

  async publishMessage(exchange: string, routingKey: string, message: any) {
    await this.ensureConnection();
    try {
      await this.channel.assertExchange(exchange, 'topic', { durable: false });
      this.channel.publish(
        exchange,
        routingKey,
        Buffer.from(JSON.stringify(message)),
      );
      this.logger.log(
        `Message published to exchange ${exchange} with routing key ${routingKey}`,
      );
    } catch (error) {
      this.logger.error(
        `Error publishing message to exchange ${exchange}`,
        error.stack,
      );
      throw error;
    }
  }

  async consumeMessages(queue: string, callback: (message: any) => void) {
    await this.ensureConnection();
    try {
      await this.channel.assertQueue(queue, { durable: false });
      this.channel.consume(queue, (msg) => {
        if (msg !== null) {
          const content = JSON.parse(msg.content.toString());
          callback(content);
          this.channel.ack(msg);
        }
      });
      this.logger.log(`Consuming messages from queue ${queue}`);
    } catch (error) {
      this.logger.error(
        `Error consuming messages from queue ${queue}`,
        error.stack,
      );
      throw error;
    }
  }
}
