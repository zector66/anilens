/**
 * Supabase persistent caching for taste profiles
 * Survives refreshes and works across devices
 */

import { supabase } from './supabase';
import { TasteProfile, MediaListEntry } from '@/types/anilist';

export interface CachedTasteProfile {
  userId: number;
  type: 'ANIME' | 'MANGA';
  timeWindow: 'all' | '12months' | '90days';
  includedStatuses: string[];
  listHash: string;
  profile: TasteProfile;
  analysisVersion: string;
  createdAt: string;
  dataCompleteness: DataCompletenessFlags;
}

export interface DataCompletenessFlags {
  totalEntries: number;
  entriesWithScores: number;
  entriesWithTags: number;
  entriesWithStudios: number;
  entriesWithDates: number;
  missingTagsPercent: number;
  missingStudiosPercent: number;
  isReliable: boolean;
  warnings: string[];
}

// Current analysis version - bump when algorithm changes
export const ANALYSIS_VERSION = '2.0.0';

/**
 * Generate a stable hash from media list entries
 * Changes if: entry added/removed, score changed, status changed, progress changed
 */
export function generateListHash(entries: MediaListEntry[], type: 'ANIME' | 'MANGA'): string {
  if (entries.length === 0) return `${type}-empty`;
  
  // Sort entries by ID for consistency
  const sorted = [...entries].sort((a, b) => a.id - b.id);
  
  // Create hash components
  const idSum = sorted.reduce((sum, e) => sum + e.id, 0);
  const scoreSum = sorted.reduce((sum, e) => sum + (e.score || 0), 0);
  const progressSum = sorted.reduce((sum, e) => sum + (e.progress || 0), 0);
  const statusHash = sorted.map(e => e.status?.charAt(0) || 'X').join('');
  
  // Get first and last IDs for uniqueness
  const firstId = sorted[0].id;
  const lastId = sorted[sorted.length - 1].id;
  
  // Create a compact hash string
  return `${type}-${entries.length}-${idSum}-${scoreSum}-${progressSum}-${firstId}-${lastId}-${statusHash.length > 50 ? statusHash.slice(0, 50) : statusHash}`;
}

/**
 * Analyze data completeness and generate warnings
 */
export function analyzeDataCompleteness(entries: MediaListEntry[], type: 'ANIME' | 'MANGA'): DataCompletenessFlags {
  const totalEntries = entries.length;
  const warnings: string[] = [];
  
  if (totalEntries === 0) {
    return {
      totalEntries: 0,
      entriesWithScores: 0,
      entriesWithTags: 0,
      entriesWithStudios: 0,
      entriesWithDates: 0,
      missingTagsPercent: 100,
      missingStudiosPercent: 100,
      isReliable: false,
      warnings: ['No entries to analyze']
    };
  }
  
  const entriesWithScores = entries.filter(e => e.score && e.score > 0).length;
  const entriesWithTags = entries.filter(e => e.media?.tags && e.media.tags.length > 0).length;
  const entriesWithStudios = entries.filter(e => {
    if (type === 'ANIME') return e.media?.studios?.edges && e.media.studios.edges.length > 0;
    return e.media?.staff?.edges && e.media.staff.edges.length > 0;
  }).length;
  const entriesWithDates = entries.filter(e => e.media?.startDate?.year).length;
  
  const missingTagsPercent = ((totalEntries - entriesWithTags) / totalEntries) * 100;
  const missingStudiosPercent = ((totalEntries - entriesWithStudios) / totalEntries) * 100;
  const missingScoresPercent = ((totalEntries - entriesWithScores) / totalEntries) * 100;
  
  // Generate warnings
  if (totalEntries < 20) {
    warnings.push(`Only ${totalEntries} entries — results may be less stable`);
  }
  if (missingScoresPercent > 50) {
    warnings.push(`${Math.round(missingScoresPercent)}% of titles unscored — preference signals limited`);
  }
  if (missingTagsPercent > 30) {
    warnings.push(`${Math.round(missingTagsPercent)}% of titles missing tags — theme analysis may be imprecise`);
  }
  if (missingStudiosPercent > 40) {
    warnings.push(`${Math.round(missingStudiosPercent)}% of titles missing ${type === 'ANIME' ? 'studios' : 'authors'}`);
  }
  
  const isReliable = totalEntries >= 20 && missingScoresPercent < 70 && missingTagsPercent < 50;
  
  return {
    totalEntries,
    entriesWithScores,
    entriesWithTags,
    entriesWithStudios,
    entriesWithDates,
    missingTagsPercent,
    missingStudiosPercent,
    isReliable,
    warnings
  };
}

/**
 * Save taste profile to Supabase cache
 */
export async function saveTasteProfileCache(
  userId: number,
  type: 'ANIME' | 'MANGA',
  timeWindow: 'all' | '12months' | '90days',
  includedStatuses: string[],
  listHash: string,
  profile: TasteProfile,
  dataCompleteness: DataCompletenessFlags
): Promise<boolean> {
  if (!supabase) {
    console.warn('[TasteProfileCache] Supabase not configured');
    return false;
  }
  
  try {
    const { error } = await supabase
      .from('taste_profile_cache')
      .upsert({
        user_id: userId,
        type,
        time_window: timeWindow,
        included_statuses: includedStatuses,
        list_hash: listHash,
        profile: profile,
        analysis_version: ANALYSIS_VERSION,
        data_completeness: dataCompleteness,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,type,time_window',
      });
    
    if (error) {
      console.error('[TasteProfileCache] Failed to save:', error);
      return false;
    }
    
    console.log('[TasteProfileCache] Saved profile for user', userId, type);
    return true;
  } catch (e) {
    console.error('[TasteProfileCache] Error saving:', e);
    return false;
  }
}

/**
 * Load taste profile from Supabase cache
 * Returns null if cache miss or stale
 */
export async function loadTasteProfileCache(
  userId: number,
  type: 'ANIME' | 'MANGA',
  timeWindow: 'all' | '12months' | '90days',
  currentListHash: string
): Promise<{ profile: TasteProfile; dataCompleteness: DataCompletenessFlags } | null> {
  if (!supabase) {
    console.warn('[TasteProfileCache] Supabase not configured');
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from('taste_profile_cache')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .eq('time_window', timeWindow)
      .single();
    
    if (error || !data) {
      console.log('[TasteProfileCache] Cache miss for user', userId, type);
      return null;
    }
    
    // Check if list hash matches (invalidate if list changed)
    if (data.list_hash !== currentListHash) {
      console.log('[TasteProfileCache] Cache stale (list changed) for user', userId, type);
      return null;
    }
    
    // Check if analysis version matches (invalidate if algorithm updated)
    if (data.analysis_version !== ANALYSIS_VERSION) {
      console.log('[TasteProfileCache] Cache stale (version mismatch) for user', userId, type);
      return null;
    }
    
    console.log('[TasteProfileCache] Cache hit for user', userId, type);
    return {
      profile: data.profile as TasteProfile,
      dataCompleteness: data.data_completeness as DataCompletenessFlags
    };
  } catch (e) {
    console.error('[TasteProfileCache] Error loading:', e);
    return null;
  }
}

/**
 * Invalidate cache for a user (call when they manually refresh)
 */
export async function invalidateTasteProfileCache(
  userId: number,
  type?: 'ANIME' | 'MANGA'
): Promise<boolean> {
  if (!supabase) return false;
  
  try {
    let query = supabase
      .from('taste_profile_cache')
      .delete()
      .eq('user_id', userId);
    
    if (type) {
      query = query.eq('type', type);
    }
    
    const { error } = await query;
    
    if (error) {
      console.error('[TasteProfileCache] Failed to invalidate:', error);
      return false;
    }
    
    console.log('[TasteProfileCache] Invalidated cache for user', userId);
    return true;
  } catch (e) {
    console.error('[TasteProfileCache] Error invalidating:', e);
    return false;
  }
}
