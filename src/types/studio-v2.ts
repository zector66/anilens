/**
 * Studio v2 - Modular AniWrapped-Style Poster System
 * 
 * This defines the modular grid system with toggleable/reorderable sections.
 */

export type LayoutPreset = 'wrapped' | 'clean' | 'gamer' | 'poster-wall' | 'stats-nerd';

export interface LayoutPresetConfig {
  id: LayoutPreset;
  name: string;
  description: string;
  modules: ModuleId[];
  theme: Partial<StudioThemeV2>;
}

export type ModuleId = 
  | 'hero'           // Avatar + banner + username + badge + fingerprint
  | 'top-covers'     // Top 9 cover grid
  | 'hidden-gems'    // 3 niche picks
  | 'genre-bars'     // Genre distribution bars
  | 'tag-chips'      // Tag cloud/chips
  | 'studios'        // Top studios centerpiece
  | 'era-timeline'   // Era preference strip
  | 'format-dist'    // Format distribution (icons + %)
  | 'risk-profile'   // Popularity bucket
  | 'emotional'      // 5-axis emotional profile
  | 'stats-row'      // Completion, drops, mean score, etc.
  | 'archetype'      // "You are..." archetype card
  | 'taste-shift'    // Time window comparison
  | 'percentiles'    // Flex stats with percentiles
  | 'fingerprint';   // Taste fingerprint one-liner

export interface StudioModuleConfig {
  id: ModuleId;
  name: string;
  description: string;
  defaultEnabled: boolean;
  minHeight: number; // Grid units
  defaultSettings?: Record<string, unknown>;
}

export const STUDIO_MODULES_V2: Record<ModuleId, StudioModuleConfig> = {
  'hero': {
    id: 'hero',
    name: 'Hero Header',
    description: 'Avatar, banner, username, and taste fingerprint',
    defaultEnabled: true,
    minHeight: 2,
  },
  'top-covers': {
    id: 'top-covers',
    name: 'Top Covers',
    description: 'Grid of your top-rated anime/manga covers',
    defaultEnabled: true,
    minHeight: 3,
    defaultSettings: { count: 9, layout: 'grid' },
  },
  'hidden-gems': {
    id: 'hidden-gems',
    name: 'Hidden Gems',
    description: 'Your most niche, underrated picks',
    defaultEnabled: true,
    minHeight: 2,
    defaultSettings: { count: 3 },
  },
  'genre-bars': {
    id: 'genre-bars',
    name: 'Genre Distribution',
    description: 'Bar chart of your genre preferences',
    defaultEnabled: true,
    minHeight: 2,
    defaultSettings: { count: 6, style: 'bars' },
  },
  'tag-chips': {
    id: 'tag-chips',
    name: 'Top Tags',
    description: 'Your most common themes and tags',
    defaultEnabled: true,
    minHeight: 1,
    defaultSettings: { count: 12 },
  },
  'studios': {
    id: 'studios',
    name: 'Top Studios',
    description: 'Your favorite studios/authors centerpiece',
    defaultEnabled: true,
    minHeight: 3,
    defaultSettings: { count: 5 },
  },
  'era-timeline': {
    id: 'era-timeline',
    name: 'Era Timeline',
    description: 'Your preference across anime eras',
    defaultEnabled: false,
    minHeight: 1,
  },
  'format-dist': {
    id: 'format-dist',
    name: 'Format Distribution',
    description: 'TV, Movie, OVA breakdown',
    defaultEnabled: false,
    minHeight: 1,
  },
  'risk-profile': {
    id: 'risk-profile',
    name: 'Risk Profile',
    description: 'Mainstream vs niche popularity bucket',
    defaultEnabled: true,
    minHeight: 1,
  },
  'emotional': {
    id: 'emotional',
    name: 'Emotional Profile',
    description: '5-axis emotional preferences',
    defaultEnabled: false,
    minHeight: 2,
  },
  'stats-row': {
    id: 'stats-row',
    name: 'Stats Summary',
    description: 'Completion rate, mean score, drops, etc.',
    defaultEnabled: true,
    minHeight: 1,
  },
  'archetype': {
    id: 'archetype',
    name: 'Archetype',
    description: '"You are..." personality archetype',
    defaultEnabled: true,
    minHeight: 1,
  },
  'taste-shift': {
    id: 'taste-shift',
    name: 'Taste Shift',
    description: 'How your taste has changed over time',
    defaultEnabled: false,
    minHeight: 2,
  },
  'percentiles': {
    id: 'percentiles',
    name: 'Percentile Stats',
    description: 'How you compare to others',
    defaultEnabled: true,
    minHeight: 1,
  },
  'fingerprint': {
    id: 'fingerprint',
    name: 'Taste Fingerprint',
    description: 'One-liner taste summary',
    defaultEnabled: true,
    minHeight: 1,
  },
};

export interface StudioThemeV2 {
  mode: 'dark' | 'light';
  accent: string;
  background: 'gradient' | 'solid' | 'noise' | 'banner-blur';
  roundedness: 'sharp' | 'medium' | 'rounded';
  compact: boolean;
}

export interface StudioModuleState {
  id: ModuleId;
  enabled: boolean;
  order: number;
  settings?: Record<string, unknown>;
}

export interface StudioV2Settings {
  // Content
  mode: 'ANIME' | 'MANGA';
  timeWindow: 'ALL_TIME' | '12M' | '90D';
  statuses: string[];
  hideAdult: boolean;
  
  // Style
  theme: StudioThemeV2;
  layoutPreset: LayoutPreset;
  
  // Modules
  modules: StudioModuleState[];
  
  // Export
  aspectRatio: 'wide' | 'post' | 'story' | 'square';
  exportQuality: 'normal' | 'hq';
  watermark: 'full' | 'minimal' | 'off';
}

export const LAYOUT_PRESETS: Record<LayoutPreset, LayoutPresetConfig> = {
  'wrapped': {
    id: 'wrapped',
    name: 'Wrapped',
    description: 'Maximum info, polished AniWrapped style',
    modules: ['hero', 'top-covers', 'studios', 'genre-bars', 'tag-chips', 'stats-row', 'percentiles', 'archetype'],
    theme: { background: 'banner-blur', roundedness: 'rounded' },
  },
  'clean': {
    id: 'clean',
    name: 'Clean',
    description: 'Minimal and aesthetic',
    modules: ['hero', 'top-covers', 'studios', 'fingerprint'],
    theme: { background: 'solid', roundedness: 'medium', compact: true },
  },
  'gamer': {
    id: 'gamer',
    name: 'Gamer Card',
    description: 'Stats and rank focused',
    modules: ['hero', 'stats-row', 'percentiles', 'risk-profile', 'archetype', 'top-covers'],
    theme: { background: 'gradient', roundedness: 'sharp' },
  },
  'poster-wall': {
    id: 'poster-wall',
    name: 'Poster Wall',
    description: 'Covers-first visual showcase',
    modules: ['hero', 'top-covers', 'hidden-gems', 'studios'],
    theme: { background: 'banner-blur', roundedness: 'rounded' },
  },
  'stats-nerd': {
    id: 'stats-nerd',
    name: 'Stats Nerd',
    description: 'Charts and metrics heavy',
    modules: ['hero', 'stats-row', 'genre-bars', 'percentiles', 'risk-profile', 'emotional', 'era-timeline', 'format-dist'],
    theme: { background: 'solid', roundedness: 'medium' },
  },
};

export const DEFAULT_STUDIO_V2_SETTINGS: StudioV2Settings = {
  mode: 'ANIME',
  timeWindow: 'ALL_TIME',
  statuses: ['COMPLETED', 'CURRENT', 'REPEATING'],
  hideAdult: false,
  theme: {
    mode: 'dark',
    accent: '#8b5cf6',
    background: 'banner-blur',
    roundedness: 'rounded',
    compact: false,
  },
  layoutPreset: 'wrapped',
  modules: Object.values(STUDIO_MODULES_V2).map((m, i) => ({
    id: m.id,
    enabled: m.defaultEnabled,
    order: i,
  })),
  aspectRatio: 'wide',
  exportQuality: 'normal',
  watermark: 'full',
};

// Auto-generated one-liner templates
export const FINGERPRINT_TEMPLATES = {
  niche_drama: "Niche-leaning drama explorer with high completion.",
  mainstream_action: "Mainstream action grinder with high binge velocity.",
  mood_chaser: "Tag-diverse mood chaser: dark → wholesome swings.",
  studio_loyalist: "Studio loyalist with refined {studio} appreciation.",
  genre_specialist: "{genre} specialist with adventurous side picks.",
  completionist: "Methodical completionist with eclectic taste.",
  seasonal_surfer: "Seasonal surfer catching every trending wave.",
  classic_purist: "Classic purist with timeless taste.",
  hidden_gem_hunter: "Hidden gem hunter who digs deep for quality.",
  binge_master: "Binge master with marathon-level dedication.",
};

// Cover grid categories
export type CoverCategory = 'top-rated' | 'most-rewatched' | 'most-emotional' | 'most-niche' | 'recent-favorites';

export interface CoverGridItem {
  id: number;
  title: string;
  cover: string;
  score?: number;
  category: CoverCategory;
  reason?: string; // "Rewatched 3x", "Top 5% niche", etc.
}

// Percentile stat for flex display
export interface PercentileStat {
  id: string;
  label: string;
  value: number;
  percentile: number;
  displayText: string; // "More niche than 78% of users"
  color: string;
}
