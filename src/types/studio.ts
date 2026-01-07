export type StudioMedia = "anime" | "manga" | "both";
export type StudioTimeWindow = "all" | "last12m" | "year" | { from: string; to: string };
export type StudioStatus = "COMPLETED" | "CURRENT" | "DROPPED" | "PAUSED" | "PLANNING" | "REPEATING" | "WATCHING" | "READING";
export type StudioTemplate = "compact" | "poster" | "ultra";
export type StudioTone = "neutral" | "spicy";
export type StudioTheme = { mode: "dark" | "light"; accent: string };

export interface StudioPrivacy {
  hideUsername?: boolean;
  hideCounts?: boolean;
  hideScores?: boolean;
  hideAvatar?: boolean;
}

export interface StudioModule {
  id: string;
  enabled: boolean;
  settings?: Record<string, string | number | boolean>;
}

export interface StudioConfig {
  media: StudioMedia;
  timeWindow: StudioTimeWindow;
  statuses: StudioStatus[];
  template: StudioTemplate;
  tone: StudioTone;
  theme: StudioTheme;
  privacy: StudioPrivacy;
  modules: StudioModule[];
}

// Core poster data structure - deterministic and complete
export interface PosterData {
  // Header
  header: {
    username: string;
    avatar: string;
    banner: string;
    subtitle: string;
    watermark: string;
  };

  // Top content
  topAnime: {
    primary: { id: number; title: string; cover: string; score?: number; impact: number };
    secondary: Array<{ id: number; title: string; cover: string; score?: number; impact: number }>;
  };

  topManga: {
    primary: { id: number; title: string; cover: string; score?: number; impact: number };
    secondary: Array<{ id: number; title: string; cover: string; score?: number; impact: number }>;
  };

  // Stats blocks
  animeStats: {
    episodesWatched: number;
    completed: number;
    dropped: number;
    meanScore: number;
    daysWatched?: number;
  };

  mangaStats: {
    chaptersRead: number;
    completed: number;
    dropped: number;
    meanScore: number;
    volumesRead?: number;
  };

  // Analytics
  percentiles: {
    niche: { value: number; label: string };
    mainstream: { value: number; label: string };
    diversity: { value: number; label: string };
  };

  // Content modules
  topTags: Array<{ tag: string; weight: number; count: number }>;
  genreRadar: Array<{ genre: string; affinity: number }>;
  monthlyActivity: Array<{ month: string; count: number }>;
  hottestTake: { type: string; content: string; mediaId?: number };
  tasteContradiction: string;
  fingerprint: string;
  confidence: "high" | "medium" | "low";

  // Games (unique advantage)
  gamesRank: {
    mmr: number;
    rank: string;
    bestGame: string;
    rankIcon: string;
  };

  // Metadata
  metadata: {
    totalEntries: number;
    timeRange: string;
    generatedAt: string;
    template: StudioTemplate;
  };
}

// Module definitions
export const STUDIO_MODULES = {
  TOP_ANIME: { id: "topAnime", name: "Top Anime", defaultCount: 5 },
  TOP_MANGA: { id: "topManga", name: "Top Manga", defaultCount: 5 },
  ANIME_STATS: { id: "animeStats", name: "Anime Stats" },
  MANGA_STATS: { id: "mangaStats", name: "Manga Stats" },
  PERCENTILES: { id: "percentiles", name: "Percentiles" },
  TOP_TAGS: { id: "topTags", name: "Top Tags", defaultCount: 20 },
  GENRE_RADAR: { id: "genreRadar", name: "Genre Radar" },
  MONTHLY_ACTIVITY: { id: "monthlyActivity", name: "Monthly Activity" },
  HOTTEST_TAKE: { id: "hottestTake", name: "Hottest Take" },
  GAMES_RANK: { id: "gamesRank", name: "Games Rank" },
  TASTE_FINGERPRINT: { id: "tasteFingerprint", name: "Taste Fingerprint" },
  CONTRADICTION: { id: "contradiction", name: "Taste Contradiction" },
} as const;

export type StudioModuleId = typeof STUDIO_MODULES[keyof typeof STUDIO_MODULES]["id"];
