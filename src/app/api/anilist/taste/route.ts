import { NextRequest, NextResponse } from 'next/server';
import { anilistClient } from '@/lib/anilist-client';
import { getCachedTasteProfile, setCachedTasteProfile } from '@/lib/db';
import { TasteAnalyzer } from '@/lib/taste-analyzer';
import { normalizeMediaList } from '@/lib/normalize-media-list';

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
      const cached = await getCachedTasteProfile(anilistId, type, ANALYSIS_VERSION);
      
      if (cached) {
        // Fetch fresh list data to check if it's stale
        const freshListData = type === 'ANIME'
          ? await anilistClient.getAnimeList(anilistId)
          : await anilistClient.getMangaList(anilistId);

        const freshMaxUpdatedAt = calculateMaxUpdatedAt(freshListData);

        // If cache is still valid, return it
        if (cached.max_updated_at === freshMaxUpdatedAt) {
          return NextResponse.json({
            data: cached.profile_json,
            cached: true,
            computedAt: cached.computed_at,
            maxUpdatedAt: cached.max_updated_at,
            version: ANALYSIS_VERSION
          });
        }

        // Cache is stale, recompute
        const normalizedEntries = normalizeMediaList(freshListData);
        const tasteProfile = TasteAnalyzer.analyzeTaste(normalizedEntries, type);

        await setCachedTasteProfile(
          anilistId,
          type,
          ANALYSIS_VERSION,
          freshMaxUpdatedAt,
          tasteProfile
        );

        return NextResponse.json({
          data: tasteProfile,
          cached: false,
          updated: true,
          maxUpdatedAt: freshMaxUpdatedAt,
          version: ANALYSIS_VERSION
        });
      }
    }

    // No cache or force refresh - fetch and compute
    const listData = type === 'ANIME'
      ? await anilistClient.getAnimeList(anilistId)
      : await anilistClient.getMangaList(anilistId);

    const maxUpdatedAt = calculateMaxUpdatedAt(listData);
    const normalizedEntries = normalizeMediaList(listData);
    const tasteProfile = TasteAnalyzer.analyzeTaste(normalizedEntries, type);

    // Cache the computed profile
    await setCachedTasteProfile(
      anilistId,
      type,
      ANALYSIS_VERSION,
      maxUpdatedAt,
      tasteProfile
    );

    return NextResponse.json({
      data: tasteProfile,
      cached: false,
      maxUpdatedAt,
      version: ANALYSIS_VERSION
    });

  } catch (error) {
    console.error('[API] Error computing taste profile:', error);
    return NextResponse.json(
      { error: 'Failed to compute taste profile' },
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
