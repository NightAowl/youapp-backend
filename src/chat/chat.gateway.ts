import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { Logger } from '@nestjs/common';
import { NEW_MESSAGE_QUEUE } from '../rabbitmq/rabbitmq.constants';

@WebSocketGateway()
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(private rabbitMQService: RabbitMQService) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  async onModuleInit() {
    await this.consumeMessages();
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(userId);
    this.logger.log(`Client ${client.id} joined room ${userId}`);
  }

  private async consumeMessages() {
    try {
      await this.rabbitMQService.consumeMessages(
        NEW_MESSAGE_QUEUE,
        (message) => {
          const { receiverId } = message;
          this.server.to(receiverId).emit('newMessage', message);
          this.logger.log(`Message emitted to user ${receiverId}`);
        },
      );
      this.logger.log(
        `Started consuming messages from queue ${NEW_MESSAGE_QUEUE}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to consume messages from queue ${NEW_MESSAGE_QUEUE}`,
        error.stack,
      );
    }
  }
}
