import mongoose, { Document, Model, Schema } from 'mongoose';
import { TIME_SLOTS } from '@/lib/timeslot';

export interface IAppointment extends Document {
  // User Information
  userId?: string; // Optional - for logged-in users
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  
  // Service Details
  serviceDetails: {
    id: string;
    name: string;
    duration: string;
    price: string;
    gender: 'men' | 'women';
  };
  
  // Appointment Details
  appointmentDetails: {
    date: Date;
    time: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  };
  
  // Reschedule History
  rescheduleHistory?: Array<{
    oldDate: Date;
    oldTime: string;
    newDate: Date;
    newTime: string;
    rescheduledBy: string; // 'user' or 'admin'
    rescheduledAt: Date;
    reason?: string;
  }>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema: Schema<IAppointment> = new Schema(
  {
    userId: {
      type: String,
      ref: 'User',
      required: false, // Allow guest bookings
    },
    customerInfo: {
      name: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [100, 'Name cannot exceed 100 characters'],
      },
      email: {
        type: String,
        required: [true, 'Customer email is required'],
        lowercase: true,
        trim: true,
        match: [
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
          'Please enter a valid email address',
        ],
      },
      phone: {
        type: String,
        required: [true, 'Customer phone is required'],
        trim: true,
        minlength: [10, 'Phone number must be at least 10 characters'],
        maxlength: [15, 'Phone number cannot exceed 15 characters'],
      },
    },
    serviceDetails: {
      id: {
        type: String,
        required: [true, 'Service ID is required'],
      },
      name: {
        type: String,
        required: [true, 'Service name is required'],
        trim: true,
      },
      duration: {
        type: String,
        required: [true, 'Service duration is required'],
      },
      price: {
        type: String,
        required: [true, 'Service price is required'],
      },
      gender: {
        type: String,
        enum: ['men', 'women'],
        required: [true, 'Service gender category is required'],
      },
    },
    appointmentDetails: {
      date: {
        type: String,
        required: [true, 'Appointment date is required'],
      },
      time: {
        type: String,
        required: [true, 'Appointment time is required'],
        enum: TIME_SLOTS,
      },
      status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled'],
        default: 'pending',
      },
    },
    rescheduleHistory: [{
      oldDate: {
        type: Date,
        required: true,
      },
      oldTime: {
        type: String,
        required: true,
      },
      newDate: {
        type: Date,
        required: true,
      },
      newTime: {
        type: String,
        required: true,
      },
      rescheduledBy: {
        type: String,
        enum: ['user', 'admin'],
        required: true,
      },
      rescheduledAt: {
        type: Date,
        default: Date.now,
      },
      reason: {
        type: String,
        required: false,
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
AppointmentSchema.index({ 'customerInfo.email': 1 });
AppointmentSchema.index({ userId: 1 });
AppointmentSchema.index({ 'appointmentDetails.status': 1 });

// Compound index for date/time queries and to prevent double booking
AppointmentSchema.index(
  { 
    'appointmentDetails.date': 1, 
    'appointmentDetails.time': 1 
  },
  { 
    unique: false // We'll handle this in the API logic
  }
);

// Instance method to format appointment for display
AppointmentSchema.methods.getFormattedAppointment = function() {
  return {
    id: this._id,
    customer: this.customerInfo,
    service: this.serviceDetails,
    appointment: {
      ...this.appointmentDetails,
      date: this.appointmentDetails.date, // Date is already a string, no need to format
    },
    rescheduleHistory: this.rescheduleHistory || [],
    createdAt: this.createdAt,
  };
};

// Static method to find appointments by date
AppointmentSchema.statics.findByDate = function(date: Date | string) {
  const dateString = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  
  return this.find({
    'appointmentDetails.date': dateString,
  });
};

// Static method to check time slot availability
AppointmentSchema.statics.isTimeSlotAvailable = async function(date: Date | string, time: string) {
  const dateString = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  
  const existingAppointment = await this.findOne({
    'appointmentDetails.date': dateString,
    'appointmentDetails.time': time,
    'appointmentDetails.status': { $in: ['pending', 'confirmed'] },
  });
  
  return !existingAppointment;
};

// Prevent re-compilation during development
const Appointment: Model<IAppointment> = 
  mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', AppointmentSchema);

export default Appointment;
