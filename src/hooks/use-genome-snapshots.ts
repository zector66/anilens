'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TasteGenome } from '@/lib/taste-genome';
import { 
  GenomeSnapshot, 
  TasteDrift, 
  DriftTimeline,
  genomeToSnapshot,
  buildDriftTimeline
} from '@/lib/taste-drift';

// Kill switch for snapshots - disable if causing issues
const SNAPSHOTS_ENABLED = process.env.NEXT_PUBLIC_SNAPSHOTS_ENABLED === 'true';

/**
 * Fetch genome snapshot history for a user
 */
export function useGenomeSnapshots(
  anilistId: number | undefined,
  mediaType: 'ANIME' | 'MANGA',
  limit: number = 12
) {
  return useQuery({
    queryKey: ['genome-snapshots', anilistId, mediaType, limit],
    queryFn: async (): Promise<GenomeSnapshot[]> => {
      // Kill switch: return empty if snapshots disabled
      if (!SNAPSHOTS_ENABLED) {
        console.log('[SNAPSHOTS DISABLED]');
        return [];
      }
      
      if (!anilistId) return [];
      
      const response = await fetch(
        `/api/genome/snapshot?anilistId=${anilistId}&mediaType=${mediaType}&limit=${limit}`
      );
      
      console.log("[SNAPSHOT RESULT]", {
        ok: response.ok,
        status: response.status,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[SNAPSHOT ERROR]", errorData);
        throw new Error(`Failed to fetch genome snapshots: ${errorData.message || response.statusText}`);
      }
      
      const data = await response.json();
      console.log("[SNAPSHOT DATA]", {
        count: data.snapshots?.length,
        hasSnapshots: !!data.snapshots,
        isCacheMiss: data.snapshots?.length === 0,
      });
      return data.snapshots.map((s: GenomeSnapshot) => ({
        ...s,
        createdAt: new Date(s.createdAt)
      }));
    },
    enabled: !!anilistId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Save a new genome snapshot
 */
export function useSaveGenomeSnapshot() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      genome,
      anilistId,
      mediaType,
      listHash,
      entryCount
    }: {
      genome: TasteGenome;
      anilistId: number;
      mediaType: 'ANIME' | 'MANGA';
      listHash?: string;
      entryCount?: number;
    }) => {
      // Kill switch: skip save if snapshots disabled
      if (!SNAPSHOTS_ENABLED) {
        console.log('[SNAPSHOTS DISABLED - SKIP SAVE]');
        return { success: false, message: 'Snapshots disabled' };
      }
      
      const snapshot = genomeToSnapshot(genome, anilistId, mediaType, listHash, entryCount);
      
      const response = await fetch('/api/genome/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save genome snapshot');
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate snapshot queries for this user
      queryClient.invalidateQueries({
        queryKey: ['genome-snapshots', variables.anilistId, variables.mediaType]
      });
    }
  });
}

/**
 * Calculate drift between snapshots
 */
export function useTasteDrift(
  anilistId: number | undefined,
  mediaType: 'ANIME' | 'MANGA'
) {
  const { data: snapshots, isLoading, error } = useGenomeSnapshots(anilistId, mediaType);
  
  // Calculate drift timeline
  const timeline: DriftTimeline | null = snapshots && snapshots.length >= 2
    ? buildDriftTimeline(snapshots)
    : null;
  
  // Get most recent drift
  const latestDrift: TasteDrift | null = timeline?.drifts?.[timeline.drifts.length - 1] || null;
  
  // Get current era
  const currentEra = timeline?.eras?.[timeline.eras.length - 1] || null;
  
  return {
    snapshots: snapshots || [],
    timeline,
    latestDrift,
    currentEra,
    overallTrends: timeline?.overallTrends || [],
    isLoading,
    error,
    hasHistory: (snapshots?.length || 0) >= 2
  };
}

export default {
  useGenomeSnapshots,
  useSaveGenomeSnapshot,
  useTasteDrift
};
