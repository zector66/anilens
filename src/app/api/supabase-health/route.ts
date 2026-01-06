import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  if (!supabase) {
    return NextResponse.json({
      status: 'error',
      message: 'Supabase not configured - missing environment variables',
      configured: false,
    });
  }

  try {
    // Try to query the multiplayer_rooms table
    const { data, error } = await supabase
      .from('multiplayer_rooms')
      .select('id')
      .limit(1);

    if (error) {
      return NextResponse.json({
        status: 'error',
        message: `Database error: ${error.message}`,
        configured: true,
        connected: false,
        error: error,
      });
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Supabase connected successfully!',
      configured: true,
      connected: true,
      tableExists: true,
      rowCount: data?.length || 0,
    });
  } catch (err) {
    return NextResponse.json({
      status: 'error',
      message: `Connection error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      configured: true,
      connected: false,
    });
  }
}
