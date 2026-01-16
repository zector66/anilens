'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  TasteSnapshot, 
  SnapshotComparison,
  SNAPSHOT_STORAGE_KEY, 
  MAX_SNAPSHOTS,
  generateSnapshotId,
  generateSnapshotLabel 
} from '@/types/snapshot';
import { StudioPosterProfile } from '@/types/studio';
import { TasteProfile } from '@/types/anilist';
import { generateFingerprint } from '@/lib/fingerprint-generator';

interface UseSnapshotsReturn {
  snapshots: TasteSnapshot[];
  isLoading: boolean;
  saveSnapshot: (profile: StudioPosterProfile, tasteProfile: TasteProfile, label?: string) => TasteSnapshot | null;
  deleteSnapshot: (id: string) => void;
  updateSnapshotLabel: (id: string, label: string) => void;
  getSnapshot: (id: string) => TasteSnapshot | undefined;
  compareSnapshots: (olderId: string, newerId: string) => SnapshotComparison | null;
  canSaveSnapshot: boolean;
}

export function useSnapshots(userId?: string): UseSnapshotsReturn {
  const [snapshots, setSnapshots] = useState<TasteSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load snapshots from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
      if (stored) {
        const allSnapshots: TasteSnapshot[] = JSON.parse(stored);
        // Filter by userId if provided
        const userSnapshots = userId 
          ? allSnapshots.filter(s => s.userId === userId)
          : allSnapshots;
        setSnapshots(userSnapshots.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      }
    } catch (e) {
      console.error('[useSnapshots] Failed to load snapshots:', e);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Save snapshots to localStorage
  const persistSnapshots = useCallback((newSnapshots: TasteSnapshot[]) => {
    if (typeof window === 'undefined') return;
    
    try {
      // Get all snapshots, update user's snapshots, save back
      const stored = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
      const allSnapshots: TasteSnapshot[] = stored ? JSON.parse(stored) : [];
      
      // Remove old user snapshots
      const otherSnapshots = userId 
        ? allSnapshots.filter(s => s.userId !== userId)
        : [];
      
      // Combine and save
      const combined = [...otherSnapshots, ...newSnapshots];
      localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(combined));
    } catch (e) {
      console.error('[useSnapshots] Failed to persist snapshots:', e);
    }
  }, [userId]);

  // Save a new snapshot
  const saveSnapshot = useCallback((
    profile: StudioPosterProfile, 
    tasteProfile: TasteProfile,
    label?: string
  ): TasteSnapshot | null => {
    if (!userId || snapshots.length >= MAX_SNAPSHOTS) {
      return null;
    }

    // Generate fingerprint
    const fingerprint = generateFingerprint({
      profile: tasteProfile,
      totalEntries: profile.activityStats.totalTitles,
      completionRate: profile.activityStats.completionRate,
      meanScore: profile.activityStats.meanScore,
      topStudio: profile.topStudiosOrAuthors[0]?.name,
      topGenre: profile.topGenres[0]?.name,
      mode: profile.mode,
    });

    const snapshot: TasteSnapshot = {
      id: generateSnapshotId(),
      userId,
      createdAt: new Date().toISOString(),
      mode: profile.mode,
      label: label || generateSnapshotLabel(),
      
      stats: {
        totalTitles: profile.activityStats.totalTitles,
        meanScore: profile.activityStats.meanScore,
        completionRate: profile.activityStats.completionRate,
        episodesWatched: profile.activityStats.episodesWatched,
        chaptersRead: profile.activityStats.chaptersRead,
      },
      
      topGenres: profile.topGenres.slice(0, 10).map(g => ({
        name: g.name,
        strength: g.strength,
      })),
      
      topTags: profile.topTags.slice(0, 15).map(t => ({
        name: t.name,
        strength: t.strength,
      })),
      
      topStudios: profile.topStudiosOrAuthors.slice(0, 8).map(s => ({
        name: s.name,
        strength: s.strength,
      })),
      
      metrics: {
        diversityIndex: tasteProfile.behavioralMetrics?.diversityIndex || 0.5,
        nicheIndex: tasteProfile.behavioralMetrics?.nicheIndex || 0.5,
        mainstreamIndex: tasteProfile.behavioralMetrics?.mainstreamIndex || 0.5,
      },
      
      fingerprint: fingerprint.short,
      archetype: fingerprint.archetype,
    };

    const newSnapshots = [snapshot, ...snapshots].slice(0, MAX_SNAPSHOTS);
    setSnapshots(newSnapshots);
    persistSnapshots(newSnapshots);
    
    return snapshot;
  }, [userId, snapshots, persistSnapshots]);

  // Delete a snapshot
  const deleteSnapshot = useCallback((id: string) => {
    const newSnapshots = snapshots.filter(s => s.id !== id);
    setSnapshots(newSnapshots);
    persistSnapshots(newSnapshots);
  }, [snapshots, persistSnapshots]);

  // Update snapshot label
  const updateSnapshotLabel = useCallback((id: string, label: string) => {
    const newSnapshots = snapshots.map(s => 
      s.id === id ? { ...s, label } : s
    );
    setSnapshots(newSnapshots);
    persistSnapshots(newSnapshots);
  }, [snapshots, persistSnapshots]);

  // Get a specific snapshot
  const getSnapshot = useCallback((id: string) => {
    return snapshots.find(s => s.id === id);
  }, [snapshots]);

  // Compare two snapshots
  const compareSnapshots = useCallback((olderId: string, newerId: string): SnapshotComparison | null => {
    const older = snapshots.find(s => s.id === olderId);
    const newer = snapshots.find(s => s.id === newerId);
    
    if (!older || !newer) return null;

    // Calculate genre shifts
    const genreShifts = calculateShifts(older.topGenres, newer.topGenres);
    const tagShifts = calculateShifts(older.topTags, newer.topTags);
    const studioShifts = calculateShifts(older.topStudios, newer.topStudios);

    return {
      older,
      newer,
      statsDiff: {
        totalTitles: newer.stats.totalTitles - older.stats.totalTitles,
        meanScore: newer.stats.meanScore - older.stats.meanScore,
        completionRate: newer.stats.completionRate - older.stats.completionRate,
      },
      genreShifts,
      tagShifts,
      studioShifts,
      metricChanges: {
        diversityIndex: newer.metrics.diversityIndex - older.metrics.diversityIndex,
        nicheIndex: newer.metrics.nicheIndex - older.metrics.nicheIndex,
        mainstreamIndex: newer.metrics.mainstreamIndex - older.metrics.mainstreamIndex,
      },
    };
  }, [snapshots]);

  return {
    snapshots,
    isLoading,
    saveSnapshot,
    deleteSnapshot,
    updateSnapshotLabel,
    getSnapshot,
    compareSnapshots,
    canSaveSnapshot: snapshots.length < MAX_SNAPSHOTS,
  };
}

// Helper to calculate shifts between two arrays
function calculateShifts(
  oldItems: Array<{ name: string; strength: number }>,
  newItems: Array<{ name: string; strength: number }>
): Array<{
  name: string;
  oldStrength: number;
  newStrength: number;
  direction: 'up' | 'down' | 'stable' | 'new' | 'dropped';
}> {
  const oldMap = new Map(oldItems.map(i => [i.name, i.strength]));
  const newMap = new Map(newItems.map(i => [i.name, i.strength]));
  const allNames = new Set([...oldMap.keys(), ...newMap.keys()]);
  
  const shifts: Array<{
    name: string;
    oldStrength: number;
    newStrength: number;
    direction: 'up' | 'down' | 'stable' | 'new' | 'dropped';
  }> = [];

  for (const name of allNames) {
    const oldStrength = oldMap.get(name) || 0;
    const newStrength = newMap.get(name) || 0;
    
    let direction: 'up' | 'down' | 'stable' | 'new' | 'dropped';
    if (oldStrength === 0) {
      direction = 'new';
    } else if (newStrength === 0) {
      direction = 'dropped';
    } else if (newStrength > oldStrength + 0.05) {
      direction = 'up';
    } else if (newStrength < oldStrength - 0.05) {
      direction = 'down';
    } else {
      direction = 'stable';
    }

    shifts.push({ name, oldStrength, newStrength, direction });
  }

  // Sort by absolute change
  return shifts.sort((a, b) => 
    Math.abs(b.newStrength - b.oldStrength) - Math.abs(a.newStrength - a.oldStrength)
  );
}
