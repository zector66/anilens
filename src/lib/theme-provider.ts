/**
 * Anime Theme Provider
 * 
 * Abstract interface for fetching anime OP/ED themes.
 * Currently implements AnimeThemes API (https://api-docs.animethemes.moe/)
 * 
 * Constraints:
 * - Stream from returned mirrors, never rehost media
 * - Cache + request coalescing to stay under 90 req/min
 * - Store only theme IDs + metadata, not files
 * - Graceful fallback on errors/rate-limits/520s
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ThemeMetadata {
  id: string;
  animeId: number;          // AniList ID
  animeName: string;
  type: 'OP' | 'ED';
  sequence: number;         // OP1, ED2, etc.
  songTitle: string;
  artistName: string;
  videoUrl: string;         // Direct stream URL from mirror
  audioUrl?: string;        // Audio-only URL if available
}

export interface ThemeProviderResult {
  success: boolean;
  themes: ThemeMetadata[];
  error?: string;
  fromCache?: boolean;
}

export interface ThemeProvider {
  getThemesByAniListId(anilistId: number): Promise<ThemeProviderResult>;
  getThemesByAnimeName(name: string): Promise<ThemeProviderResult>;
  getRandomTheme(anilistIds: number[]): Promise<ThemeMetadata | null>;
}

// ============================================================================
// Rate Limiter & Request Coalescing
// ============================================================================

class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 85, windowMs: number = 60000) {
    // Stay under 90 req/min with buffer
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async acquire(): Promise<boolean> {
    const now = Date.now();
    // Remove requests outside the window
    this.requests = this.requests.filter(t => now - t < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      // Calculate wait time
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest) + 100;
      console.log(`[RateLimiter] Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.acquire(); // Retry after waiting
    }
    
    this.requests.push(now);
    return true;
  }

  getRemaining(): number {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < this.windowMs);
    return this.maxRequests - this.requests.length;
  }
}

class RequestCoalescer<T> {
  private pending = new Map<string, Promise<T>>();

  async coalesce(key: string, fetcher: () => Promise<T>): Promise<T> {
    const existing = this.pending.get(key);
    if (existing) {
      console.log(`[RequestCoalescer] Coalescing request for key: ${key}`);
      return existing;
    }

    const promise = fetcher().finally(() => {
      this.pending.delete(key);
    });

    this.pending.set(key, promise);
    return promise;
  }
}

// ============================================================================
// Cache Implementation
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ThemeCache {
  private cache = new Map<string, CacheEntry<ThemeMetadata[]>>();
  private readonly defaultTTL = 30 * 60 * 1000; // 30 minutes

  get(key: string): ThemeMetadata[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(key: string, data: ThemeMetadata[], ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTTL,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// ============================================================================
// AnimeThemes API Implementation
// ============================================================================

const ANIMETHEMES_BASE_URL = 'https://api.animethemes.moe';

interface AnimeThemesAnime {
  id: number;
  name: string;
  slug: string;
  animethemes?: AnimeThemesTheme[];
}

interface AnimeThemesTheme {
  id: number;
  type: string;
  sequence: number;
  slug: string;
  song?: {
    id: number;
    title: string;
    artists?: Array<{
      id: number;
      name: string;
      slug: string;
    }>;
  };
  animethemeentries?: AnimeThemesEntry[];
}

interface AnimeThemesEntry {
  id: number;
  version: number | null;
  episodes: string | null;
  nsfw: boolean;
  spoiler: boolean;
  videos?: AnimeThemesVideo[];
}

interface AnimeThemesVideo {
  id: number;
  basename: string;
  filename: string;
  link: string;
  resolution: number;
  nc: boolean;
  subbed: boolean;
  lyrics: boolean;
  overlap: string;
  audio?: {
    id: number;
    basename: string;
    link: string;
  };
}

class AnimeThemesProvider implements ThemeProvider {
  private rateLimiter = new RateLimiter(85, 60000);
  private coalescer = new RequestCoalescer<ThemeProviderResult>();
  private cache = new ThemeCache();
  private failureCount = 0;
  private lastFailure = 0;
  private readonly maxFailures = 5;
  private readonly failureResetMs = 5 * 60 * 1000; // 5 minutes

  private async fetch<T>(url: string): Promise<T | null> {
    // Check circuit breaker
    if (this.isCircuitOpen()) {
      console.log('[AnimeThemesProvider] Circuit breaker open, skipping request');
      return null;
    }

    await this.rateLimiter.acquire();

    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 520 || response.status === 429) {
          this.recordFailure();
          console.error(`[AnimeThemesProvider] Rate limited or server error: ${response.status}`);
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.resetFailures();
      return await response.json();
    } catch (error) {
      this.recordFailure();
      console.error('[AnimeThemesProvider] Fetch error:', error);
      return null;
    }
  }

  private isCircuitOpen(): boolean {
    if (this.failureCount >= this.maxFailures) {
      const timeSinceLastFailure = Date.now() - this.lastFailure;
      if (timeSinceLastFailure < this.failureResetMs) {
        return true;
      }
      // Reset after cooldown
      this.resetFailures();
    }
    return false;
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailure = Date.now();
  }

  private resetFailures(): void {
    this.failureCount = 0;
  }

  async getThemesByAniListId(anilistId: number): Promise<ThemeProviderResult> {
    const cacheKey = `anilist:${anilistId}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return { success: true, themes: cached, fromCache: true };
    }

    // Coalesce concurrent requests for the same ID
    return this.coalescer.coalesce(cacheKey, async () => {
      // Search by AniList external resource
      const url = `${ANIMETHEMES_BASE_URL}/anime?filter[has]=resources&filter[site]=AniList&filter[external_id]=${anilistId}&include=animethemes.song.artists,animethemes.animethemeentries.videos.audio`;
      
      const response = await this.fetch<{ anime: AnimeThemesAnime[] }>(url);
      
      if (!response || !response.anime || response.anime.length === 0) {
        return { 
          success: false, 
          themes: [], 
          error: 'No themes found for this anime' 
        };
      }

      const themes = this.transformThemes(response.anime[0], anilistId);
      
      if (themes.length > 0) {
        this.cache.set(cacheKey, themes);
      }

      return { success: true, themes };
    });
  }

  async getThemesByAnimeName(name: string): Promise<ThemeProviderResult> {
    const cacheKey = `name:${name.toLowerCase()}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return { success: true, themes: cached, fromCache: true };
    }

    return this.coalescer.coalesce(cacheKey, async () => {
      const encodedName = encodeURIComponent(name);
      const url = `${ANIMETHEMES_BASE_URL}/anime?filter[name-like]=%${encodedName}%&include=animethemes.song.artists,animethemes.animethemeentries.videos.audio&page[size]=1`;
      
      const response = await this.fetch<{ anime: AnimeThemesAnime[] }>(url);
      
      if (!response || !response.anime || response.anime.length === 0) {
        return { 
          success: false, 
          themes: [], 
          error: 'No themes found for this anime' 
        };
      }

      const themes = this.transformThemes(response.anime[0], 0);
      
      if (themes.length > 0) {
        this.cache.set(cacheKey, themes);
      }

      return { success: true, themes };
    });
  }

  async getRandomTheme(anilistIds: number[]): Promise<ThemeMetadata | null> {
    // Shuffle and try IDs until we find one with themes
    const shuffled = [...anilistIds].sort(() => Math.random() - 0.5);
    
    for (const id of shuffled.slice(0, 10)) { // Try up to 10
      const result = await this.getThemesByAniListId(id);
      if (result.success && result.themes.length > 0) {
        // Return a random theme from this anime
        const randomTheme = result.themes[Math.floor(Math.random() * result.themes.length)];
        return randomTheme;
      }
    }
    
    return null;
  }

  private transformThemes(anime: AnimeThemesAnime, anilistId: number): ThemeMetadata[] {
    const themes: ThemeMetadata[] = [];
    
    if (!anime.animethemes) return themes;

    for (const theme of anime.animethemes) {
      // Get the best video entry (prefer non-NSFW, non-spoiler, highest resolution)
      const entry = theme.animethemeentries?.find(e => !e.nsfw && !e.spoiler) 
                 ?? theme.animethemeentries?.[0];
      
      if (!entry?.videos?.length) continue;

      // Sort videos by resolution (highest first), prefer non-NC (creditless)
      const sortedVideos = [...entry.videos].sort((a, b) => {
        if (a.nc !== b.nc) return a.nc ? 1 : -1; // Prefer with credits
        return b.resolution - a.resolution;
      });

      const video = sortedVideos[0];
      if (!video?.link) continue;

      const artistNames = theme.song?.artists?.map(a => a.name).join(', ') || 'Unknown Artist';

      themes.push({
        id: `animethemes:${theme.id}`,
        animeId: anilistId,
        animeName: anime.name,
        type: theme.type === 'OP' ? 'OP' : 'ED',
        sequence: theme.sequence || 1,
        songTitle: theme.song?.title || `${theme.type}${theme.sequence || 1}`,
        artistName: artistNames,
        videoUrl: video.link,
        audioUrl: video.audio?.link,
      });
    }

    return themes;
  }

  // Status methods for monitoring
  getRateLimitStatus(): { remaining: number; total: number } {
    return {
      remaining: this.rateLimiter.getRemaining(),
      total: 85,
    };
  }

  getCacheStatus(): { size: number } {
    return { size: this.cache.size() };
  }

  isHealthy(): boolean {
    return !this.isCircuitOpen();
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

let providerInstance: AnimeThemesProvider | null = null;

export function getThemeProvider(): ThemeProvider {
  if (!providerInstance) {
    providerInstance = new AnimeThemesProvider();
  }
  return providerInstance;
}

// Export the concrete class for status checks
export function getThemeProviderStatus(): {
  healthy: boolean;
  rateLimit: { remaining: number; total: number };
  cache: { size: number };
} {
  if (!providerInstance) {
    providerInstance = new AnimeThemesProvider();
  }
  return {
    healthy: providerInstance.isHealthy(),
    rateLimit: providerInstance.getRateLimitStatus(),
    cache: providerInstance.getCacheStatus(),
  };
}
