import { useMemo } from "react";
import { TasteAnalyzer } from "@/lib/taste-analyzer";
import { extractEnhancedGenome, type TasteGenome } from "@/lib/taste-genome";
import { detectAllContradictions } from "@/lib/derived-traits";
import {
  traitProfileToLegacyPersonality,
  traitScoresToTagAffinity,
  traitScoresToGenreAffinity,
  calculateChaosFromTraits,
  getTopTraitsForDisplay,
  type LegacyPersonalityTraits,
  type LegacyTagAffinity,
  type LegacyGenreAffinity,
} from "@/lib/trait-to-legacy-adapter";
import type { MediaListEntry } from "@/types/anilist";

export interface TraitBasedStats {
  personalityTraits: LegacyPersonalityTraits;
  tagAffinity: LegacyTagAffinity[];
  genreAffinity: LegacyGenreAffinity[];
  topTraits: ReturnType<typeof getTopTraitsForDisplay>;
  chaos: ReturnType<typeof calculateChaosFromTraits>;
  contradictions: ReturnType<typeof detectAllContradictions>;
}

/**
 * Hook that provides the enhanced genome with trait profile integration
 * 
 * IMPORTANT: Pass entries from parent component to ensure data consistency
 * 
 * Returns:
 * - genome: Full TasteGenome with trait data, derived indices, and taste types
 * - traitStats: Legacy-compatible stats computed from new trait system
 */
export function useEnhancedGenome(
  entries: MediaListEntry[],
  options?: {
    includeStressDiet?: boolean;
    recentDays?: number;
  }
) {

  // Create stable dependency key for entries to ensure recomputation
  const entryKey = useMemo(() => {
    return entries.map(e => `${e.media?.id}:${e.score}:${e.status}:${e.progress}`).join('|');
  }, [entries]);

  const result = useMemo<{ genome: TasteGenome | null; traitStats: TraitBasedStats | null }>(() => {
    if (entries.length === 0) return { genome: null, traitStats: null };
    
    // Only include relevant entries
    const validStatuses = ['COMPLETED', 'CURRENT', 'REPEATING', 'DROPPED'];
    const filteredEntries = entries.filter(e => validStatuses.includes(e.status || ''));
    
    if (filteredEntries.length === 0) return { genome: null, traitStats: null };
    
    // Get taste profile first (still needed for behavioral metrics)
    const tasteProfile = TasteAnalyzer.analyzeTaste(filteredEntries, 'ANIME');
    
    // Extract enhanced genome with trait data - CATCH CRASHES
    let genome: TasteGenome | null = null;
    try {
      genome = extractEnhancedGenome(tasteProfile, filteredEntries, {
        includeStressDiet: options?.includeStressDiet ?? true,
        recentDays: options?.recentDays ?? 30,
      });
    } catch (err) {
      console.error('[EnhancedGenome] Build failed:', err);
      return { genome: null, traitStats: null };
    }

    // If we have a trait profile, compute legacy-compatible stats from it
    // Don't hard-gate on derivedIndices - make it optional to prevent cascade failures
    if (genome?.traitProfile) {
      const traitProfile = genome.traitProfile;
      const derivedIndices = genome.derivedIndices ?? [];

      try {
        const traitStats: TraitBasedStats = {
          personalityTraits: traitProfileToLegacyPersonality(
            traitProfile,
            derivedIndices,
            {
              completionRate: tasteProfile.behavioralMetrics.completionRate,
              mainstreamIndex: tasteProfile.behavioralMetrics.mainstreamIndex,
              diversityIndex: tasteProfile.behavioralMetrics.diversityIndex,
            }
          ),
          tagAffinity: traitScoresToTagAffinity(traitProfile, 20),
          genreAffinity: traitScoresToGenreAffinity(traitProfile, 15),
          topTraits: getTopTraitsForDisplay(traitProfile, 10),
          chaos: calculateChaosFromTraits(traitProfile, derivedIndices),
          contradictions: detectAllContradictions(traitProfile, derivedIndices),
        };

        return { genome, traitStats };
      } catch (err) {
        const error = err as Error;
        console.error('[TraitStats] Build failed:', error.message);
        return { genome, traitStats: null };
      }
    }

    return { genome, traitStats: null };
  }, [entries, entryKey, options?.includeStressDiet, options?.recentDays]);

  return { genome: result.genome, traitStats: result.traitStats };
}

/**
 * Hook that provides just the trait profile without the full genome
 * NOTE: This hook is deprecated - pass entries directly to useEnhancedGenome instead
 */
export function useTraitProfile(entries: MediaListEntry[]) {
  const { genome } = useEnhancedGenome(entries);
  
  return {
    traitProfile: genome?.traitProfile ?? null,
  };
}
