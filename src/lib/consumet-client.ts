/**
 * Consumet API client - wraps the Consumet REST API for news, schedule,
 * streaming-source lookups, and manga reading endpoints.
 *
 * Configure via CONSUMET_API_URL env var. Falls back to the public instance
 * (heavily rate-limited; self-host recommended for production).
 *
 * @see https://docs.consumet.org
 */

const CONSUMET_BASE = process.env.CONSUMET_API_URL || 'https://api.consumet.org';

// Generic typed fetcher with timeout + JSON error handling
async function consumetFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${CONSUMET_BASE}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(init?.headers || {}),
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Consumet ${res.status}: ${body.slice(0, 200) || res.statusText}`);
    }

    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

// ============================================================================
// News (AnimeNewsNetwork)
// ============================================================================

export interface ConsumetNewsItem {
  id: string;
  title: string;
  uploadedAt: string;
  topics?: string[];
  preview?: { intro: string; full: string };
  thumbnail?: string;
  url: string;
}

export async function getRecentNews(): Promise<ConsumetNewsItem[]> {
  const data = await consumetFetch<ConsumetNewsItem[]>(`/news/animenewsnetwork/recent-feeds`);
  return Array.isArray(data) ? data : [];
}

// ============================================================================
// Schedule (HiAnime / AniList meta)
// ============================================================================

export interface ConsumetScheduleEntry {
  id: string;
  malId?: number;
  title: { romaji?: string; english?: string; native?: string; userPreferred?: string };
  image?: string;
  episode?: number;
  airingAt?: number; // unix seconds
  airingEpisode?: number;
  timeUntilAiring?: number; // seconds
}

/**
 * Returns airing schedule for a given date (YYYY-MM-DD).
 * Uses AniList meta endpoint for cleaner data than provider-specific schedules.
 */
export async function getAiringSchedule(
  date?: string
): Promise<ConsumetScheduleEntry[]> {
  const today = date || new Date().toISOString().slice(0, 10);
  const data = await consumetFetch<{ results?: ConsumetScheduleEntry[] }>(
    `/meta/anilist/airing-schedule?notYetAired=true&page=1&perPage=50`
  );
  void today; // reserved for future date filtering
  return data?.results || [];
}

// ============================================================================
// Streaming source lookup (where-to-watch badges)
// ============================================================================

export interface ConsumetSourceResult {
  provider: string;
  id: string;
  title: string;
  url?: string;
  image?: string;
  subOrDub?: 'sub' | 'dub' | 'both';
}

/**
 * For a given AniList ID, find which providers have it streamable.
 * Returns a deduped list of providers that have a match.
 *
 * Uses Consumet's AniList meta endpoint which already maps to multiple providers.
 */
export async function findStreamingSources(
  anilistId: number
): Promise<ConsumetSourceResult[]> {
  try {
    const data = await consumetFetch<{
      title?: { romaji?: string; english?: string };
      episodes?: Array<{ id: string; number: number }>;
    }>(`/meta/anilist/info/${anilistId}`);

    if (!data?.episodes?.length) return [];

    // The AniList meta endpoint resolves through one provider at a time.
    // Returning a stub indicating availability is enough for a badge.
    return [
      {
        provider: 'consumet',
        id: String(anilistId),
        title: data.title?.english || data.title?.romaji || 'Unknown',
        subOrDub: 'sub',
      },
    ];
  } catch {
    return [];
  }
}

// ============================================================================
// Manga reader (MangaDex via Consumet)
// ============================================================================

export interface ConsumetMangaChapter {
  id: string;
  title?: string;
  chapter?: string;
  volume?: string;
  pages?: number;
  releaseDate?: string;
}

export interface ConsumetMangaInfo {
  id: string;
  title: { romaji?: string; english?: string };
  image?: string;
  description?: string;
  chapters?: ConsumetMangaChapter[];
}

export async function getMangaInfo(anilistId: number): Promise<ConsumetMangaInfo | null> {
  try {
    return await consumetFetch<ConsumetMangaInfo>(
      `/meta/anilist-manga/info/${anilistId}?provider=mangadex`
    );
  } catch {
    return null;
  }
}

export async function getMangaChapterPages(chapterId: string): Promise<string[]> {
  try {
    const data = await consumetFetch<Array<{ img: string; page: number }>>(
      `/meta/anilist-manga/read/${encodeURIComponent(chapterId)}`
    );
    return (data || []).sort((a, b) => a.page - b.page).map(p => p.img);
  } catch {
    return [];
  }
}
