import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage extends Document {
  userId: string;
  text: string;
  isUser: boolean;
  isRead: boolean;
  telegramMessageId?: number;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
    },
    isUser: {
      type: Boolean,
      default: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    telegramMessageId: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
chatMessageSchema.index({ userId: 1, createdAt: -1 });

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);
