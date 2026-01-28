/**
 * EXPLAINABILITY HOOK
 * 
 * React hook for generating and caching trait explanations
 */

import { useMemo } from 'react';
import type { TraitScore, TraitProfile } from '@/lib/trait-scoring-engine';
import { 
  generateTraitExplanation, 
  generateProfileExplanation,
  type TraitExplanation,
  type ProfileExplanation 
} from '@/lib/explainability-engine';

/**
 * Generate explanation for a single trait
 */
export function useTraitExplanation(
  trait: TraitScore | null | undefined,
  totalMediaCount: number
): TraitExplanation | null {
  return useMemo(() => {
    if (!trait) return null;
    return generateTraitExplanation(trait, totalMediaCount);
  }, [trait, totalMediaCount]);
}

/**
 * Generate explanations for multiple traits
 */
export function useTraitExplanations(
  traits: TraitScore[],
  totalMediaCount: number
): TraitExplanation[] {
  return useMemo(() => {
    return traits.map(trait => generateTraitExplanation(trait, totalMediaCount));
  }, [traits, totalMediaCount]);
}

/**
 * Generate full profile explanation
 */
export function useProfileExplanation(
  profile: TraitProfile | null | undefined,
  options: { maxTraits?: number } = {}
): ProfileExplanation | null {
  return useMemo(() => {
    if (!profile) return null;
    return generateProfileExplanation(profile, options);
  }, [profile, options]);
}

/**
 * Get confidence level color for UI
 */
export function useConfidenceColor(level: 'low' | 'medium' | 'high' | 'very_high'): {
  text: string;
  bg: string;
  border: string;
} {
  const colors = {
    very_high: { text: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' },
    high: { text: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
    medium: { text: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
    low: { text: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
  };
  return colors[level];
}

/**
 * Get data quality level color for UI
 */
export function useDataQualityColor(level: 'poor' | 'fair' | 'good' | 'excellent'): {
  text: string;
  bg: string;
  border: string;
} {
  const colors = {
    excellent: { text: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' },
    good: { text: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
    fair: { text: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
    poor: { text: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
  };
  return colors[level];
}
