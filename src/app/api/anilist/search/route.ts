import { NextResponse } from 'next/server';
import { anilistClient } from '@/lib/anilist-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('q') || undefined;
    const genres = searchParams.get('genres')?.split(',').filter(Boolean) || undefined;
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || undefined;
    const rawYear = searchParams.get('year');
    const year = rawYear && !isNaN(parseInt(rawYear, 10)) ? parseInt(rawYear, 10) : undefined;
    const season = searchParams.get('season') || undefined;
    const status = searchParams.get('status') || undefined;
    const format = searchParams.get('format') || undefined;
    const source = searchParams.get('source') || undefined;
    const countryOfOrigin = searchParams.get('country') || undefined;
    const rawScoreMin = searchParams.get('scoreMin');
    const averageScore_greater = rawScoreMin && !isNaN(parseInt(rawScoreMin, 10)) ? parseInt(rawScoreMin, 10) : undefined;
    const rawScoreMax = searchParams.get('scoreMax');
    const averageScore_lesser = rawScoreMax && !isNaN(parseInt(rawScoreMax, 10)) ? parseInt(rawScoreMax, 10) : undefined;
    const isAdult = searchParams.get('isAdult') === 'true' ? true : undefined;
    const sort = searchParams.get('sort') || 'POPULARITY_DESC';
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;
    const perPage = searchParams.get('perPage') ? parseInt(searchParams.get('perPage')!, 10) : 24;

    const result = await anilistClient.advancedSearch({
      search,
      type: 'ANIME',
      genres,
      tags,
      year,
      season,
      status,
      format,
      source,
      countryOfOrigin,
      averageScore_greater,
      averageScore_lesser,
      isAdult,
      sort,
      page,
      perPage,
    });

    return NextResponse.json({
      results: result.media.map((m: { id: number; title?: { userPreferred?: string; romaji?: string; english?: string }; coverImage?: { large?: string; medium?: string }; format?: string; episodes?: number; meanScore?: number; seasonYear?: number; status?: string; genres?: string[] }) => ({
        id: m.id,
        title: m.title?.userPreferred || m.title?.romaji || m.title?.english || 'Unknown',
        image: m.coverImage?.large || m.coverImage?.medium || '',
        format: m.format,
        episodes: m.episodes,
        score: m.meanScore,
        year: m.seasonYear,
        status: m.status,
        genres: m.genres?.slice(0, 3) || [],
      })),
      hasNextPage: result.hasNextPage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Search failed';
    const err = error as { response?: { status?: number; headers?: Record<string, string> | Headers } };
    const status = err?.response?.status;

    // Surface AniList rate limit errors with proper status + Retry-After header
    if (status === 429) {
      console.warn('[Search API] AniList rate limited');
      const headers = err?.response?.headers;
      const retryAfter =
        headers instanceof Headers
          ? headers.get('retry-after')
          : (headers as Record<string, string> | undefined)?.['retry-after'] || '60';
      return NextResponse.json(
        { error: 'AniList rate limit exceeded. Please wait a moment and try again.', results: [], hasNextPage: false, retryAfter },
        { status: 429, headers: { 'Retry-After': retryAfter || '60' } }
      );
    }

    console.error('[Search API]', message);
    return NextResponse.json({ error: message, results: [], hasNextPage: false }, { status: 200 });
  }
}
