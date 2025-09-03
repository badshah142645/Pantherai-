import { NextRequest, NextResponse } from 'next/server';

// Mock registration - in production, replace with real user creation
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Mock user creation - in production, save to database
    const mockUser = {
      id: Date.now().toString(),
      email: email,
      name: email.split('@')[0], // Use email prefix as name
      createdAt: new Date().toISOString()
    };

    // Mock JWT token - in production, generate real JWT
    const mockToken = `mock-jwt-token-${Date.now()}`;

    return NextResponse.json({
      token: mockToken,
      user: mockUser,
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}