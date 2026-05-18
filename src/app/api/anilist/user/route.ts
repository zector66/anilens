import { NextRequest, NextResponse } from 'next/server';
import { anilistClient } from '@/lib/anilist-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Server-side proxy for AniList user lookup by username.
 * AniList's GraphQL endpoint blocks direct browser calls via CORS,
 * so we proxy from the server.
 */
export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get('username');
    if (!username) {
      return NextResponse.json({ error: 'Missing username parameter' }, { status: 400 });
    }

    const user = await anilistClient.getUserByUsername(username);
    return NextResponse.json({ success: true, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load user';
    const status = /not found/i.test(message) ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
