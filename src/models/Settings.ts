import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  key: string;
  value: unknown;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Settings = mongoose.model<ISettings>('Settings', settingsSchema);

// Helper functions
export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const setting = await Settings.findOne({ key });
  return setting ? (setting.value as T) : defaultValue;
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  await Settings.findOneAndUpdate(
    { key },
    { value },
    { upsert: true, new: true }
  );
}
