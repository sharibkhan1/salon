import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SalonSettings from '@/models/SalonSettings';
import { verifyTokenAndAdmin } from '@/lib/auth';

// GET - Fetch salon settings
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Verify admin access
    const authResult = await verifyTokenAndAdmin(request);
    if (authResult.status !== 200) {
      return NextResponse.json({ error: authResult.message }, { status: authResult.status });
    }

    const settings = await SalonSettings.getSettings();
    
    return NextResponse.json({
      success: true,
      settings: {
        numberOfStylists: settings.numberOfStylists,
        updatedAt: settings.updatedAt,
      }
    });

  } catch (error) {
    console.error('Error fetching salon settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch salon settings' },
      { status: 500 }
    );
  }
}

// PUT - Update salon settings
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    // Verify admin access
    const authResult = await verifyTokenAndAdmin(request);
    if (authResult.status !== 200) {
      return NextResponse.json({ error: authResult.message }, { status: authResult.status });
    }

    const { numberOfStylists } = await request.json();

    // Validate input
    if (!numberOfStylists || typeof numberOfStylists !== 'number') {
      return NextResponse.json(
        { error: 'Number of stylists is required and must be a number' },
        { status: 400 }
      );
    }

    if (numberOfStylists < 1 || numberOfStylists > 50) {
      return NextResponse.json(
        { error: 'Number of stylists must be between 1 and 50' },
        { status: 400 }
      );
    }

    const settings = await SalonSettings.updateSettings(numberOfStylists);
    
    return NextResponse.json({
      success: true,
      message: 'Salon settings updated successfully',
      settings: {
        numberOfStylists: settings.numberOfStylists,
        updatedAt: settings.updatedAt,
      }
    });

  } catch (error) {
    console.error('Error updating salon settings:', error);
    return NextResponse.json(
      { error: 'Failed to update salon settings' },
      { status: 500 }
    );
  }
}
