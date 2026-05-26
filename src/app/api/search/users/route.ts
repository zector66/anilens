import { NextRequest, NextResponse } from 'next/server';
import { anilistClient } from '@/lib/anilist-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get('q');

    if (!username || username.length < 2) {
      return NextResponse.json({ error: 'Query too short' }, { status: 400 });
    }

    const user = await anilistClient.getUserByUsername(username);

    return NextResponse.json({
      results: [{
        id: user.id,
        name: user.name,
        avatar: user.avatar?.large || user.avatar?.medium || '',
        stats: {
          animeCount: user.statistics?.anime?.count || 0,
          mangaCount: user.statistics?.manga?.count || 0,
          meanScore: user.statistics?.anime?.meanScore || 0,
        },
      }],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Search failed';
    const status = /not found/i.test(message) ? 404 : 500;
    return NextResponse.json({ error: message, results: [] }, { status });
  }
}
