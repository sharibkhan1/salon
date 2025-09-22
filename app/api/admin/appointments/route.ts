import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import { verifyToken } from '@/lib/auth';

// GET - Retrieve all appointments for admin with pagination and filters
export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    // Verify admin authentication
    const user = await verifyToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Sorting parameters
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    // Filter parameters
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const date = searchParams.get('date');

    // Build query
    const query: Record<string, unknown> = {};

    // Status filter
    if (status) {
      query['appointmentDetails.status'] = status;
    }

    // Search filter (customer name or email)
    if (search) {
      query.$or = [
        { 'customerInfo.name': { $regex: search, $options: 'i' } },
        { 'customerInfo.email': { $regex: search, $options: 'i' } }
      ];
    }

    // Date filter
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

    // Get total count for pagination
    const totalAppointments = await Appointment.countDocuments(query);
    const totalPages = Math.ceil(totalAppointments / limit);

    // Execute query with pagination and sorting
    const appointments = await Appointment.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    // Format appointments
    const formattedAppointments = appointments.map(appointment => 
      (appointment as unknown as { getFormattedAppointment: () => unknown }).getFormattedAppointment()
    );

    // Pagination info
    const pagination = {
      currentPage: page,
      totalPages,
      totalAppointments,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      limit
    };

    return NextResponse.json(
      {
        appointments: formattedAppointments,
        pagination,
        message: 'Appointments retrieved successfully'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Admin get appointments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update appointment status (admin only)
export async function PUT(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    // Verify admin authentication
    const user = await verifyToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { appointmentId, status } = body;

    if (!appointmentId || !status) {
      return NextResponse.json(
        { error: 'Appointment ID and status are required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
        { status: 400 }
      );
    }

    // Find and update appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    appointment.appointmentDetails.status = status;
    await appointment.save();

    // Format appointment
    const formattedAppointment = (appointment as unknown as { getFormattedAppointment: () => unknown }).getFormattedAppointment();

    return NextResponse.json(
      {
        message: 'Appointment status updated successfully',
        appointment: formattedAppointment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Admin update appointment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
