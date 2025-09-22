import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import { verifyToken } from '@/lib/auth';

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

    // Parse and validate date
    const appointmentDate = new Date(appointmentDetails.date);
    if (appointmentDate < new Date()) {
      return NextResponse.json(
        { error: 'Appointment date cannot be in the past' },
        { status: 400 }
      );
    }

    // Check if time slot is available
    const isAvailable = await (Appointment as unknown as { isTimeSlotAvailable: (date: Date, time: string) => Promise<boolean> }).isTimeSlotAvailable(
      appointmentDate,
      appointmentDetails.time
    );

    if (!isAvailable) {
      return NextResponse.json(
        { error: 'This time slot is already booked. Please choose another time.' },
        { status: 409 }
      );
    }

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
        date: appointmentDate,
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

// GET - Retrieve appointments (with optional filtering)
export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    const { searchParams } = new URL(request.url);
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
