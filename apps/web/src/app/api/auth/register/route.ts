import { NextRequest, NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import { z } from 'zod';
import { getDb, queryUser } from '@/lib/db';

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

    const client = await getDb();
    if (!client) {
      return NextResponse.json(
        { message: 'Database not available' },
        { status: 503 }
      );
    }

    // Check if user already exists
    const existingUser = await queryUser(email);
    if (existingUser) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user
    const result = await client.query(
      `INSERT INTO "users" (email, name, password, credits)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name`,
      [email, name, hashedPassword, 100]
    );

    const user = result.rows[0];

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