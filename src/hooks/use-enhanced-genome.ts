import { useMemo } from "react";
import { useAniListData } from "./use-anilist-data";
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
 * Returns:
 * - genome: Full TasteGenome with trait data, derived indices, and taste types
 * - traitStats: Legacy-compatible stats computed from new trait system
 * - loading: Whether data is still loading
 */
export function useEnhancedGenome(options?: {
  includeStressDiet?: boolean;
  recentDays?: number;
}) {
  const { entries, loading } = useAniListData();

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
    
    // Extract enhanced genome with trait data
    const genome = extractEnhancedGenome(tasteProfile, filteredEntries, {
      includeStressDiet: options?.includeStressDiet ?? true,
      recentDays: options?.recentDays ?? 30,
    });

    // DEBUG: Comprehensive trait pipeline status
    console.log('[useEnhancedGenome]', {
      entries: entries?.length,
      filteredEntries: filteredEntries?.length,
      hasGenome: !!genome,
      hasTraitProfile: !!genome?.traitProfile,
      hasDerived: !!genome?.derivedIndices,
      topIdentity: genome?.traitProfile?.channels?.identity?.[0],
      channels: genome?.traitProfile ? {
        identity: genome.traitProfile.channels.identity.length,
        vibe: genome.traitProfile.channels.vibe.length,
        structure: genome.traitProfile.channels.structure.length,
        intensity: genome.traitProfile.channels.intensity.length,
      } : null,
      version: genome?.version,
    });

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

        console.log('[traitStats build]', { ok: !!traitStats });
        return { genome, traitStats };
      } catch (e) {
        console.error("traitStats build failed:", e);
        console.warn("TraitStats null -> FALLING BACK TO LEGACY");
        return { genome, traitStats: null };
      }
    }

    console.warn("TraitStats null -> FALLING BACK TO LEGACY (no traitProfile)");
    return { genome, traitStats: null };
  }, [entries, entryKey, options?.includeStressDiet, options?.recentDays]);

  return { genome: result.genome, traitStats: result.traitStats, loading };
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
