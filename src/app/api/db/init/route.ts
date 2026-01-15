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

  // Debug logging (will appear in Vercel logs)
  console.log('[DB Init] Environment:', process.env.NODE_ENV);
  console.log('[DB Init] Has admin secret:', !!adminSecret);
  console.log('[DB Init] Has provided secret:', !!providedSecret);
  console.log('[DB Init] Admin secret value:', JSON.stringify(adminSecret));
  console.log('[DB Init] Provided secret value:', JSON.stringify(providedSecret));
  console.log('[DB Init] Admin secret length:', adminSecret?.length);
  console.log('[DB Init] Provided secret length:', providedSecret?.length);
  console.log('[DB Init] Secrets match:', adminSecret === providedSecret);
  console.log('[DB Init] Trimmed match:', adminSecret?.trim() === providedSecret?.trim());

  if (!isDev) {
    // In production, require admin secret
    if (!adminSecret || providedSecret !== adminSecret) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized: This endpoint is protected',
          debug: {
            hasEnvSecret: !!adminSecret,
            hasProvidedSecret: !!providedSecret,
            env: process.env.NODE_ENV
          }
        },
        { status: 403 }
      );
    }
  }

  try {
    await initializeDatabase();
    return NextResponse.json({ success: true, message: 'Database initialized' });
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initialize database' },
      { status: 500 }
    );
  }
}
