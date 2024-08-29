import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MessageDocument } from './schemas/message.schema';
import { SendMessageDto } from './dto/send-message.dto';
import { ViewMessagesDto } from './dto/view-message.dto';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel('Message') private messageModel: Model<MessageDocument>,
    private rabbitMQService: RabbitMQService,
  ) {}

  async sendMessage(sendMessageDto: SendMessageDto) {
    const { senderId, receiverId, message } = sendMessageDto;

    const newMessage = new this.messageModel({
      senderId,
      receiverId,
      message,
      timestamp: new Date(),
      read: false,
    });

    await newMessage.save();

    // Publish message to RabbitMQ
    await this.rabbitMQService.publishMessage('chat_exchange', 'new_message', {
      senderId,
      receiverId,
      message,
      timestamp: newMessage.timestamp,
      read: newMessage.read,
    });

    return {
      status: 201,
      message: 'Message sent successfully',
      data: newMessage,
    };
  }

  async viewMessages(viewMessagesDto: ViewMessagesDto) {
    const { senderId, receiverId } = viewMessagesDto;

    const messages = await this.messageModel
      .find({
        $or: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      })
      .sort({ timestamp: 1 });

    if (!messages.length) {
      throw new NotFoundException('No messages found');
    }

    // Mark messages as read
    await this.messageModel.updateMany(
      { senderId: receiverId, receiverId: senderId, read: false },
      { $set: { read: true } },
    );

    return {
      status: 200,
      message: 'Messages retrieved successfully',
      data: messages,
    };
  }
}
