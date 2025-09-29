import mongoose, { Document, Model, Schema } from 'mongoose';
import { TIME_SLOTS } from '@/lib/timeslot';

export interface ISchedulingAlgo extends Document {
  appointmentDate: string;
  appointmentTime: string;
  duration: string;
  appointmentId: string; // Reference to the original appointment
  createdAt: Date;
  updatedAt: Date;
}

const SchedulingAlgoSchema: Schema<ISchedulingAlgo> = new Schema(
  {
    appointmentDate: {
      type: String,
      required: [true, 'Appointment date is required'],
      index: true, // Index for efficient date queries
    },
    appointmentTime: {
      type: String,
      required: [true, 'Appointment time is required'],
      enum: TIME_SLOTS,
    },
    duration: {
      type: String,
      required: [true, 'Duration is required'],
      trim: true,
    },
    appointmentId: {
      type: String,
      required: [true, 'Appointment ID is required'],
      unique: true, // Ensure one scheduling entry per appointment
      ref: 'Appointment',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient date/time queries
SchedulingAlgoSchema.index({ appointmentDate: 1, appointmentTime: 1 });

// Note: appointmentId index is already created by unique: true in schema definition

// Static method to create scheduling entry from appointment
SchedulingAlgoSchema.statics.createFromAppointment = async function(appointment: {
  _id: { toString(): string };
  appointmentDetails: { date: string; time: string };
  serviceDetails: { duration: string };
}) {
  try {
    const schedulingEntry = new this({
      appointmentDate: appointment.appointmentDetails.date,
      appointmentTime: appointment.appointmentDetails.time,
      duration: appointment.serviceDetails.duration,
      appointmentId: appointment._id.toString(),
    });
    
    return await schedulingEntry.save();
  } catch (error: unknown) {
    // If entry already exists (duplicate appointmentId), return existing entry
    if (error && typeof error === 'object' && 'code' in error && (error as { code: number }).code === 11000) {
      return await this.findOne({ appointmentId: appointment._id.toString() });
    }
    throw error;
  }
};

// Static method to get scheduling entries by date
SchedulingAlgoSchema.statics.getByDate = function(date: Date | string) {
  const dateString = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  
  return this.find({
    appointmentDate: dateString,
  }).sort({ appointmentTime: 1 });
};

// Static method to get scheduling entries by time slot
SchedulingAlgoSchema.statics.getByTimeSlot = function(date: Date | string, time: string) {
  const dateString = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  
  return this.find({
    appointmentDate: dateString,
    appointmentTime: time,
  });
};

// Static method to remove scheduling entry by appointment ID
SchedulingAlgoSchema.statics.removeByAppointmentId = function(appointmentId: string) {
  return this.findOneAndDelete({ appointmentId });
};

// Add static methods to the interface
interface ISchedulingAlgoModel extends Model<ISchedulingAlgo> {
  createFromAppointment(appointment: {
    _id: { toString(): string };
    appointmentDetails: { date: string; time: string };
    serviceDetails: { duration: string };
  }): Promise<ISchedulingAlgo>;
  getByDate(date: Date | string): Promise<ISchedulingAlgo[]>;
  getByTimeSlot(date: Date | string, time: string): Promise<ISchedulingAlgo[]>;
  removeByAppointmentId(appointmentId: string): Promise<ISchedulingAlgo | null>;
}

// Prevent re-compilation during development
const SchedulingAlgo: ISchedulingAlgoModel = 
  (mongoose.models.SchedulingAlgo as ISchedulingAlgoModel) || 
  mongoose.model<ISchedulingAlgo>('SchedulingAlgo', SchedulingAlgoSchema) as ISchedulingAlgoModel;

export default SchedulingAlgo;
