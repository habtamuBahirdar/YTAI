import { NextRequest, NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const { name, email, password } = await registerSchema.parseAsync(body);

    // Lazy load db
    let db;
    try {
      const { default: dbImport } = await import('@/lib/db');
      db = dbImport;
    } catch (e) {
      return NextResponse.json(
        { message: 'Database service unavailable' },
        { status: 503 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { message: 'Database not initialized' },
        { status: 503 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user
    const user = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        credits: 100, // Welcome bonus
      },
    });

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]?.message || 'Validation error';
      return NextResponse.json(
        { message: firstError },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
