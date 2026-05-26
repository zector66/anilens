import { NextRequest, NextResponse } from 'next/server';
import { anilistClient } from '@/lib/anilist-client';
import { getCachedList, setCachedList } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const type = (searchParams.get('type') || 'ANIME') as 'ANIME' | 'MANGA';
    const forceRefresh = searchParams.get('forceRefresh') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const anilistId = parseInt(userId);

    // Try to get from cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = await getCachedList(anilistId, type);
      
      if (cached) {
        // Lightweight query: only fetch updatedAt timestamps to check freshness
        const freshMaxUpdatedAt = await anilistClient.getListMaxUpdatedAt(anilistId, type);

        // If cache is still valid, return it without fetching full list
        if (cached.max_updated_at === freshMaxUpdatedAt) {
          return NextResponse.json({
            data: cached.payload_json,
            results: flattenListEntries(cached.payload_json as Parameters<typeof flattenListEntries>[0]),
            cached: true,
            cachedAt: cached.cached_at,
            maxUpdatedAt: cached.max_updated_at
          });
        }

        // Cache is stale - fetch fresh full list
        const freshData = type === 'ANIME'
          ? await anilistClient.getAnimeList(anilistId)
          : await anilistClient.getMangaList(anilistId);
        await setCachedList(anilistId, type, freshMaxUpdatedAt, freshData);

        return NextResponse.json({
          data: freshData,
          results: flattenListEntries(freshData),
          cached: false,
          updated: true,
          maxUpdatedAt: freshMaxUpdatedAt
        });
      }
    }

    // No cache or force refresh - fetch fresh data
    const freshData = type === 'ANIME'
      ? await anilistClient.getAnimeList(anilistId)
      : await anilistClient.getMangaList(anilistId);

    const maxUpdatedAt = calculateMaxUpdatedAt(freshData);

    // Cache the fresh data
    await setCachedList(anilistId, type, maxUpdatedAt, freshData);

    const results = flattenListEntries(freshData);

    return NextResponse.json({
      data: freshData,
      results,
      cached: false,
      maxUpdatedAt
    });

  } catch (error) {
    console.error('[API] Error fetching list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch list data' },
      { status: 500 }
    );
  }
}

interface ListEntry {
  id: number;
  score: number;
  image: string;
  title: string;
}

function flattenListEntries(listData: { lists?: Array<{ entries?: Array<{ mediaId?: number; score?: number; media?: { coverImage?: { large?: string; medium?: string }; title?: { romaji?: string; english?: string; userPreferred?: string } } }> }> }): ListEntry[] {
  const entries: ListEntry[] = [];
  for (const list of listData?.lists || []) {
    for (const entry of list.entries || []) {
      if (entry.media) {
        entries.push({
          id: entry.mediaId || 0,
          score: entry.score ?? 0,
          image: entry.media.coverImage?.large || entry.media.coverImage?.medium || '',
          title: entry.media.title?.userPreferred || entry.media.title?.romaji || entry.media.title?.english || 'Unknown',
        });
      }
    }
  }
  return entries;
}

function calculateMaxUpdatedAt(listData: { lists?: Array<{ entries?: Array<{ updatedAt?: number }> }> }): number {
  if (!listData?.lists) return Date.now();

  let maxUpdatedAt = 0;

  for (const list of listData.lists) {
    if (!list.entries) continue;

    for (const entry of list.entries) {
      if (entry.updatedAt && entry.updatedAt > maxUpdatedAt) {
        maxUpdatedAt = entry.updatedAt;
      }
    }
  }

  return maxUpdatedAt || Date.now();
}
