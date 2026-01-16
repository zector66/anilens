// Taste Snapshot Types for Studio v2 Phase 2

export interface TasteSnapshot {
  id: string;
  userId: string;
  createdAt: string; // ISO date
  mode: 'ANIME' | 'MANGA';
  label?: string; // User-defined label like "Summer 2024" or auto-generated
  
  // Core stats at time of snapshot
  stats: {
    totalTitles: number;
    meanScore: number;
    completionRate: number;
    episodesWatched?: number;
    chaptersRead?: number;
  };
  
  // Top preferences at time of snapshot
  topGenres: Array<{ name: string; strength: number }>;
  topTags: Array<{ name: string; strength: number }>;
  topStudios: Array<{ name: string; strength: number }>;
  
  // Behavioral metrics
  metrics: {
    diversityIndex: number;
    nicheIndex: number;
    mainstreamIndex: number;
  };
  
  // Generated fingerprint
  fingerprint: string;
  archetype: string;
  
  // Optional thumbnail (base64 mini poster)
  thumbnail?: string;
}

export interface SnapshotComparison {
  older: TasteSnapshot;
  newer: TasteSnapshot;
  
  // Computed diffs
  statsDiff: {
    totalTitles: number;
    meanScore: number;
    completionRate: number;
  };
  
  // Genre shifts
  genreShifts: Array<{
    name: string;
    oldStrength: number;
    newStrength: number;
    direction: 'up' | 'down' | 'stable' | 'new' | 'dropped';
  }>;
  
  // Tag shifts
  tagShifts: Array<{
    name: string;
    oldStrength: number;
    newStrength: number;
    direction: 'up' | 'down' | 'stable' | 'new' | 'dropped';
  }>;
  
  // Studio shifts
  studioShifts: Array<{
    name: string;
    oldStrength: number;
    newStrength: number;
    direction: 'up' | 'down' | 'stable' | 'new' | 'dropped';
  }>;
  
  // Metric changes
  metricChanges: {
    diversityIndex: number;
    nicheIndex: number;
    mainstreamIndex: number;
  };
}

export interface FriendComparison {
  user: {
    id: string;
    name: string;
    avatar?: string;
    snapshot: TasteSnapshot;
  };
  friend: {
    id: string;
    name: string;
    avatar?: string;
    snapshot: TasteSnapshot;
  };
  
  // Similarity metrics
  similarity: {
    overall: number; // 0-100
    genreMatch: number;
    tagMatch: number;
    studioMatch: number;
    scoreCorrelation: number;
  };
  
  // Shared preferences
  sharedGenres: string[];
  sharedTags: string[];
  sharedStudios: string[];
  
  // Unique to each
  uniqueToUser: {
    genres: string[];
    tags: string[];
  };
  uniqueToFriend: {
    genres: string[];
    tags: string[];
  };
}

// Storage key for localStorage
export const SNAPSHOT_STORAGE_KEY = 'anilens_taste_snapshots';
export const MAX_SNAPSHOTS = 10;

// Helper to generate snapshot ID
export function generateSnapshotId(): string {
  return `snap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Helper to auto-generate snapshot label
export function generateSnapshotLabel(date: Date = new Date()): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}
