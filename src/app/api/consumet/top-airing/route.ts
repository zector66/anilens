import { NextResponse } from 'next/server';
import { anilistClient } from '@/lib/anilist-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const media = await anilistClient.getTopAiring('ANIME', 12);

    return NextResponse.json({
      results: media.map((m) => ({
        id: m.id,
        title: m.title?.userPreferred || m.title?.romaji || m.title?.english || 'Unknown',
        image: m.coverImage?.large || m.coverImage?.medium || '',
        format: m.format,
        episodes: m.episodes,
        score: m.meanScore,
        genres: m.genres?.slice(0, 3) || [],
        year: m.seasonYear,
        status: m.status,
        nextEpisode: m.nextAiringEpisode?.episode,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch top airing';
    console.error('[TopAiring API]', message);
    return NextResponse.json({ error: message, results: [] }, { status: 200 });
  }
}
