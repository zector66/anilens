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

// ============================================
// STUDIO EDITOR TYPES (v2 - Drag & Drop Canvas)
// ============================================

export type ExportPreset = "story" | "post" | "banner" | "square" | "custom";

export interface ExportConfig {
  preset: ExportPreset;
  width: number;
  height: number;
  scale: number; // 1x, 2x, 3x for high-res
  format: "png" | "jpeg" | "webp";
  quality: number; // 0-100 for jpeg/webp
}

export const EXPORT_PRESETS: Record<ExportPreset, { width: number; height: number; label: string; aspect: string }> = {
  story: { width: 1080, height: 1920, label: "Story (9:16)", aspect: "9/16" },
  post: { width: 1080, height: 1350, label: "Post (4:5)", aspect: "4/5" },
  banner: { width: 1920, height: 1080, label: "Banner (16:9)", aspect: "16/9" },
  square: { width: 1080, height: 1080, label: "Square (1:1)", aspect: "1/1" },
  custom: { width: 1200, height: 800, label: "Custom", aspect: "auto" },
};

// Widget positioning on canvas
export interface WidgetPosition {
  x: number; // Grid units or pixels
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

export type WidgetType = 
  | "header"
  | "topMedia" 
  | "stats"
  | "percentiles"
  | "tags"
  | "genreRadar"
  | "activity"
  | "hottestTake"
  | "gamesRank"
  | "fingerprint"
  | "emotional"
  | "contradiction"
  | "custom";

export interface StudioWidget {
  id: string;
  type: WidgetType;
  position: WidgetPosition;
  settings: Record<string, unknown>;
  visible: boolean;
  locked: boolean;
}

// Template definition (full project template, not to be confused with StudioTemplate layout type)
export interface StudioProjectTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  exportPreset: ExportPreset;
  theme: StudioTheme;
  widgets: StudioWidget[];
  createdAt?: string;
  isBuiltIn: boolean;
}

// Full project that can be saved/loaded
export interface StudioProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  exportConfig: ExportConfig;
  theme: StudioTheme;
  widgets: StudioWidget[];
  config: StudioConfig; // Data filtering config
  templateId?: string; // If based on a template
}

// Canvas editor state
export interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  selectedWidgetId: string | null;
}

// Default widget configs by type
export const DEFAULT_WIDGET_SIZES: Record<WidgetType, { width: number; height: number }> = {
  header: { width: 12, height: 2 },
  topMedia: { width: 4, height: 6 },
  stats: { width: 4, height: 4 },
  percentiles: { width: 3, height: 4 },
  tags: { width: 4, height: 3 },
  genreRadar: { width: 4, height: 4 },
  activity: { width: 6, height: 3 },
  hottestTake: { width: 4, height: 2 },
  gamesRank: { width: 3, height: 3 },
  fingerprint: { width: 3, height: 2 },
  emotional: { width: 4, height: 4 },
  contradiction: { width: 4, height: 2 },
  custom: { width: 4, height: 4 },
};

// Built-in templates
// ============================================
// STUDIO POSTER PROFILE (Wrapped-style poster)
// ============================================

export type TimeWindow = 'ALL_TIME' | '12M' | '90D';
export type WeightingStyle = 'preference' | 'exposure' | 'balanced';
export type PosterStylePreset = 'minimal' | 'neon' | 'clean-dark';

export interface StudioPosterSettings {
  timeWindow: TimeWindow;
  statuses: ('COMPLETED' | 'CURRENT' | 'DROPPED' | 'PAUSED' | 'REPEATING')[];
  weightingStyle: WeightingStyle;
  excludeFormats: string[];
  theme: {
    mode: 'dark' | 'light';
    accent: string;
    stylePreset: PosterStylePreset;
  };
}

export interface IndexStat {
  label: string;
  value: number;
  displayValue: string;
  descriptor: string;
  color: string;
}

export interface TopMediaItem {
  id: number;
  title: string;
  cover: string;
  score?: number;
  color?: string;
}

export interface StudioPosterProfile {
  // User info
  user: {
    id: number;
    name: string;
    avatar: string;
    banner: string | null;
    fallbackGradient?: string;
  };
  
  // Mode
  mode: 'ANIME' | 'MANGA';
  
  // Settings used
  settings: StudioPosterSettings;
  
  // The summary line ("Your lane")
  summaryLine: string;
  
  // Core indices (6 max for poster)
  indices: IndexStat[];
  
  // Top media (covers for poster)
  topMedia: TopMediaItem[];
  
  // Top content
  topGenres: Array<{ name: string; strength: number }>;
  topTags: Array<{ name: string; strength: number }>;
  topStudiosOrAuthors: Array<{ name: string; strength: number; count?: number; percentage?: number; era?: string }>;
  
  // Activity stats
  activityStats: {
    totalTitles: number;
    episodesWatched?: number;
    chaptersRead?: number;
    daysActive?: number;
    meanScore: number;
    completionRate: number;
  };
  
  // Metadata
  metadata: {
    totalEntries: number;
    timeRange: string;
    generatedAt: string;
    version: string;
    statusesIncluded: string[];
  };
}

export const DEFAULT_POSTER_SETTINGS: StudioPosterSettings = {
  timeWindow: 'ALL_TIME',
  statuses: ['COMPLETED'],
  weightingStyle: 'balanced',
  excludeFormats: [],
  theme: {
    mode: 'dark',
    accent: '#8b5cf6',
    stylePreset: 'clean-dark',
  },
};

export const BUILT_IN_TEMPLATES: Omit<StudioProjectTemplate, "widgets">[] = [
  {
    id: "profile-overview",
    name: "Profile Overview",
    description: "Classic profile summary with stats, top media, and taste insights",
    exportPreset: "banner",
    theme: { mode: "dark", accent: "#8b5cf6" },
    isBuiltIn: true,
  },
  {
    id: "minimal-stats",
    name: "Minimal Stats",
    description: "Clean, minimal view focusing on key statistics",
    exportPreset: "square",
    theme: { mode: "dark", accent: "#3b82f6" },
    isBuiltIn: true,
  },
  {
    id: "top-picks",
    name: "Top Picks Showcase",
    description: "Highlight your favorite anime and manga",
    exportPreset: "post",
    theme: { mode: "dark", accent: "#10b981" },
    isBuiltIn: true,
  },
  {
    id: "year-in-review",
    name: "Year in Review",
    description: "Annual summary with activity and highlights",
    exportPreset: "story",
    theme: { mode: "dark", accent: "#f59e0b" },
    isBuiltIn: true,
  },
  {
    id: "taste-analysis",
    name: "Taste Analysis",
    description: "Deep dive into your taste patterns and emotional profile",
    exportPreset: "banner",
    theme: { mode: "dark", accent: "#ef4444" },
    isBuiltIn: true,
  },
];
