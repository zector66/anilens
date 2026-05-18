import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

let cache: { ok: boolean; message: string | null; checkedAt: number } | null = null;
const CACHE_TTL_MS = 60_000; // re-check at most once per minute

/**
 * Lightweight AniList health check.
 * Returns { ok: true } when AniList is up, { ok: false, message } when down.
 */
export async function GET() {
  const now = Date.now();

  if (cache && now - cache.checkedAt < CACHE_TTL_MS) {
    return NextResponse.json(cache);
  }

  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ GenreCollection }' }),
      signal: AbortSignal.timeout(5000),
    });

    const data = await res.json();
    const apiError = data?.errors?.[0];

    if (!res.ok || apiError) {
      const message = apiError?.message ?? 'AniList is experiencing issues.';
      cache = { ok: false, message, checkedAt: now };
    } else {
      cache = { ok: true, message: null, checkedAt: now };
    }
  } catch {
    cache = { ok: false, message: 'AniList is unreachable. Please try again later.', checkedAt: now };
  }

  return NextResponse.json(cache);
}
