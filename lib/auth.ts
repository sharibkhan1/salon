import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import connectDB from './mongodb';
import User from '@/models/User';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

export async function verifyToken(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Get token from cookie or Authorization header
    const token = request.cookies.get('auth-token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return null;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; email: string; role: string };
    
    // Connect to database and find user
    await connectDB();
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return null;
    }

    return {
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export function generateToken(user: { _id: string; email: string; role: string }) {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
}

export async function verifyTokenAndAdmin(request: NextRequest): Promise<{
  status: number;
  message: string;
  user?: AuthUser;
}> {
  const user = await verifyToken(request);
  
  if (!user) {
    return { status: 401, message: 'Authentication required' };
  }
  
  if (user.role !== 'admin') {
    return { status: 403, message: 'Admin access required' };
  }
  
  return { status: 200, message: 'Success', user };
}
