import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import { verifyToken } from '@/lib/auth';
import { TIME_SLOTS } from '@/lib/timeslot';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  try {
    // Verify authentication
    const user = await verifyToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const { newDate, newTime, rescheduledBy = 'user', reason } = await req.json();

    if (!newDate || !newTime) {
      return NextResponse.json(
        { error: 'New date and time are required' },
        { status: 400 }
      );
    }

    if (!TIME_SLOTS.includes(newTime)) {
      return NextResponse.json(
        { error: 'Invalid time slot' },
        { status: 400 }
      );
    }

    // Check if the new date is not in the past
    const newAppointmentDate = new Date(newDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (newAppointmentDate < today) {
      return NextResponse.json(
        { error: 'Cannot reschedule to a past date' },
        { status: 400 }
      );
    }

    // Find the appointment
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Check if user owns the appointment (unless admin)
    if (user.role !== 'admin' && appointment.customerInfo.email !== user.email) {
      return NextResponse.json(
        { error: 'Unauthorized to reschedule this appointment' },
        { status: 403 }
      );
    }

    // Check if the appointment can be rescheduled
    if (appointment.appointmentDetails.status === 'completed' || 
        appointment.appointmentDetails.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot reschedule completed or cancelled appointments' },
        { status: 400 }
      );
    }

    // Check if the new time slot is available
    const conflictingAppointment = await Appointment.findOne({
      'appointmentDetails.date': newAppointmentDate,
      'appointmentDetails.time': newTime,
      'appointmentDetails.status': { $in: ['pending', 'confirmed', 'rescheduled'] },
      _id: { $ne: id } // Exclude current appointment
    });

    if (conflictingAppointment) {
      return NextResponse.json(
        { error: 'The selected time slot is already booked' },
        { status: 409 }
      );
    }

    // Store old appointment details for history
    const oldDate = appointment.appointmentDetails.date;
    const oldTime = appointment.appointmentDetails.time;

    // Update appointment with new details
    appointment.appointmentDetails.date = newAppointmentDate;
    appointment.appointmentDetails.time = newTime;
    appointment.appointmentDetails.status = 'rescheduled';

    // Add to reschedule history
    if (!appointment.rescheduleHistory) {
      appointment.rescheduleHistory = [];
    }

    appointment.rescheduleHistory.push({
      oldDate,
      oldTime,
      newDate: newAppointmentDate,
      newTime,
      rescheduledBy,
      rescheduledAt: new Date(),
      reason: reason || undefined
    });

    await appointment.save();

    // Format appointment for response
    const formattedAppointment = (appointment as unknown as { getFormattedAppointment: () => unknown }).getFormattedAppointment();

    return NextResponse.json(
      {
        message: 'Appointment rescheduled successfully',
        appointment: formattedAppointment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
