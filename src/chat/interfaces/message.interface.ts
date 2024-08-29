import * as mongoose from 'mongoose';

export const MessageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
});

export type MessageDocument = mongoose.Document & {
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: Date;
  read: boolean;
};
