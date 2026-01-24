/**
 * TASTE GENOME v3
 * 
 * A user's taste compressed into a fixed-length vector fingerprint.
 * Now enhanced with the Trait Universe system for deeper taste analysis.
 * 
 * FEATURES:
 * ✅ Contribution uses baseline-delta (not self-normalized z-score)
 * ✅ Centered vectors for similarity calculation
 * ✅ Predictor averages within groups (not sums)
 * ✅ Entropy only on genre/tag distributions
 * ✅ Uniqueness = distance from neutral baseline
 * ✅ Feature hashing for tags (64 buckets for long tail)
 * ✅ NEW: Trait-based scoring with 4 channels (Identity, Vibe, Structure, Intensity)
 * ✅ NEW: Derived indices (Darkness, Cozy, Mindfuck, etc.)
 * ✅ NEW: "You have a type" auto-detection
 * ✅ NEW: Stress diet and comfort loop analysis
 */

import { TasteProfile, MediaListEntry } from '@/types/anilist';
import {
  TraitScorer,
  computeTraitProfile,
  type TraitProfile,
  type TraitScore,
  type ChannelScores,
  type MediaTagInput,
} from './trait-scoring-engine';
import {
  computeDerivedIndices,
  detectTasteTypes,
  computeStressDiet,
  detectComfortLoop,
  type DerivedIndex,
  type TasteType,
  type StressDiet,
  type ComfortLoop,
} from './derived-traits';

// ============================================
// GENOME STRUCTURE
// ============================================

export interface TasteGenome {
  vector: number[];
  centeredVector: number[];  // For similarity calculations
  dimensions: GenomeDimension[];
  tagBuckets: number[];      // 64 hashed tag buckets for long tail
  
  version: string;
  generatedAt: Date;
  
  // Summary stats (FIXED calculations)
  entropy: number;           // Genre + tag distribution entropy only
  uniquenessScore: number;   // Distance from neutral baseline
  dominantTraits: string[];  // Top 3 by baseline-delta
  
  // NEW: Trait Universe integration
  traitProfile?: TraitProfile;           // Full trait scores by channel
  derivedIndices?: DerivedIndex[];       // Computed indices (Darkness, Cozy, etc.)
  tasteTypes?: TasteType[];              // "You have a type" detection
  stressDiet?: StressDiet;               // Recent viewing pattern analysis
  comfortLoop?: ComfortLoop | null;      // Comfort loop detection
  
  // Top traits summary (for quick display)
  topTraitsByChannel?: {
    identity: TraitScore[];
    vibe: TraitScore[];
    structure: TraitScore[];
    intensity: TraitScore[];
  };
}

export interface GenomeDimension {
  name: string;
  category: 'genre' | 'tag' | 'emotional' | 'structural' | 'behavioral';
  value: number;
  baseline: number;          // Neutral baseline for this dimension
  contribution: number;      // abs(value - baseline) - how much this defines you
}

// ============================================
// BASELINES PER DIMENSION TYPE
// ============================================

const BASELINES: Record<string, number> = {
  genre: 0,      // 0 = no affinity (genres are 0-1 where 0 = never watched)
  tag: 0,        // 0 = no affinity
  emotional: 0.5,     // 0.5 = neutral on emotional axes
  structural: 0.5,    // 0.5 = neutral on structural axes
  behavioral: 0.5,    // 0.5 = neutral on behavioral axes
};

// ============================================
// GENOME CONFIGURATION
// ============================================

const GENOME_GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy',
  'Horror', 'Mystery', 'Psychological', 'Romance', 'Sci-Fi',
  'Slice of Life', 'Sports', 'Supernatural', 'Thriller', 'Mecha'
];

// Curated top 20 tags (interpretable) + 64 hash buckets for long tail
const GENOME_TAGS_CURATED = [
  'Dark', 'Gore', 'Cute Girls Doing Cute Things', 'Iyashikei', 'Parody',
  'Coming of Age', 'Tragedy', 'Revenge', 'Time Travel', 'Isekai',
  'Anti-Hero', 'Ensemble Cast', 'Female Protagonist', 'Male Protagonist',
  'School', 'Military', 'Historical', 'Space', 'Urban', 'Survival'
];

const EMOTIONAL_AXES = ['escapism', 'bleakness', 'idealism', 'intensity', 'sentimentality'];
const STRUCTURAL_AXES = ['episodicVsSerial', 'pacingPreference', 'plotVsCharacter', 'complexityPreference'];
const BEHAVIORAL_AXES = ['completionRate', 'nicheIndex', 'diversityIndex', 'experimentalIndex', 'mainstreamIndex'];
const PERSONALITY_AXES = ['chaosLevel', 'emotionalDamageIndex', 'completionist', 'cultHunter', 'avantGarde'];

const TAG_HASH_BUCKETS = 64;

// Top-K limits for prediction (prevents noise from weak signals)
const TOP_K_GENRES = 2;  // Use best 2 genre matches (Fix 2)
const TOP_K_TAGS = 6;    // Use best 6 ranked tags (Fix 2)

// Support genre merging (Fix 7: Slice of Life penalty reduction)
const SUPPORT_GENRES: Record<string, string[]> = {
  'Slice of Life': ['Romance', 'Drama', 'Comedy'],  // If user likes Romance/Drama, reduce SoL penalty
  'Sports': ['Drama', 'Action'],
  'Mecha': ['Sci-Fi', 'Action'],
};

// Adjacent genre/tag correlations (users who like A often tolerate B)
const GENRE_ADJACENCY: Record<string, string[]> = {
  'Sci-Fi': ['Thriller', 'Mystery', 'Mecha'],
  'Psychological': ['Thriller', 'Mystery', 'Horror'],
  'Mystery': ['Thriller', 'Psychological'],
  'Horror': ['Thriller', 'Psychological'],
  'Fantasy': ['Adventure', 'Action'],
  'Romance': ['Drama', 'Slice of Life', 'Comedy'],
  'Drama': ['Romance', 'Slice of Life'],
  'Action': ['Adventure', 'Fantasy', 'Sci-Fi'],
  'Adventure': ['Action', 'Fantasy'],
  'Comedy': ['Slice of Life', 'Romance'],
  'Slice of Life': ['Comedy', 'Drama', 'Romance'],
};

const TAG_ADJACENCY: Record<string, string[]> = {
  'Time Travel': ['Sci-Fi', 'Psychological', 'Mind Games'],
  'Psychological': ['Mind Games', 'Thriller', 'Mystery'],
  'Mind Games': ['Psychological', 'Strategy'],
  'Dark': ['Gore', 'Tragedy', 'Revenge'],
  'Tragedy': ['Dark', 'Drama'],
  'Isekai': ['Fantasy', 'Adventure', 'Reincarnation'],
};

// ============================================
// TAG KEY NORMALIZATION (fixes string mismatch)
// ============================================

function normalizeTagKey(tagName: string): string {
  return tagName.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// ============================================
// FEATURE HASHING
// ============================================

function hashTag(tagName: string): number {
  const normalized = normalizeTagKey(tagName);
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % TAG_HASH_BUCKETS;
}

/**
 * Safely convert affinity to 0-1 range (supports both 0-1 and 0-100 formats)
 * This prevents normalization bugs when affinity values change format.
 */
function toUnit01(x: number): number {
  if (!Number.isFinite(x)) return 0.5;
  return x > 1 ? x / 100 : x; // If > 1, assume 0-100 scale; otherwise already 0-1
}

// ============================================
// GENOME EXTRACTION (FIXED)
// ============================================

export function extractGenome(profile: TasteProfile): TasteGenome {
  const dimensions: GenomeDimension[] = [];
  const vector: number[] = [];
  const tagBuckets = new Array(TAG_HASH_BUCKETS).fill(0);
  
  // 1. Genre affinity vector (15 dimensions)
  const genreMap = new Map(profile.genreAffinity.map(g => [g.genre, g.affinity]));
  for (const genre of GENOME_GENRES) {
    const affinity = genreMap.get(genre) || 0;
    const normalized = toUnit01(affinity);
    const baseline = BASELINES.genre;
    dimensions.push({
      name: genre,
      category: 'genre',
      value: normalized,
      baseline,
      contribution: Math.abs(normalized - baseline)
    });
    vector.push(normalized);
  }
  
  // 2. Curated tag affinity vector (20 dimensions)
  const tagMap = new Map(profile.tagAffinity.map(t => [t.tag, t.affinity]));
  for (const tag of GENOME_TAGS_CURATED) {
    const affinity = tagMap.get(tag) || 0;
    const normalized = toUnit01(affinity);
    const baseline = BASELINES.tag;
    dimensions.push({
      name: tag,
      category: 'tag',
      value: normalized,
      baseline,
      contribution: Math.abs(normalized - baseline)
    });
    vector.push(normalized);
  }
  
  // 3. Hash ALL user tags into 64 buckets (for long tail coverage)
  for (const tagData of profile.tagAffinity) {
    const bucket = hashTag(tagData.tag);
    const weight = toUnit01(tagData.affinity);
    tagBuckets[bucket] = Math.max(tagBuckets[bucket], weight); // Max pooling
  }
  
  // 4. Emotional profile vector (5 dimensions)
  for (const axis of EMOTIONAL_AXES) {
    const value = profile.emotionalProfile?.[axis as keyof typeof profile.emotionalProfile] || 0.5;
    const baseline = BASELINES.emotional;
    dimensions.push({
      name: axis,
      category: 'emotional',
      value,
      baseline,
      contribution: Math.abs(value - baseline)
    });
    vector.push(value);
  }
  
  // 5. Structural preferences vector (4 dimensions)
  for (const axis of STRUCTURAL_AXES) {
    const value = profile.structuralPreferences?.[axis as keyof typeof profile.structuralPreferences] || 0.5;
    const baseline = BASELINES.structural;
    dimensions.push({
      name: axis,
      category: 'structural',
      value,
      baseline,
      contribution: Math.abs(value - baseline)
    });
    vector.push(value);
  }
  
  // 6. Behavioral metrics vector (5 dimensions)
  const behavioralMap: Record<string, number> = {
    completionRate: profile.behavioralMetrics?.completionRate || 0.5,
    nicheIndex: profile.behavioralMetrics?.nicheIndex || 0.5,
    diversityIndex: profile.behavioralMetrics?.diversityIndex || 0.5,
    experimentalIndex: profile.behavioralMetrics?.experimentalIndex || 0.5,
    mainstreamIndex: profile.behavioralMetrics?.mainstreamIndex || 0.5,
  };
  for (const axis of BEHAVIORAL_AXES) {
    const value = behavioralMap[axis] || 0.5;
    const baseline = BASELINES.behavioral;
    dimensions.push({
      name: axis,
      category: 'behavioral',
      value,
      baseline,
      contribution: Math.abs(value - baseline)
    });
    vector.push(value);
  }
  
  // 7. Personality traits vector (5 dimensions)
  const personalityMap: Record<string, number> = {
    chaosLevel: (profile.personalityTraits?.chaosLevel || 5) / 10,
    emotionalDamageIndex: (profile.personalityTraits?.emotionalDamageIndex || 5) / 10,
    completionist: (profile.personalityTraits?.completionist || 5) / 10,
    cultHunter: (profile.personalityTraits?.cultHunter || 5) / 10,
    avantGarde: (profile.personalityTraits?.avantGarde || 5) / 10,
  };
  for (const axis of PERSONALITY_AXES) {
    const value = personalityMap[axis] || 0.5;
    const baseline = BASELINES.behavioral;
    dimensions.push({
      name: axis,
      category: 'behavioral',
      value,
      baseline,
      contribution: Math.abs(value - baseline)
    });
    vector.push(value);
  }
  
  // Create centered vector for similarity calculations
  const centeredVector = dimensions.map(d => d.value - d.baseline);
  
  // Sort by contribution to find dominant traits (using baseline-delta)
  const sortedDimensions = [...dimensions].sort((a, b) => b.contribution - a.contribution);
  const dominantTraits = sortedDimensions.slice(0, 3).map(d => d.name);
  
  // Calculate genome entropy (FIXED: only genre + tag distributions)
  const genreValues = dimensions.filter(d => d.category === 'genre').map(d => d.value);
  const tagValues = dimensions.filter(d => d.category === 'tag').map(d => d.value);
  const genreEntropy = calculateDistributionEntropy(genreValues);
  const tagEntropy = calculateDistributionEntropy(tagValues);
  const entropy = (genreEntropy + tagEntropy) / 2;
  
  // Calculate uniqueness (FIXED: distance from neutral baseline)
  const uniquenessScore = calculateUniqueness(centeredVector);
  
  return {
    vector,
    centeredVector,
    dimensions,
    tagBuckets,
    version: '3.0',
    generatedAt: new Date(),
    entropy,
    uniquenessScore,
    dominantTraits
  };
}

// ============================================
// TRAIT PROFILE EXTRACTION (NEW in v3)
// ============================================

/**
 * Convert media entries to trait profile inputs
 */
function mediaEntriesToTraitInputs(entries: MediaListEntry[]): Array<{
  tags: MediaTagInput[];
  engagementWeight: number;
  score?: number;
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
          rank: t.rank,
        }));

      // Also add genres as pseudo-tags with high rank
      for (const genre of media.genres || []) {
        tags.push({ name: genre, rank: 85 });
      }

      return { tags, engagementWeight, score };
    });
}

/**
 * Extract trait profile from media list entries
 * This is the NEW trait-based analysis system
 */
export function extractTraitProfile(entries: MediaListEntry[]): TraitProfile {
  const traitInputs = mediaEntriesToTraitInputs(entries);
  return computeTraitProfile(traitInputs);
}

/**
 * Get top traits per channel for display
 */
function getTopTraitsByChannel(profile: TraitProfile, topN: number = 5): TasteGenome['topTraitsByChannel'] {
  return {
    identity: profile.channels.identity.slice(0, topN),
    vibe: profile.channels.vibe.slice(0, topN),
    structure: profile.channels.structure.slice(0, topN),
    intensity: profile.channels.intensity.slice(0, topN),
  };
}

/**
 * Extract ENHANCED genome with trait profile integration
 * This combines the original genome vector with the new trait system
 */
export function extractEnhancedGenome(
  profile: TasteProfile,
  entries: MediaListEntry[],
  options?: {
    includeStressDiet?: boolean;
    recentDays?: number;
  }
): TasteGenome {
  // Get base genome
  const baseGenome = extractGenome(profile);
  
  // Compute trait profile from entries
  const traitProfile = extractTraitProfile(entries);
  
  // Compute derived indices
  const derivedIndices = computeDerivedIndices(traitProfile);
  
  // Detect taste types ("You have a type") - needs both profile and indices
  const tasteTypes = detectTasteTypes(traitProfile, derivedIndices);
  
  // Get top traits by channel for quick display
  const topTraitsByChannel = getTopTraitsByChannel(traitProfile);
  
  // Compute stress diet and comfort loop
  const stressDiet = computeStressDiet(traitProfile);
  const comfortLoop = detectComfortLoop(traitProfile);
  
  return {
    ...baseGenome,
    version: '3.0',
    traitProfile,
    derivedIndices,
    tasteTypes,
    stressDiet,
    comfortLoop,
    topTraitsByChannel,
  };
}

// ============================================
// SIMILARITY FUNCTIONS (FIXED: use centered vectors)
// ============================================

/**
 * Calculate cosine similarity between two genomes using CENTERED vectors
 * This measures "taste direction" not "who has more 0.5s"
 */
export function cosineSimilarity(genomeA: TasteGenome, genomeB: TasteGenome): number {
  const vecA = genomeA.centeredVector;
  const vecB = genomeB.centeredVector;
  
  if (vecA.length !== vecB.length) {
    throw new Error('Genome vectors must have same length');
  }
  
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }
  
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  
  // Convert from -1,1 to 0,1 range
  return (dotProduct / (magnitudeA * magnitudeB) + 1) / 2;
}

/**
 * Euclidean distance using centered vectors
 */
export function euclideanDistance(genomeA: TasteGenome, genomeB: TasteGenome): number {
  const vecA = genomeA.centeredVector;
  const vecB = genomeB.centeredVector;
  
  if (vecA.length !== vecB.length) {
    throw new Error('Genome vectors must have same length');
  }
  
  let sumSquares = 0;
  for (let i = 0; i < vecA.length; i++) {
    sumSquares += Math.pow(vecA[i] - vecB[i], 2);
  }
  
  return Math.sqrt(sumSquares);
}

/**
 * Compare dimensions with improved weighting
 */
export function compareDimensions(
  genomeA: TasteGenome, 
  genomeB: TasteGenome
): {
  sharedStrengths: Array<{ dimension: string; category: string; bothHigh: number }>;
  keyDifferences: Array<{ dimension: string; category: string; delta: number; direction: 'higher' | 'lower' }>;
} {
  const sharedStrengths: Array<{ dimension: string; category: string; bothHigh: number }> = [];
  const keyDifferences: Array<{ dimension: string; category: string; delta: number; direction: 'higher' | 'lower' }> = [];
  
  for (let i = 0; i < genomeA.dimensions.length; i++) {
    const dimA = genomeA.dimensions[i];
    const dimB = genomeB.dimensions[i];
    const delta = dimA.value - dimB.value;
    
    // Shared strengths: both above baseline significantly
    if (dimA.contribution > 0.3 && dimB.contribution > 0.3) {
      const sameSide = (dimA.value - dimA.baseline) * (dimB.value - dimB.baseline) > 0;
      if (sameSide) {
        sharedStrengths.push({
          dimension: dimA.name,
          category: dimA.category,
          bothHigh: (dimA.contribution + dimB.contribution) / 2
        });
      }
    }
    
    // Key differences: significant delta, weighted by how much it matters
    const weightedDelta = Math.abs(delta) * (dimA.contribution + dimB.contribution + 0.1);
    if (Math.abs(delta) > 0.15) {
      keyDifferences.push({
        dimension: dimA.name,
        category: dimA.category,
        delta: weightedDelta,
        direction: delta > 0 ? 'higher' : 'lower'
      });
    }
  }
  
  return {
    sharedStrengths: sharedStrengths.sort((a, b) => b.bothHigh - a.bothHigh).slice(0, 5),
    keyDifferences: keyDifferences.sort((a, b) => b.delta - a.delta).slice(0, 5)
  };
}

// ============================================
// ENJOYMENT PREDICTOR (FIXED: average within groups)
// ============================================

export interface MediaFeatures {
  genres: string[];
  tags: Array<{ name: string; rank: number }>;
  popularity: number;
  meanScore: number;
  format: string;
  seasonYear?: number;
  studios?: string[];
}

export interface EnjoymentPrediction {
  predictedScore: number;
  expectedRange: { low: number; high: number };  // Confidence band
  confidence: number;
  confidenceLabel: string;
  probabilityOfLiking: number;
  matchFactors: Array<{
    factor: string;
    type: 'genre' | 'tag' | 'popularity' | 'community';
    contribution: number;
    direction: 'positive' | 'negative' | 'neutral';
    affinity: number;  // Raw affinity value (0-1)
  }>;
  riskLevel: 'SAFE' | 'MODERATE' | 'EXPERIMENTAL';
  
  // Breakdown for transparency
  componentScores: {
    genreScore: number;
    tagScore: number;
    qualityBoost: number;
    popMatch: number;
  };
}

/**
 * Predict enjoyment using TOP-K matching (best matches, not all)
 * 
 * Key improvements:
 * - Top-K genres/tags (ignores weak matches)
 * - Curved quality boost for acclaimed titles
 * - Adjacent genre/tag support
 * - Confidence-based uncertainty bands
 * - Normalized tag matching
 */
export function predictEnjoyment(
  genome: TasteGenome,
  profile: TasteProfile,
  media: MediaFeatures,
  userStats: { mean: number; std: number }
): EnjoymentPrediction {
  const matchFactors: EnjoymentPrediction['matchFactors'] = [];
  
  // Build lookup maps with NORMALIZED keys
  const genreMap = new Map(genome.dimensions.filter(d => d.category === 'genre').map(d => [normalizeTagKey(d.name), d.value]));
  const tagMap = new Map(genome.dimensions.filter(d => d.category === 'tag').map(d => [normalizeTagKey(d.name), d.value]));
  const profileTagMap = new Map(profile.tagAffinity.map(t => [normalizeTagKey(t.tag), toUnit01(t.affinity)]));
  
  // Also keep original names for display
  const genreDisplayMap = new Map(genome.dimensions.filter(d => d.category === 'genre').map(d => [normalizeTagKey(d.name), d.name]));
  const tagDisplayMap = new Map(genome.dimensions.filter(d => d.category === 'tag').map(d => [normalizeTagKey(d.name), d.name]));
  
  // ============================================
  // 1. Genre score using TOP-K matching
  // ============================================
  const genreAffinities: Array<{ genre: string; affinity: number; hasAdjacencyBoost: boolean; penaltyReduced: boolean }> = [];
  
  for (const genre of media.genres) {
    const key = normalizeTagKey(genre);
    let affinity = genreMap.get(key);
    let hasAdjacencyBoost = false;
    let penaltyReduced = false;
    
    // If no direct match, check adjacency boost
    if (affinity === undefined || affinity < 0.3) {
      const adjacentGenres = GENRE_ADJACENCY[genre] || [];
      for (const adj of adjacentGenres) {
        const adjKey = normalizeTagKey(adj);
        const adjAffinity = genreMap.get(adjKey);
        if (adjAffinity && adjAffinity > 0.6) {
          // Adjacent boost: if user loves Psychological, add small boost to Thriller
          affinity = Math.max(affinity || 0, 0.35 + (adjAffinity - 0.6) * 0.3);
          hasAdjacencyBoost = true;
        }
      }
    }
    
    // Fix 7: Support genre penalty reduction (Slice of Life + Romance/Drama)
    // If user likes a "parent" genre, reduce penalty of the "child" genre
    if (affinity !== undefined && affinity < 0.5) {
      const supportGenres = SUPPORT_GENRES[genre] || [];
      for (const support of supportGenres) {
        const supportKey = normalizeTagKey(support);
        const supportAffinity = genreMap.get(supportKey);
        if (supportAffinity && supportAffinity > 0.6) {
          // Reduce negative penalty by 40% if user likes a related genre
          affinity = 0.5 - (0.5 - affinity) * 0.6;
          penaltyReduced = true;
          break;
        }
      }
    }
    
    if (affinity !== undefined) {
      genreAffinities.push({ genre, affinity, hasAdjacencyBoost, penaltyReduced });
    }
  }
  
  // Sort by affinity and take TOP-K best matches
  genreAffinities.sort((a, b) => b.affinity - a.affinity);
  const topGenres = genreAffinities.slice(0, TOP_K_GENRES);
  
  let genreScore = 0.5;
  if (topGenres.length > 0) {
    genreScore = topGenres.reduce((sum, g) => sum + g.affinity, 0) / topGenres.length;
  }
  
  // Add match factors for display
  for (const g of genreAffinities) {
    if (Math.abs(g.affinity - 0.5) > 0.15) {
      matchFactors.push({
        factor: g.genre + (g.hasAdjacencyBoost ? ' (adjacent)' : ''),
        type: 'genre',
        contribution: Math.abs(g.affinity - 0.5),
        direction: g.affinity > 0.5 ? 'positive' : 'negative',
        affinity: g.affinity
      });
    }
  }
  
  // ============================================
  // 2. Tag score using TOP-K matching
  // ============================================
  const topMediaTags = [...media.tags].sort((a, b) => b.rank - a.rank).slice(0, 15);
  const tagAffinities: Array<{ tag: string; affinity: number; rankWeight: number }> = [];
  
  for (const tag of topMediaTags) {
    const key = normalizeTagKey(tag.name);
    let affinity = tagMap.get(key);
    
    if (affinity === undefined) {
      affinity = profileTagMap.get(key);
    }
    
    if (affinity === undefined) {
      // Check hash buckets for long-tail tags
      const bucket = hashTag(tag.name);
      affinity = genome.tagBuckets[bucket];
      if (affinity === 0) affinity = undefined;
    }
    
    // Check adjacent tag boost
    if (affinity === undefined || affinity < 0.3) {
      const adjacentTags = TAG_ADJACENCY[tag.name] || [];
      for (const adj of adjacentTags) {
        const adjKey = normalizeTagKey(adj);
        const adjAffinity = tagMap.get(adjKey) || profileTagMap.get(adjKey);
        if (adjAffinity && adjAffinity > 0.6) {
          affinity = Math.max(affinity || 0, 0.35 + (adjAffinity - 0.6) * 0.25);
        }
      }
    }
    
    if (affinity !== undefined) {
      const rankWeight = clamp(tag.rank / 100, 0.3, 1);
      tagAffinities.push({ tag: tag.name, affinity, rankWeight });
    }
  }
  
  // Sort by weighted affinity and take TOP-K
  tagAffinities.sort((a, b) => (b.affinity * b.rankWeight) - (a.affinity * a.rankWeight));
  const topTags = tagAffinities.slice(0, TOP_K_TAGS);
  
  let tagScore = 0.5;
  if (topTags.length > 0) {
    const weightedSum = topTags.reduce((sum, t) => sum + t.affinity * t.rankWeight, 0);
    const weightSum = topTags.reduce((sum, t) => sum + t.rankWeight, 0);
    tagScore = weightedSum / weightSum;
  }
  
  // Add significant tags to match factors
  for (const t of tagAffinities) {
    if (Math.abs(t.affinity - 0.5) > 0.2 && t.rankWeight > 0.5) {
      matchFactors.push({
        factor: t.tag,
        type: 'tag',
        contribution: Math.abs(t.affinity - 0.5) * t.rankWeight,
        direction: t.affinity > 0.5 ? 'positive' : 'negative',
        affinity: t.affinity
      });
    }
  }
  
  // ============================================
  // 3. Popularity match score
  // ============================================
  const userNicheIndex = genome.dimensions.find(d => d.name === 'nicheIndex')?.value || 0.5;
  const logPop = Math.log10(Math.max(1, media.popularity));
  const normalizedPop = clamp((logPop - 3) / 3, 0, 1); // 1k to 1M range
  
  const popMatch = userNicheIndex > 0.6 
    ? 1 - normalizedPop  // Niche users prefer low pop
    : userNicheIndex < 0.4
    ? normalizedPop       // Mainstream users prefer high pop
    : 0.5;               // Neutral users don't care
  
  // ============================================
  // 4. Quality boost (curved for acclaimed titles)
  // ============================================
  // High meanScore pulls expectation UP even with imperfect taste match
  // Uses curved function to emphasize 80+ scores
  const quality = clamp((media.meanScore - 60) / 40, 0, 1);  // 0 at 60, 1 at 100
  const qualityBoost = Math.pow(quality, 0.65);  // Curve emphasizes high end
  
  // ============================================
  // FINAL: Match score from TOP matches only (Fix 2)
  // ============================================
  // 45% top genres + 55% top tags (weighted by rank)
  const matchScore = 0.45 * genreScore + 0.55 * tagScore;
  
  // ============================================
  // BASELINE FLOOR for global classics (Fix 3)
  // ============================================
  // Steins;Gate / AoT / FMAB can't "expect 6" - they minimum land in 7.5-9 range
  const qualityFloor = clamp((media.meanScore - 65) / 35, 0, 1);  // 65→100 maps to 0→1
  const fameFloor = clamp((Math.log10(Math.max(1, media.popularity)) - 4) / 2, 0, 1);  // 10k→1M
  const baselineFloor = 5.5 + 2.5 * qualityFloor + 1.0 * fameFloor;  // 5.5 → 9.0
  
  // ============================================
  // Convert match score to user scale (Fix 8: more aggressive)
  // ============================================
  const clampedStd = clamp(userStats.std, 1.2, 2.2);  // Fix 8: sane std range
  const predictedZ = (matchScore - 0.5) * 3.0;  // Fix 8: 3.0 instead of 2.0
  let predictedScore = clamp(
    userStats.mean + predictedZ * clampedStd,
    1,
    10
  );
  
  // Apply baseline floor (Fix 3)
  predictedScore = Math.max(predictedScore, baselineFloor);
  
  // ============================================
  // Confidence and uncertainty bands
  // ============================================
  const matchedGenreCount = genreAffinities.length;
  const matchedTagCount = tagAffinities.length;
  const strongSignals = matchFactors.filter(f => f.contribution > 0.3).length;
  
  const dataQuality = clamp((matchedGenreCount * 0.12 + matchedTagCount * 0.06 + strongSignals * 0.1), 0, 1);
  const signalStrength = matchFactors.length > 0 
    ? matchFactors.reduce((sum, f) => sum + f.contribution, 0) / matchFactors.length 
    : 0;
  const confidence = clamp(dataQuality * 0.5 + signalStrength * 0.3 + (qualityBoost > 0.5 ? 0.2 : 0), 0, 1);
  
  // Confidence-based uncertainty bands (low confidence = wider band)
  const sigma = lerp(1.8, 0.6, confidence);  // 1.8 at 0% confidence, 0.6 at 100%
  const expectedRange = {
    low: Math.max(1, Math.round((predictedScore - sigma) * 10) / 10),
    high: Math.min(10, Math.round((predictedScore + sigma) * 10) / 10)
  };
  
  // Probability of liking (7+)
  const zForSeven = (7 - userStats.mean) / (userStats.std || 1.5);
  const predictedZForSeven = (predictedScore - userStats.mean) / (userStats.std || 1.5);
  const probabilityOfLiking = clamp(50 + (predictedZForSeven - zForSeven) * 25, 5, 95);
  
  // Risk level
  let riskLevel: 'SAFE' | 'MODERATE' | 'EXPERIMENTAL' = 'MODERATE';
  const positiveFactorCount = matchFactors.filter(f => f.direction === 'positive').length;
  const negativeFactorCount = matchFactors.filter(f => f.direction === 'negative').length;
  
  if (confidence > 0.6 && positiveFactorCount >= 2 && negativeFactorCount === 0) {
    riskLevel = 'SAFE';
  } else if (confidence < 0.3 || negativeFactorCount > positiveFactorCount) {
    riskLevel = 'EXPERIMENTAL';
  }
  
  // Sort match factors by contribution (positive first, then negative)
  matchFactors.sort((a, b) => {
    if (a.direction !== b.direction) {
      return a.direction === 'positive' ? -1 : 1;
    }
    return b.contribution - a.contribution;
  });
  
  return {
    predictedScore: Math.round(predictedScore * 10) / 10,
    expectedRange,
    confidence: Math.round(confidence * 100) / 100,
    confidenceLabel: confidence > 0.6 ? 'High' : confidence > 0.35 ? 'Medium' : 'Low',
    probabilityOfLiking: Math.round(probabilityOfLiking),
    matchFactors: matchFactors.slice(0, 8),
    riskLevel,
    componentScores: {
      genreScore: Math.round(genreScore * 100) / 100,
      tagScore: Math.round(tagScore * 100) / 100,
      qualityBoost: Math.round(qualityBoost * 100) / 100,
      popMatch: Math.round(popMatch * 100) / 100
    }
  };
}

// Linear interpolation helper
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

// ============================================
// CONTRADICTION DETECTOR (IMPROVED)
// ============================================

export interface TasteContradiction {
  mediaId: number;
  title: string;
  coverImage?: string;
  
  actualScore: number;
  expectedScore: number;
  expectedRange: { low: number; high: number };
  residual: number;
  residualZ: number;
  matchScore: number;  // 0-1, how well this matches your taste profile
  surpriseScore: number;  // For true wildcards
  
  // CLEAN 3-bucket classification (Fix 1, 4)
  contradictionType: 
    | 'ON_BRAND_FAVORITE'   // High match + high score - "Exactly your taste"
    | 'GENRE_EXCEPTION'     // Loved despite 1 mismatch - "Beat your stereotype" (Fix 1)
    | 'TRUE_WILDCARD'       // Low match + high score + not explainable by fame (Fix 4)
    | 'PERSONAL_EXCEPTION'  // You rated lower than expected
    | 'EXECUTION_BETRAYAL'; // Dropped despite good match
  label: string;
  explanation: string;
  
  // Fix 5: "You loved it because..." + "Despite..."
  lovedBecause: Array<{ factor: string; affinity: number }>;
  despite: Array<{ factor: string; affinity: number }>;
  
  // Media context
  meanScore: number;
  popularity: number;
}

export function detectContradictions(
  entries: MediaListEntry[],
  genome: TasteGenome,
  profile: TasteProfile,
  userStats: { mean: number; std: number }
): TasteContradiction[] {
  const contradictions: TasteContradiction[] = [];
  const seenMediaIds = new Set<number>();  // Fix 6: Dedupe by media.id
  
  const analyzable = entries.filter(e => 
    e.score && e.score >= 1 && 
    e.media &&
    (e.status === 'COMPLETED' || e.status === 'DROPPED')
  );
  
  // Fix 8: Use clamped std for more realistic residuals
  const clampedStd = clamp(userStats.std, 1.2, 2.2);
  
  for (const entry of analyzable) {
    const media = entry.media!;
    
    // Fix 6: Skip duplicates
    if (seenMediaIds.has(media.id)) continue;
    seenMediaIds.add(media.id);
    
    const actualScore = entry.score!;
    
    const mediaFeatures: MediaFeatures = {
      genres: media.genres || [],
      tags: (media.tags || []).map(t => ({ name: t.name, rank: t.rank })),
      popularity: media.popularity || 10000,
      meanScore: media.meanScore || 70,
      format: media.format || 'TV',
      seasonYear: media.seasonYear,
      studios: media.studios?.edges?.filter(e => e.isMain).map(e => e.node.name)
    };
    
    const prediction = predictEnjoyment(genome, profile, mediaFeatures, userStats);
    const expectedScore = prediction.predictedScore;
    const expectedRange = prediction.expectedRange;
    const residual = actualScore - expectedScore;
    const residualZ = residual / clampedStd;
    
    // Calculate match score (0-1) from component scores
    const matchScore = 0.45 * prediction.componentScores.genreScore + 0.55 * prediction.componentScores.tagScore;
    
    // Calculate surprise score (Fix 4: true surprise requires low match)
    // surprise = residualZ * (1 - matchScore) * (1 - confidence)
    const surpriseScore = Math.abs(residualZ) * (1 - matchScore) * (1 - prediction.confidence);
    
    // Only flag as contradiction if significantly outside expected
    if (Math.abs(residualZ) < 1.0) continue;
    
    // Extract factors for "You loved it because..." + "Despite..." (Fix 5)
    const lovedBecause = prediction.matchFactors
      .filter(f => f.direction === 'positive')
      .slice(0, 3)
      .map(f => ({ factor: f.factor, affinity: Math.round(f.affinity * 100) }));
    const despite = prediction.matchFactors
      .filter(f => f.direction === 'negative')
      .slice(0, 2)
      .map(f => ({ factor: f.factor, affinity: Math.round(f.affinity * 100) }));
    
    // ============================================
    // CLEAN 3-BUCKET CLASSIFICATION (Fix 1, 4)
    // ============================================
    let contradictionType: TasteContradiction['contradictionType'];
    let label: string;
    let explanation: string;
    
    const meanScore = mediaFeatures.meanScore;
    const popularity = mediaFeatures.popularity;
    const isMainstream = meanScore >= 80 || popularity >= 100000;
    
    if (residual > 0 && entry.status === 'COMPLETED') {
      // User scored HIGHER than expected
      
      if (matchScore >= 0.70 && actualScore >= 8) {
        // ON-BRAND FAVORITE: High match + high score = "Exactly your taste"
        contradictionType = 'ON_BRAND_FAVORITE';
        label = 'On-Brand Favorite';
        const topFactors = lovedBecause.slice(0, 2).map(f => f.factor).join(', ');
        explanation = topFactors 
          ? `You loved it because: ${topFactors}. Exactly your lane.`
          : `This fits your taste perfectly.`;
      } else if (matchScore >= 0.45 && despite.length >= 1) {
        // GENRE EXCEPTION (Fix 1): Loved despite 1 mismatch = "Beat your stereotype"
        contradictionType = 'GENRE_EXCEPTION';
        label = 'Genre Exception';
        const topLoved = lovedBecause[0]?.factor || 'other factors';
        const topDespite = despite[0]?.factor || 'a mismatch';
        explanation = `You loved it because: ${topLoved}. Despite: ${topDespite} (${despite[0]?.affinity || 0}%).`;
      } else if (matchScore < 0.45 && surpriseScore > 1.2 && !isMainstream) {
        // TRUE WILDCARD (Fix 4): Low match + high surprise + not explainable by fame
        contradictionType = 'TRUE_WILDCARD';
        label = 'True Wildcard';
        explanation = `This one makes no sense (in a cool way). Low profile match but you gave it ${actualScore}.`;
      } else if (matchScore < 0.45 && despite.length >= 1) {
        // Genre exception even if low match, as long as there's a clear mismatch
        contradictionType = 'GENRE_EXCEPTION';
        label = 'Genre Exception';
        const topDespite = despite[0]?.factor || 'a mismatch';
        explanation = `You beat your own stereotype. Despite: ${topDespite} (${despite[0]?.affinity || 0}%).`;
      } else {
        // Default to on-brand for mainstream titles
        contradictionType = 'ON_BRAND_FAVORITE';
        label = isMainstream ? 'Mainstream Hit' : 'Personal Favorite';
        explanation = isMainstream 
          ? `Highly acclaimed (${meanScore}%) and you agreed.`
          : `You rated this +${residual.toFixed(1)} above expected.`;
      }
    } else if (residual < 0 && entry.status === 'COMPLETED') {
      // User scored LOWER than expected
      contradictionType = 'PERSONAL_EXCEPTION';
      label = 'Personal Exception';
      const topLoved = lovedBecause[0];
      explanation = topLoved
        ? `Matched your taste (${topLoved.factor}: ${topLoved.affinity}%) but you gave it ${actualScore}. Execution > ingredients.`
        : `Predicted ${expectedScore.toFixed(1)} but you gave it ${actualScore}. Sometimes things just don't click.`;
    } else {
      // DROPPED despite good prediction
      contradictionType = 'EXECUTION_BETRAYAL';
      label = 'Execution Betrayal';
      explanation = `Matched your profile but you dropped it. The concept didn't match the delivery.`;
    }
    
    contradictions.push({
      mediaId: media.id,
      title: media.title?.english || media.title?.romaji || 'Unknown',
      coverImage: media.coverImage?.large || media.coverImage?.medium,
      actualScore,
      expectedScore,
      expectedRange,
      residual: Math.round(residual * 10) / 10,
      residualZ: Math.round(residualZ * 100) / 100,
      matchScore: Math.round(matchScore * 100) / 100,
      surpriseScore: Math.round(surpriseScore * 100) / 100,
      meanScore,
      popularity,
      contradictionType,
      label,
      explanation,
      lovedBecause,
      despite
    });
  }
  
  // Sort by residual magnitude (most surprising first)
  contradictions.sort((a, b) => Math.abs(b.residualZ) - Math.abs(a.residualZ));
  return contradictions;
}

// ============================================
// TASTE INFLUENCERS (IMPROVED: marginal impact)
// ============================================

export interface TasteInfluencer {
  mediaId: number;
  title: string;
  coverImage?: string;
  
  influenceScore: number;
  marginalImpact: number;   // How much removing this changes the genome
  rank: number;
  
  shapedTraits: Array<{
    trait: string;
    type: 'genre' | 'tag';
    contribution: number;
  }>;
  
  engagementWeight: number;
  wasFormative: boolean;
}

export function identifyTasteInfluencers(
  entries: MediaListEntry[],
  profile: TasteProfile,
  genome: TasteGenome,
  limit: number = 10
): TasteInfluencer[] {
  const influencers: TasteInfluencer[] = [];
  
  const completed = entries.filter(e => 
    e.status === 'COMPLETED' && 
    e.media &&
    e.score && e.score >= 7
  );
  
  // Sort by completion date for formative detection
  const sorted = [...completed].sort((a, b) => {
    const dateA = a.completedAt?.year || a.updatedAt || 0;
    const dateB = b.completedAt?.year || b.updatedAt || 0;
    return dateA - dateB;
  });
  const formativeThreshold = Math.floor(sorted.length * 0.2);
  
  // Calculate marginal impact for each entry
  for (let i = 0; i < completed.length; i++) {
    const entry = completed[i];
    const media = entry.media!;
    const score = entry.score!;
    const repeats = entry.repeat || 0;
    
    // Engagement weight
    const scoreWeight = (score - 5) / 5;
    const repeatWeight = Math.min(1, repeats * 0.3);
    const engagementWeight = 0.7 * scoreWeight + 0.3 * repeatWeight;
    
    // Formative check
    const originalIndex = sorted.findIndex(e => e.media?.id === media.id);
    const wasFormative = originalIndex < formativeThreshold;
    
    // Calculate marginal impact (how much this title affects genome dimensions)
    let marginalImpact = 0;
    const shapedTraits: TasteInfluencer['shapedTraits'] = [];
    
    // Genre impact
    for (const genre of media.genres || []) {
      const genreAffinity = profile.genreAffinity.find(g => g.genre === genre);
      if (genreAffinity && genreAffinity.count > 0) {
        // Impact = engagement × (1 / count) × affinity strength
        const impact = engagementWeight * (1 / genreAffinity.count) * toUnit01(genreAffinity.affinity);
        marginalImpact += impact;
        if (impact > 0.05) {
          shapedTraits.push({ trait: genre, type: 'genre', contribution: impact });
        }
      }
    }
    
    // Tag impact (top 5)
    for (const tag of (media.tags || []).slice(0, 5)) {
      const tagAffinity = profile.tagAffinity.find(t => t.tag === tag.name);
      if (tagAffinity && tagAffinity.count > 0) {
        const impact = engagementWeight * (tag.rank / 100) * (1 / tagAffinity.count) * toUnit01(tagAffinity.affinity);
        marginalImpact += impact;
        if (impact > 0.03) {
          shapedTraits.push({ trait: tag.name, type: 'tag', contribution: impact });
        }
      }
    }
    
    // Formative bonus
    if (wasFormative) {
      marginalImpact *= 1.5;
    }
    
    // Influence score (normalized)
    const influenceScore = clamp(marginalImpact * 100, 0, 100);
    
    if (influenceScore > 5) {
      influencers.push({
        mediaId: media.id,
        title: media.title?.english || media.title?.romaji || 'Unknown',
        coverImage: media.coverImage?.large || media.coverImage?.medium,
        influenceScore: Math.round(influenceScore),
        marginalImpact: Math.round(marginalImpact * 1000) / 1000,
        rank: 0,
        shapedTraits: shapedTraits.sort((a, b) => b.contribution - a.contribution).slice(0, 3),
        engagementWeight: Math.round(engagementWeight * 100) / 100,
        wasFormative
      });
    }
  }
  
  influencers.sort((a, b) => b.influenceScore - a.influenceScore);
  influencers.forEach((inf, i) => inf.rank = i + 1);
  
  return influencers.slice(0, limit);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate entropy for a distribution (FIXED: proper normalization)
 */
function calculateDistributionEntropy(values: number[]): number {
  const sum = values.reduce((a, b) => a + Math.max(0, b), 0);
  if (sum === 0) return 0;
  
  const normalized = values.map(v => Math.max(0, v) / sum);
  let entropy = 0;
  
  for (const p of normalized) {
    if (p > 0.001) {
      entropy -= p * Math.log2(p);
    }
  }
  
  const maxEntropy = Math.log2(values.length);
  return maxEntropy > 0 ? entropy / maxEntropy : 0;
}

/**
 * Calculate uniqueness as distance from neutral baseline
 */
function calculateUniqueness(centeredVector: number[]): number {
  // Euclidean magnitude of centered vector
  const magnitude = Math.sqrt(centeredVector.reduce((sum, v) => sum + v * v, 0));
  // Normalize by max possible magnitude (sqrt(n) if all dims are 1 or -1)
  const maxMagnitude = Math.sqrt(centeredVector.length);
  return clamp(magnitude / maxMagnitude, 0, 1);
}

// ============================================
// EXPORTS
// ============================================

// Re-export trait system types for convenience
export type {
  TraitProfile,
  TraitScore,
  ChannelScores,
  DerivedIndex,
  TasteType,
  StressDiet,
  ComfortLoop,
};

export default {
  extractGenome,
  extractEnhancedGenome,
  extractTraitProfile,
  cosineSimilarity,
  euclideanDistance,
  compareDimensions,
  predictEnjoyment,
  detectContradictions,
  identifyTasteInfluencers,
  hashTag
};
