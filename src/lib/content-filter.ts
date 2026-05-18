/**
 * Content Filter System
 * 
 * Global adult content filtering that defaults to "safe" mode.
 * Affects: Games, Recommendations, Studio cards, Leaderboards
 * Storage: Supabase user_settings with localStorage fallback
 */

import { supabase } from './supabase';

export interface ContentFilterSettings {
  hideAdult: boolean;          // Hide adult (18+) content - default ON
  hideEcchi: boolean;          // Hide ecchi/suggestive content - default OFF
  blurNsfwCovers: boolean;     // Blur covers instead of hiding - default OFF
  includeInAnalysis: boolean;  // Include adult content in taste analysis - default ON
}

export const DEFAULT_CONTENT_FILTER: ContentFilterSettings = {
  hideAdult: true,             // Safe by default
  hideEcchi: false,            // Not as aggressive by default
  blurNsfwCovers: false,       // Hide completely by default
  includeInAnalysis: true,     // Keep statistical honesty
};

const STORAGE_KEY = 'anilens_content_filter';

// Ecchi-related tags to filter
export const ECCHI_TAGS = [
  'Ecchi',
  'Fanservice',
  'Female Harem',
  'Male Harem',
  'Nudity',
  'Sexual Content',
];

// ============================================
// Local Storage Operations
// ============================================

export function getContentFilterFromStorage(): ContentFilterSettings {
  if (typeof window === 'undefined') return DEFAULT_CONTENT_FILTER;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_CONTENT_FILTER, ...parsed };
    }
  } catch (e) {
    console.error('[ContentFilter] Failed to read from localStorage:', e);
  }
  
  return DEFAULT_CONTENT_FILTER;
}

export function saveContentFilterToStorage(settings: ContentFilterSettings): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('[ContentFilter] Failed to save to localStorage:', e);
  }
}

// ============================================
// Supabase Operations
// ============================================

export async function loadContentFilterFromSupabase(userId: number): Promise<ContentFilterSettings | null> {
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('content_filter')
      .eq('anilist_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No row found - that's okay, use defaults
        return null;
      }
      throw error;
    }
    
    if (data?.content_filter) {
      return { ...DEFAULT_CONTENT_FILTER, ...data.content_filter };
    }
    
    return null;
  } catch (e) {
    console.error('[ContentFilter] Failed to load from Supabase:', e);
    return null;
  }
}

export async function saveContentFilterToSupabase(
  userId: number, 
  settings: ContentFilterSettings
): Promise<boolean> {
  if (!supabase) return false;
  
  try {
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        anilist_id: userId,
        content_filter: settings,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'anilist_id',
      });
    
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('[ContentFilter] Failed to save to Supabase:', e);
    return false;
  }
}

// ============================================
// Media Filtering Functions
// ============================================

export interface FilterableMedia {
  id: number;
  isAdult?: boolean;
  genres?: string[];
  tags?: Array<{ name: string; rank?: number }>;
}

/**
 * Check if a single media item should be filtered out
 */
export function shouldFilterMedia(
  media: FilterableMedia,
  settings: ContentFilterSettings
): boolean {
  // If hideAdult is on and media is adult, filter it
  if (settings.hideAdult && media.isAdult === true) {
    return true;
  }
  
  // If hideEcchi is on, check for ecchi tags/genres
  if (settings.hideEcchi) {
    // Check genres
    if (media.genres?.some(g => ECCHI_TAGS.includes(g))) {
      return true;
    }
    
    // Check tags (only high-rank tags, rank > 60)
    if (media.tags?.some(t => ECCHI_TAGS.includes(t.name) && (t.rank || 0) > 60)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Filter an array of media based on content settings
 */
export function filterMediaList<T extends FilterableMedia>(
  mediaList: T[],
  settings: ContentFilterSettings
): T[] {
  return mediaList.filter(media => !shouldFilterMedia(media, settings));
}

/**
 * Check if a media should have its cover blurred
 */
export function shouldBlurCover(
  media: FilterableMedia,
  settings: ContentFilterSettings
): boolean {
  if (!settings.blurNsfwCovers) return false;
  
  // Blur adult content
  if (media.isAdult === true) return true;
  
  // Blur ecchi content if hideEcchi is also on
  if (settings.hideEcchi) {
    if (media.genres?.some(g => ECCHI_TAGS.includes(g))) return true;
    if (media.tags?.some(t => ECCHI_TAGS.includes(t.name) && (t.rank || 0) > 60)) return true;
  }
  
  return false;
}

/**
 * Get filter stats for debugging/display
 */
export function getFilterStats<T extends FilterableMedia>(
  mediaList: T[],
  settings: ContentFilterSettings
): { total: number; filtered: number; shown: number } {
  const filtered = mediaList.filter(media => shouldFilterMedia(media, settings)).length;
  return {
    total: mediaList.length,
    filtered,
    shown: mediaList.length - filtered,
  };
}
