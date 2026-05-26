import { NextResponse } from 'next/server';
import { anilistClient } from '@/lib/anilist-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const media = await anilistClient.getTopRated('ANIME', 18);

    return NextResponse.json({
      results: media.map((m: { id: number; title?: { userPreferred?: string; romaji?: string; english?: string }; coverImage?: { large?: string; medium?: string }; format?: string; episodes?: number; meanScore?: number; genres?: string[]; seasonYear?: number; status?: string }) => ({
        id: m.id,
        title: m.title?.userPreferred || m.title?.romaji || m.title?.english || 'Unknown',
        image: m.coverImage?.large || m.coverImage?.medium || '',
        format: m.format,
        episodes: m.episodes,
        score: m.meanScore,
        genres: m.genres?.slice(0, 3) || [],
        year: m.seasonYear,
        status: m.status,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch top rated';
    console.error('[TopRated API]', message);
    return NextResponse.json({ error: message, results: [] }, { status: 200 });
  }
}
