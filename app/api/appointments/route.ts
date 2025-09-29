import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import SchedulingAlgo from '@/models/SchedulingAlgo';
import SalonSettings from '@/models/SalonSettings';
import { verifyToken } from '@/lib/auth';
import { TIME_SLOTS } from '@/lib/timeslot';

// Helper function to convert time string to minutes from midnight
function timeToMinutes(timeStr: string): number {
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  let totalMinutes = hours * 60 + (minutes || 0);
  
  if (period === 'PM' && hours !== 12) {
    totalMinutes += 12 * 60;
  } else if (period === 'AM' && hours === 12) {
    totalMinutes = minutes || 0;
  }
  
  return totalMinutes;
}

// Helper function to parse duration string to minutes
function parseDurationToMinutes(duration: string): number {
  const match = duration.match(/(\d+)\s*(min|minute|minutes|hour|hours|hr|hrs)/i);
  if (!match) return 30; // Default to 30 minutes if parsing fails
  
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  
  if (unit.startsWith('hour') || unit.startsWith('hr')) {
    return value * 60;
  }
  return value; // Assume minutes
}

// Helper function to check if an appointment overlaps with a time slot
function doesAppointmentOverlapWithTimeSlot(appointment: { appointmentTime: string; duration: string }, timeSlot: string): boolean {
  // Convert appointment time to minutes
  const apptStartMinutes = timeToMinutes(appointment.appointmentTime);
  const apptDurationMinutes = parseDurationToMinutes(appointment.duration);
  const apptEndMinutes = apptStartMinutes + apptDurationMinutes;
  
  // Convert time slot to minutes (assume 15-minute slots)
  const slotStartMinutes = timeToMinutes(timeSlot);
  const slotEndMinutes = slotStartMinutes + 15; // 15-minute time slots
  
  // Check if they overlap - appointment blocks the slot if it overlaps at all
  // Include the ending boundary: if appointment ends exactly when slot starts, still block it
  return apptStartMinutes < slotEndMinutes && slotStartMinutes <= apptEndMinutes;
}

// Helper function to check if an appointment can be booked at a specific time slot
// without hitting fully booked periods during its duration
function canBookAppointmentAtTimeSlot(
  startTimeSlot: string, 
  duration: string, 
  existingAppointments: { appointmentTime: string; duration: string }[], 
  totalArtists: number
): boolean {
  const appointmentDurationMinutes = parseDurationToMinutes(duration);
  const startMinutes = timeToMinutes(startTimeSlot);
  const endMinutes = startMinutes + appointmentDurationMinutes;
  
  // Check every 15-minute interval during the appointment duration
  for (let currentMinutes = startMinutes; currentMinutes < endMinutes; currentMinutes += 15) {
    // Convert current minutes back to time slot format
    const currentTimeSlot = minutesToTimeString(currentMinutes);
    
    // Skip if this time slot doesn't exist in our TIME_SLOTS array
    if (!TIME_SLOTS.includes(currentTimeSlot)) {
      continue;
    }
    
    // Count conflicts at this time slot
    let conflictCount = 0;
    for (const existingAppt of existingAppointments) {
      if (doesAppointmentOverlapWithTimeSlot(existingAppt, currentTimeSlot)) {
        conflictCount++;
      }
    }
    
    // If this time slot is fully booked, we can't book here
    if (conflictCount >= totalArtists) {
      return false;
    }
  }
  
  return true;
}

// Helper function to convert minutes back to time string format
function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `12:${mins.toString().padStart(2, '0')} AM`;
  } else if (hours < 12) {
    return `${hours}:${mins.toString().padStart(2, '0')} AM`;
  } else if (hours === 12) {
    return `12:${mins.toString().padStart(2, '0')} PM`;
  } else {
    return `${hours - 12}:${mins.toString().padStart(2, '0')} PM`;
  }
}


// POST - Create a new appointment
export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    const body = await request.json();
    const {
      customerInfo,
      serviceDetails,
      appointmentDetails,
    } = body;
    // Validate required fields
    if (!customerInfo || !serviceDetails || !appointmentDetails) {
      return NextResponse.json(
        { error: 'Missing required fields: customerInfo, serviceDetails, appointmentDetails' },
        { status: 400 }
      );
    }

    // Validate customer info
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      return NextResponse.json(
        { error: 'Customer information is incomplete' },
        { status: 400 }
      );
    }

    // Validate service details
    if (!serviceDetails.id || !serviceDetails.name || !serviceDetails.duration || 
        !serviceDetails.price || !serviceDetails.gender) {
      return NextResponse.json(
        { error: 'Service details are incomplete' },
        { status: 400 }
      );
    }

    // Validate appointment details
    if (!appointmentDetails.date || !appointmentDetails.time) {
      return NextResponse.json(
        { error: 'Appointment date and time are required' },
        { status: 400 }
      );
    }

    // No date validation or conversion - just use the date string as-is

    // Check if user is authenticated (optional)
    let userId = null;
    const user = await verifyToken(request);
    if (user) {
      userId = user.id;
    }

    // Create appointment
    const appointment = new Appointment({
      userId,
      customerInfo: {
        name: customerInfo.name.trim(),
        email: customerInfo.email.toLowerCase().trim(),
        phone: customerInfo.phone.trim(),
      },
      serviceDetails: {
        id: serviceDetails.id,
        name: serviceDetails.name,
        duration: serviceDetails.duration,
        price: serviceDetails.price,
        gender: serviceDetails.gender,
      },
      appointmentDetails: {
        date: appointmentDetails.date,
        time: appointmentDetails.time,
        status: 'pending',
      },
    });

    await appointment.save();

    // Return formatted appointment
    const formattedAppointment = (appointment as unknown as { getFormattedAppointment: () => unknown }).getFormattedAppointment();

    return NextResponse.json(
      {
        message: 'Appointment booked successfully',
        appointment: formattedAppointment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Appointment booking error:', error);
    
    // Handle mongoose validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      const validationErrors = Object.values((error as unknown as { errors: Record<string, { message: string }> }).errors).map(
        (err) => err.message
      );
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Retrieve appointments (with optional filtering) or check availability
export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    const { searchParams } = new URL(request.url);
    const checkAvailability = searchParams.get('checkAvailability');
    
    // If checking availability, return available time slots
    if (checkAvailability === 'true') {
      const date = searchParams.get('date');
      const duration = searchParams.get('duration') || '30 min';
      
      if (!date) {
        return NextResponse.json(
          { error: 'Date is required for availability check' },
          { status: 400 }
        );
      }

      const appointmentDate = date; // Use date string directly
      // Get detailed availability for all time slots
      const salonSettings = await SalonSettings.getSettings();
      const totalArtists = salonSettings.numberOfStylists;
      const existingAppointments = await SchedulingAlgo.getByDate(appointmentDate);
      
      const detailedAvailability: { [key: string]: { available: boolean; availableArtists: number; totalArtists: number; status: string } } = {};
      const availableSlots: string[] = [];

      for (const timeSlot of TIME_SLOTS) {
        // Check how many appointments overlap with this time slot
        let conflictCount = 0;
        
        for (const existingAppt of existingAppointments) {
          // Check if this appointment overlaps with the current time slot
          if (doesAppointmentOverlapWithTimeSlot(existingAppt, timeSlot)) {
            conflictCount++;
          }
        }
        
        const availableArtists = Math.max(0, totalArtists - conflictCount);
        const isAvailable = availableArtists > 0;
        
        // Check if we can book an appointment of the requested duration starting at this time slot
        const canBookAtThisSlot = canBookAppointmentAtTimeSlot(timeSlot, duration, existingAppointments, totalArtists);
        
        // Determine the status of this time slot
        let status = 'available';
        if (!isAvailable) {
          status = 'fully_booked'; // This specific time slot is fully booked
        } else if (!canBookAtThisSlot) {
          status = 'duration_conflict'; // Available now, but would conflict during appointment duration
        }
        
        detailedAvailability[timeSlot] = {
          available: isAvailable && canBookAtThisSlot,
          availableArtists,
          totalArtists,
          status
        };

        if (isAvailable && canBookAtThisSlot) {
          availableSlots.push(timeSlot);
        }
      }
      
      return NextResponse.json(
        {
          date,
          duration,
          availableSlots,
          detailedAvailability,
          totalArtists,
          message: `Found ${availableSlots.length} available time slots`
        },
        { status: 200 }
      );
    }

    // Regular appointment retrieval
    const email = searchParams.get('email');
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    // Build query
    const query: Record<string, unknown> = {};

    if (email) {
      query['customerInfo.email'] = email.toLowerCase();
    }

    if (date) {
      const queryDate = new Date(date);
      const startOfDay = new Date(queryDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(queryDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      query['appointmentDetails.date'] = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    }

    if (status) {
      query['appointmentDetails.status'] = status;
    }

    if (userId) {
      query.userId = userId;
    }

    // Execute query
    const appointments = await Appointment.find(query)
      .sort({ 'appointmentDetails.date': 1, 'appointmentDetails.time': 1 })
      .limit(100); // Limit results for performance

    // Format appointments
    const formattedAppointments = appointments.map(appointment => 
      (appointment as unknown as { getFormattedAppointment: () => unknown }).getFormattedAppointment()
    );

    return NextResponse.json(
      {
        appointments: formattedAppointments,
        count: formattedAppointments.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get appointments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
