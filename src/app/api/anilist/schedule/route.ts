import { NextResponse } from 'next/server';
import { anilistClient } from '@/lib/anilist-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Returns a deduplicated weekly airing schedule.
 * Each anime appears once on its regular air day (the episode closest to now).
 */
export async function GET() {
  try {
    const now = Math.floor(Date.now() / 1000);
    const startAt = now - 3 * 24 * 60 * 60; // 3 days ago
    const endAt = now + 14 * 24 * 60 * 60;  // 14 days ahead

    // AniList caps perPage at 50, so paginate through all pages
    const allSchedules: Awaited<ReturnType<typeof anilistClient.getAiringSchedule>> = [];
    const perPage = 50;
    const maxPages = 10;

    for (let page = 1; page <= maxPages; page++) {
      const pageResults = await anilistClient.getAiringSchedule(startAt, endAt, perPage, page);
      allSchedules.push(...pageResults);
      if (pageResults.length < perPage) break; // No more pages
    }

    // Deduplicate by anime ID, keeping the episode closest to now (current week's airing)
    const byAnime = new Map<number, typeof allSchedules[0]>();
    for (const entry of allSchedules) {
      const existing = byAnime.get(entry.media.id);
      if (!existing) {
        byAnime.set(entry.media.id, entry);
      } else {
        const existingDiff = Math.abs(existing.airingAt - now);
        const entryDiff = Math.abs(entry.airingAt - now);
        if (entryDiff < existingDiff) {
          byAnime.set(entry.media.id, entry);
        }
      }
    }

    const deduplicated = Array.from(byAnime.values());

    return NextResponse.json({
      results: deduplicated.map((entry) => ({
        id: entry.media.id,
        title: entry.media.title?.userPreferred || entry.media.title?.romaji || 'Unknown',
        image: entry.media.coverImage?.large || entry.media.coverImage?.medium || '',
        episode: entry.episode,
        airingAt: entry.airingAt,
        timeUntilAiring: entry.airingAt - now,
        format: entry.media.format,
        totalEpisodes: entry.media.episodes,
        score: entry.media.meanScore,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch schedule';
    console.error('[Schedule API]', message);
    return NextResponse.json({ error: message, results: [] }, { status: 200 });
  }
}
