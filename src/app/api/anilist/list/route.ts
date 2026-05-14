import { NextRequest, NextResponse } from 'next/server';
import { anilistClient } from '@/lib/anilist-client';
import { getCachedList, setCachedList } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ANALYSIS_VERSION = 'v1';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') as 'ANIME' | 'MANGA';
    const forceRefresh = searchParams.get('forceRefresh') === 'true';

    if (!userId || !type) {
      return NextResponse.json(
        { error: 'Missing userId or type parameter' },
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

    return NextResponse.json({
      data: freshData,
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

// Helper function to calculate max updatedAt from list data
function calculateMaxUpdatedAt(listData: any): number {
  if (!listData?.MediaListCollection?.lists) return Date.now();

  let maxUpdatedAt = 0;

  for (const list of listData.MediaListCollection.lists) {
    if (!list.entries) continue;

    for (const entry of list.entries) {
      if (entry.updatedAt && entry.updatedAt > maxUpdatedAt) {
        maxUpdatedAt = entry.updatedAt;
      }
    }
  }

  return maxUpdatedAt || Date.now();
}
