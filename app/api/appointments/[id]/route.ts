import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import { verifyToken } from '@/lib/auth';

// GET - Get a specific appointment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Connect to database
    await connectDB();

    const { id } = await params;

    // Find appointment
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Format appointment
    const formattedAppointment = (appointment as unknown as { getFormattedAppointment: () => unknown }).getFormattedAppointment();

    return NextResponse.json(
      { appointment: formattedAppointment },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get appointment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update appointment status or details
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Connect to database
    await connectDB();

    const { id } = await params;
    const body = await request.json();

    // Find appointment
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Check if user is authorized (optional - you can add more strict auth later)
    await verifyToken(request);
    
    // Update allowed fields
    if (body.status && ['pending', 'confirmed', 'completed', 'cancelled'].includes(body.status)) {
      appointment.appointmentDetails.status = body.status;
    }

    // Save updated appointment
    await appointment.save();

    // Format appointment
    const formattedAppointment = (appointment as unknown as { getFormattedAppointment: () => unknown }).getFormattedAppointment();

    return NextResponse.json(
      {
        message: 'Appointment updated successfully',
        appointment: formattedAppointment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update appointment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel/Delete an appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Connect to database
    await connectDB();

    const { id } = await params;

    // Find and delete appointment
    const appointment = await Appointment.findByIdAndDelete(id);
    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Appointment cancelled successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete appointment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
