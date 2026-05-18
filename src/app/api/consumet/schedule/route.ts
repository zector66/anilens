import { NextResponse } from 'next/server';
import { getAiringSchedule } from '@/lib/consumet-client';

export const dynamic = 'force-dynamic';

let cache: { data: unknown; expires: number } | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000;

export async function GET() {
  try {
    const now = Date.now();
    if (cache && cache.expires > now) {
      return NextResponse.json(
        { success: true, schedule: cache.data, cached: true },
        { headers: { 'Cache-Control': 'public, max-age=600, stale-while-revalidate=1800' } }
      );
    }

    const schedule = await getAiringSchedule();
    cache = { data: schedule, expires: now + CACHE_TTL_MS };

    return NextResponse.json(
      { success: true, schedule, cached: false },
      { headers: { 'Cache-Control': 'public, max-age=600, stale-while-revalidate=1800' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Consumet schedule] Error:', message);
    return NextResponse.json(
      { success: false, error: message, schedule: [] },
      { status: 200 }
    );
  }
}
