import { useMemo } from "react";
import { useAniListData } from "./use-anilist-data";
import { TasteAnalyzer } from "@/lib/taste-analyzer";
import { extractEnhancedGenome, type TasteGenome } from "@/lib/taste-genome";

/**
 * Hook that provides the enhanced genome with trait profile integration
 * 
 * Returns:
 * - genome: Full TasteGenome with trait data, derived indices, and taste types
 * - loading: Whether data is still loading
 * - error: Any error that occurred
 */
export function useEnhancedGenome(options?: {
  includeStressDiet?: boolean;
  recentDays?: number;
}) {
  const { entries, loading } = useAniListData();

  const genome = useMemo<TasteGenome | null>(() => {
    if (entries.length === 0) return null;
    
    // Only include relevant entries
    const validStatuses = ['COMPLETED', 'CURRENT', 'REPEATING', 'DROPPED'];
    const filteredEntries = entries.filter(e => validStatuses.includes(e.status || ''));
    
    if (filteredEntries.length === 0) return null;
    
    // Get taste profile first
    const tasteProfile = TasteAnalyzer.analyzeTaste(filteredEntries, 'ANIME');
    
    // Extract enhanced genome with trait data
    return extractEnhancedGenome(tasteProfile, filteredEntries, {
      includeStressDiet: options?.includeStressDiet ?? true,
      recentDays: options?.recentDays ?? 30,
    });
  }, [entries, options?.includeStressDiet, options?.recentDays]);

  return { genome, loading };
}

/**
 * Hook that provides just the trait profile without the full genome
 */
export function useTraitProfile() {
  const { genome, loading } = useEnhancedGenome();
  
  return {
    traitProfile: genome?.traitProfile ?? null,
    derivedIndices: genome?.derivedIndices ?? [],
    tasteTypes: genome?.tasteTypes ?? [],
    topTraits: genome?.topTraitsByChannel ?? null,
    loading,
  };
}
