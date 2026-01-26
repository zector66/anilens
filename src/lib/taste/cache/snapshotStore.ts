import { TasteResult } from '../types/TasteResult';
import { supabase } from '@/lib/supabase';

const SNAPSHOT_TABLE = 'taste_snapshots';
const CACHE_VERSION = '2.0.0'; // Bump to invalidate old caches

/**
 * Snapshot storage - SEPARATE from taste computation
 * This only handles saving/loading, never computing
 */
export async function saveSnapshot(taste: TasteResult): Promise<void> {
  try {
    if (!supabase) {
      console.warn('[snapshotStore] Supabase not available');
      return;
    }

    const snapshot = {
      user_id: taste.meta.userId,
      media_type: taste.meta.mediaType,
      taste_data: taste,
      computed_at: taste.meta.computedAt.toISOString(),
      version: taste.meta.version,
      cache_version: CACHE_VERSION
    };

    const { error } = await supabase
      .from(SNAPSHOT_TABLE)
      .upsert(snapshot, {
        onConflict: 'user_id,media_type'
      });

    if (error) {
      console.warn('[snapshotStore] Failed to save snapshot:', error);
      // Don't throw - snapshot failures shouldn't break taste computation
    }
  } catch (err) {
    console.warn('[snapshotStore] Snapshot save failed:', err);
  }
}

export async function loadSnapshot(
  userId: number, 
  mediaType: 'ANIME' | 'MANGA'
): Promise<TasteResult | null> {
  try {
    if (!supabase) {
      console.warn('[snapshotStore] Supabase not available');
      return null;
    }

    const { data, error } = await supabase
      .from(SNAPSHOT_TABLE)
      .select('taste_data,computed_at')
      .eq('user_id', userId)
      .eq('media_type', mediaType)
      .eq('cache_version', CACHE_VERSION)
      .single();

    if (error || !data) {
      return null;
    }

    // Check if snapshot is stale (older than 24 hours)
    const computedAt = new Date(data.computed_at);
    const now = new Date();
    const hoursOld = (now.getTime() - computedAt.getTime()) / (1000 * 60 * 60);
    
    if (hoursOld > 24) {
      console.log('[snapshotStore] Snapshot is stale, ignoring');
      return null;
    }

    // Parse the taste data and restore date
    const taste = data.taste_data as TasteResult;
    taste.meta.computedAt = new Date(taste.meta.computedAt);

    return taste;
  } catch (err) {
    console.warn('[snapshotStore] Snapshot load failed:', err);
    return null;
  }
}

export async function deleteSnapshot(
  userId: number, 
  mediaType: 'ANIME' | 'MANGA'
): Promise<void> {
  try {
    if (!supabase) {
      console.warn('[snapshotStore] Supabase not available');
      return;
    }

    const { error } = await supabase
      .from(SNAPSHOT_TABLE)
      .delete()
      .eq('user_id', userId)
      .eq('media_type', mediaType);

    if (error) {
      console.warn('[snapshotStore] Failed to delete snapshot:', error);
    }
  } catch (err) {
    console.warn('[snapshotStore] Snapshot delete failed:', err);
  }
}
