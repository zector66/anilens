import { NextResponse } from 'next/server';
import { anilistClient } from '@/lib/anilist-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const media = await anilistClient.getJustFinished('ANIME', 10);

    return NextResponse.json({
      results: media.map((m: { id: number; title?: { userPreferred?: string; romaji?: string; english?: string }; coverImage?: { large?: string; medium?: string }; format?: string; episodes?: number; meanScore?: number; seasonYear?: number; status?: string; endDate?: { year?: number; month?: number; day?: number } }) => ({
        id: m.id,
        title: m.title?.userPreferred || m.title?.romaji || m.title?.english || 'Unknown',
        image: m.coverImage?.large || m.coverImage?.medium || '',
        format: m.format,
        episodes: m.episodes,
        score: m.meanScore,
        year: m.seasonYear || m.endDate?.year,
        status: m.status,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch just finished';
    console.error('[JustFinished API]', message);
    return NextResponse.json({ error: message, results: [] }, { status: 200 });
  }
}
