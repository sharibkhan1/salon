import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISalonSettings extends Document {
  numberOfStylists: number;
  createdAt: Date;
  updatedAt: Date;
}

const SalonSettingsSchema: Schema<ISalonSettings> = new Schema(
  {
    numberOfStylists: {
      type: Number,
      required: [true, 'Number of stylists is required'],
      min: [1, 'Number of stylists must be at least 1'],
      max: [50, 'Number of stylists cannot exceed 50'],
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one settings document exists
SalonSettingsSchema.index({}, { unique: true });

// Add static methods to the interface
interface ISalonSettingsModel extends Model<ISalonSettings> {
  getSettings(): Promise<ISalonSettings>;
  updateSettings(numberOfStylists: number): Promise<ISalonSettings>;
}

// Static method to get or create settings
SalonSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({ numberOfStylists: 1 });
  }
  return settings;
};

// Static method to update settings
SalonSettingsSchema.statics.updateSettings = async function(numberOfStylists: number) {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({ numberOfStylists });
  } else {
    settings.numberOfStylists = numberOfStylists;
    await settings.save();
  }
  return settings;
};

// Prevent re-compilation during development
const SalonSettings: ISalonSettingsModel = 
  (mongoose.models.SalonSettings as ISalonSettingsModel) || mongoose.model<ISalonSettings>('SalonSettings', SalonSettingsSchema) as ISalonSettingsModel;

export default SalonSettings;
