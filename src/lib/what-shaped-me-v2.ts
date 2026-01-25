/**
 * "WHAT SHAPED ME" v2 - Counterfactual Impact Scoring
 * 
 * Solves the core problem: "Profile Explainers" vs "Emotional Impact"
 * 
 * FEATURES:
 * ✅ Ablation-based counterfactual scoring
 * ✅ Tag density normalization  
 * ✅ Preference lift (love vs exposure)
 * ✅ Core trait alignment
 * ✅ Rewatch boost (additive, capped)
 * ✅ Emotional imprint detection
 * ✅ 3 shaping modes: Profile | Preference | Identity
 */

import { 
  computeTraitProfile, 
  type TraitProfile, 
  type MediaTagInput
} from './trait-scoring-engine';
import { MediaListEntry } from '@/types/anilist';

// ============================================
// IMPACT TYPES
// ============================================

export interface ShapingImpact {
  mediaId?: number;
  title?: string;
  score: number;              // Final shaping score
  components: {
    ablationImpact: number;   // Counterfactual impact (0-1)
    preferenceLift: number;   // Love vs baseline (0-2)
    coreAlignment: number;    // Matches identity traits (0-1)
    rewatchBoost: number;     // Rewatch factor (1-1.35)
    emotionalImprint: number; // Emotional identity (0-1)
  };
  explanation: string;
  shapingMode: 'profile' | 'preference' | 'identity';
}

export interface ShapingCandidates {
  candidates: Array<{
    mediaId: number;
    title: string;
    entry: MediaListEntry;
    tags: MediaTagInput[];
    reasons: string[];
  }>;
}

// ============================================
// CONVERSION HELPERS
// ============================================

/**
 * Convert MediaListEntry to trait inputs (matching taste-genome.ts logic)
 */
function mediaEntriesToTraitInputs(entries: MediaListEntry[]): Array<{
  tags: MediaTagInput[];
  engagementWeight: number;
  score?: number;
  id?: number;
  title?: string;
}> {
  const VALID_STATUSES = new Set(['COMPLETED', 'CURRENT', 'REPEATING']);
  const MANGA_TAG_RANK_FILTER = 60;

  return entries
    .filter(e => e.media && VALID_STATUSES.has(e.status))
    .map(entry => {
      const media = entry.media!;
      const score = entry.score > 0 ? entry.score : undefined;
      const repeats = entry.repeat || 0;

      const totalUnits = media.type === 'MANGA'
        ? (media.chapters || 1)
        : (media.episodes || 1);
      const progressUnits = entry.status === 'COMPLETED'
        ? totalUnits
        : Math.min(totalUnits, entry.progress || 0);
      const progressRatio = totalUnits > 0 ? progressUnits / totalUnits : 0;
      const progressWeight = entry.status === 'COMPLETED'
        ? 1
        : Math.max(0.25, Math.sqrt(progressRatio || 0));

      // Engagement weight based on score, rewatches, and progress
      const normalizedScore = score !== undefined ? (score - 5) / 5 : 0; // -1 to 1
      const scoreWeight = Math.max(0.2, 0.5 + normalizedScore * 0.5); // 0.2 - 1.0
      const repeatBonus = Math.min(0.5, repeats * 0.15);
      const engagementWeight = Math.max(0.2, (scoreWeight + repeatBonus) * progressWeight);

      // Convert media tags to trait input format
      const tags: MediaTagInput[] = (media.tags || [])
        .filter(t => !t.isGeneralSpoiler && !t.isMediaSpoiler)
        .filter(t => media.type !== 'MANGA' || (t.rank ?? 50) >= MANGA_TAG_RANK_FILTER)
        .map(t => ({
          name: t.name,
          rank: t.rank || 50,
        }));

      return {
        tags,
        engagementWeight,
        score,
        id: media.id,
        title: media.title.userPreferred || media.title.romaji || media.title.english || 'Unknown'
      };
    })
    .filter(input => input.tags.length > 0);
}

// ============================================
// CANDIDATE SELECTION
// ============================================

/**
 * Select candidate titles for ablation testing
 * Performance optimization: only test likely shapers
 */
function selectShapingCandidates(entries: MediaListEntry[], limit: number = 30): ShapingCandidates {
  const candidates: ShapingCandidates['candidates'] = [];
  
  // Convert to trait inputs first
  const traitInputs = mediaEntriesToTraitInputs(entries);
  
  // Sort by multiple signals
  const sorted = traitInputs
    .sort((a, b) => {
      let scoreA = 0, scoreB = 0;
      
      // High rating bonus
      if (a.score) scoreA += a.score / 10;
      if (b.score) scoreB += b.score / 10;
      
      // Tag density bonus (but capped)
      scoreA += Math.min(a.tags.length / 20, 0.3);
      scoreB += Math.min(b.tags.length / 20, 0.3);
      
      // Engagement weight bonus
      scoreA += a.engagementWeight * 0.5;
      scoreB += b.engagementWeight * 0.5;
      
      return scoreB - scoreA;
    });
  
  for (const input of sorted.slice(0, limit)) {
    const reasons: string[] = [];
    
    if (input.score && input.score >= 9) reasons.push(`High score ${input.score}`);
    if (input.tags.length >= 15) reasons.push('High tag density');
    if (input.engagementWeight >= 1.2) reasons.push('High engagement');
    
    candidates.push({
      mediaId: input.id!,
      title: input.title || 'Unknown',
      entry: entries.find(e => e.media?.id === input.id)!, // Find original entry
      tags: input.tags,
      reasons
    });
  }
  
  return { candidates };
}

// ============================================
// COUNTERFACTUAL IMPACT (ABLATION)
// ============================================

/**
 * Compute profile vector for distance calculation
 */
function computeProfileVector(profile: TraitProfile): number[] {
  const vector: number[] = [];
  
  // Normalize all traits into a single vector
  const allTraits = [
    ...profile.channels.identity,
    ...profile.channels.vibe, 
    ...profile.channels.structure,
    ...profile.channels.intensity
  ];
  
  // Sort by traitId for consistent ordering
  allTraits.sort((a, b) => a.traitId.localeCompare(b.traitId));
  
  for (const trait of allTraits) {
    vector.push(trait.normalizedScore / 100); // Normalize to 0-1
  }
  
  return vector;
}

/**
 * Compute cosine distance between two vectors
 */
function cosineDistance(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 1;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) return 1;
  
  return 1 - (dotProduct / (normA * normB));
}

/**
 * Compute ablation impact: "How much does removing this show change the profile?"
 */
function computeAblationImpact(
  fullProfile: TraitProfile,
  candidate: ShapingCandidates['candidates'][0],
  allEntries: MediaListEntry[]
): number {
  // Create entries without this candidate
  const entriesWithoutCandidate = allEntries.filter(
    e => e.media?.id !== candidate.mediaId
  );
  
  // Compute profile without this candidate
  const traitInputsWithoutCandidate = mediaEntriesToTraitInputs(entriesWithoutCandidate);
  const profileWithoutCandidate = computeTraitProfile(traitInputsWithoutCandidate);
  
  // Compute vectors
  const fullVector = computeProfileVector(fullProfile);
  const withoutVector = computeProfileVector(profileWithoutCandidate);
  
  // Calculate distance (impact)
  const distance = cosineDistance(fullVector, withoutVector);
  
  return distance; // 0 = no impact, 1 = massive impact
}

// ============================================
// PREFERENCE LIFT
// ============================================

/**
 * How much user rates this above their baseline
 */
function computePreferenceLift(entry: MediaListEntry, userAvgScore: number, userStdDev: number): number {
  if (!entry.score) return 0;
  
  const lift = (entry.score - userAvgScore) / Math.max(userStdDev, 1);
  return Math.max(0, Math.min(lift, 2)); // Clamp 0-2
}

// ============================================
// CORE TRAIT ALIGNMENT  
// ============================================

/**
 * Does this show contribute to user's core identity traits?
 */
function computeCoreAlignment(
  profile: TraitProfile,
  candidateTags: MediaTagInput[]
): number {
  // Get user's top identity traits (what makes them unique)
  const topIdentityTraits = profile.channels.identity
    .sort((a, b) => b.normalizedScore - a.normalizedScore)
    .slice(0, 10);
  
  if (topIdentityTraits.length === 0) return 0.5;
  
  // Check if candidate tags align with these traits
  const traitTags = new Set<string>();
  for (const trait of topIdentityTraits) {
    trait.contributingTags.forEach(tag => traitTags.add(tag.toLowerCase()));
  }
  
  const candidateTagNames = candidateTags.map(t => t.name.toLowerCase());
  const matches = candidateTagNames.filter(tag => traitTags.has(tag)).length;
  
  return matches / Math.max(candidateTagNames.length, 1);
}

// ============================================
// EMOTIONAL IMPRINT DETECTION
// ============================================

/**
 * Traits that indicate emotional identity shaping
 */
const EMOTIONAL_IMPRINT_TRAITS = [
  'melancholy', 'bittersweet', 'catharsis', 'emotional', 'realism',
  'character_driven', 'coming_of_age', 'adult_relationships', 
  'heartbreak', 'interpersonal_drama', 'life', 'drama', 'romance'
];

function computeEmotionalImprint(candidateTags: MediaTagInput[]): number {
  const tagNames = candidateTags.map(t => t.name.toLowerCase());
  const emotionalTags = tagNames.filter(tag => 
    EMOTIONAL_IMPRINT_TRAITS.some(emotional => tag.includes(emotional))
  );
  
  return emotionalTags.length / Math.max(candidateTags.length, 1);
}

// ============================================
// REWATCH BOOST
// ============================================

/**
 * Rewatch factor: additive and capped
 */
function computeRewatchBoost(repeat: number = 0): number {
  if (repeat <= 1) return 1;
  
  // Additive boost, capped at 35%
  return 1 + Math.min(0.35, 0.08 * (repeat - 1));
}

// ============================================
// MAIN SHAPING CALCULATION
// ============================================

export function calculateWhatShapedMeV2(
  entries: MediaListEntry[],
  mode: 'profile' | 'preference' | 'identity' = 'profile',
  limit: number = 10
): ShapingImpact[] {
  // Convert to trait inputs
  const traitInputs = mediaEntriesToTraitInputs(entries);
  
  if (traitInputs.length === 0) return [];
  
  // Compute full profile
  const fullProfile = computeTraitProfile(traitInputs);
  
  // Calculate user stats for preference lift
  const scores = traitInputs
    .map(e => e.score)
    .filter((s): s is number => s !== undefined);
  const userAvgScore = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
  const userStdDev = Math.sqrt(
    scores.reduce((sum: number, score: number) => sum + Math.pow(score - userAvgScore, 2), 0) / scores.length
  );
  
  // Select candidates for ablation testing
  const { candidates } = selectShapingCandidates(entries, Math.min(limit * 3, 40));
  
  const impacts: ShapingImpact[] = [];
  
  for (const candidate of candidates) {
    // Ablation impact (counterfactual)
    const ablationImpact = computeAblationImpact(fullProfile, candidate, entries);
    
    // Preference lift
    const preferenceLift = computePreferenceLift(candidate.entry, userAvgScore, userStdDev);
    
    // Core alignment
    const coreAlignment = computeCoreAlignment(fullProfile, candidate.tags);
    
    // Rewatch boost
    const rewatchBoost = computeRewatchBoost(candidate.entry.repeat);
    
    // Emotional imprint
    const emotionalImprint = computeEmotionalImprint(candidate.tags);
    
    // Mode-specific weighting
    let score = 0;
    let explanation = '';
    
    switch (mode) {
      case 'profile':
        // Profile explainer mode
        score = (
          0.45 * ablationImpact +
          0.25 * preferenceLift +
          0.20 * coreAlignment +
          0.10 * rewatchBoost
        );
        explanation = `Profile impact: ${Math.round(ablationImpact * 100)}%`;
        break;
        
      case 'preference':
        // Preference imprinter mode  
        score = (
          0.30 * ablationImpact +
          0.45 * preferenceLift +
          0.15 * rewatchBoost +
          0.10 * coreAlignment
        );
        explanation = `Love factor: ${Math.round(preferenceLift * 100)}%`;
        break;
        
      case 'identity':
        // Identity anchor mode
        score = (
          0.35 * ablationImpact +
          0.15 * preferenceLift +
          0.25 * coreAlignment +
          0.25 * emotionalImprint
        );
        explanation = `Identity alignment: ${Math.round(coreAlignment * 100)}%`;
        break;
    }
    
    // Apply anchor override logic (human-respecting rules)
    if (candidate.entry.repeat! >= 2 || 
        preferenceLift >= 1.5) {
      score *= 1.25;
      explanation += ' (anchor boost)';
    }
    
    impacts.push({
      mediaId: candidate.mediaId,
      title: candidate.title,
      score,
      components: {
        ablationImpact,
        preferenceLift,
        coreAlignment,
        rewatchBoost,
        emotionalImprint
      },
      explanation,
      shapingMode: mode
    });
  }
  
  // Sort by score and return top results
  return impacts
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function getShapingModeDescription(mode: 'profile' | 'preference' | 'identity'): string {
  switch (mode) {
    case 'profile':
      return 'Shows that best explain your overall taste DNA';
    case 'preference':
      return 'Shows you rate highest and return to most often';
    case 'identity':
      return 'Shows that define your emotional identity and self-concept';
  }
}

export function formatShapingExplanation(impact: ShapingImpact): string {
  const parts: string[] = [impact.explanation];
  
  if (impact.components.preferenceLift > 0.5) {
    parts.push(`High preference lift`);
  }
  
  if (impact.components.rewatchBoost > 1.1) {
    parts.push(`Rewatch bonus`);
  }
  
  if (impact.components.emotionalImprint > 0.3) {
    parts.push(`Emotional imprint`);
  }
  
  return parts.join(' • ');
}
