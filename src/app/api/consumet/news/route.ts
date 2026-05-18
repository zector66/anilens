import { NextResponse } from 'next/server';
import { getRecentNews } from '@/lib/consumet-client';

export const dynamic = 'force-dynamic';

// In-memory cache: news rarely changes, 10 min TTL
let cache: { data: unknown; expires: number } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000;

export async function GET() {
  try {
    const now = Date.now();
    if (cache && cache.expires > now) {
      return NextResponse.json(
        { success: true, news: cache.data, cached: true },
        { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' } }
      );
    }

    const news = await getRecentNews();
    cache = { data: news, expires: now + CACHE_TTL_MS };

    return NextResponse.json(
      { success: true, news, cached: false },
      { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Consumet news] Error:', message);
    return NextResponse.json(
      { success: false, error: message, news: [] },
      { status: 200 } // Don't fail the homepage on news errors
    );
  }
}
