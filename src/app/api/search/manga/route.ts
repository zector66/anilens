import { NextRequest, NextResponse } from 'next/server';
import { anilistClient } from '@/lib/anilist-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q');
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');

    if (!query || query.length < 2) {
      return NextResponse.json({ error: 'Query too short' }, { status: 400 });
    }

    const result = await anilistClient.searchMedia(query, 'MANGA', page, 20);

    return NextResponse.json({
      results: result.media.map((m) => ({
        id: m.id,
        title: m.title?.userPreferred || m.title?.romaji || m.title?.english || 'Unknown',
        image: m.coverImage?.large || m.coverImage?.medium || '',
        format: m.format,
        chapters: m.chapters,
        score: m.meanScore,
        genres: m.genres?.slice(0, 3) || [],
        year: m.startDate?.year,
        status: m.status,
      })),
      hasNextPage: result.hasNextPage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Search failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
