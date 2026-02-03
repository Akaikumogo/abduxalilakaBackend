import mongoose, { Document, Schema } from 'mongoose';

export interface IApplication extends Document {
  name: string;
  phone: string;
  country: string;
  formType: string;
  status: 'new' | 'contacted' | 'in_progress' | 'completed' | 'cancelled';
  notes: string;
  assignedTo?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      default: '',
      trim: true,
    },
    formType: {
      type: String,
      default: 'Website Form',
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'in_progress', 'completed', 'cancelled'],
      default: 'new',
    },
    notes: {
      type: String,
      default: '',
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
applicationSchema.index({ status: 1, createdAt: -1 });
applicationSchema.index({ phone: 1 });

export const Application = mongoose.model<IApplication>('Application', applicationSchema);
