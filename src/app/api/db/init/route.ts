import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';

/**
 * Database initialization endpoint.
 * Protected: only accessible in development OR with ADMIN_SECRET header.
 */
export async function POST(request: NextRequest) {
  // Security: Block in production unless admin secret is provided
  const isDev = process.env.NODE_ENV === 'development';
  const adminSecret = process.env.ADMIN_SECRET;
  const providedSecret = request.headers.get('x-admin-secret');

  if (!isDev) {
    // In production, require admin secret
    if (!adminSecret || providedSecret !== adminSecret) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: This endpoint is protected' },
        { status: 403 }
      );
    }
  }

  try {
    await initializeDatabase();
    return NextResponse.json({ success: true, message: 'Database initialized' });
  } catch (error) {
    console.error('Database initialization error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
