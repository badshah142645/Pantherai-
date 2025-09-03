import { NextRequest, NextResponse } from 'next/server';

// Mock authentication - in production, replace with real authentication
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Mock authentication logic
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Mock user data - in production, verify against database
    const mockUser = {
      id: '1',
      email: email,
      name: 'Demo User',
      createdAt: new Date().toISOString()
    };

    // Mock JWT token - in production, generate real JWT
    const mockToken = `mock-jwt-token-${Date.now()}`;

    return NextResponse.json({
      token: mockToken,
      user: mockUser,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}