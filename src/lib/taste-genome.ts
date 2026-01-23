/**
 * TASTE GENOME v2
 * 
 * A user's taste compressed into a fixed-length vector fingerprint.
 * 
 * FIXES from v1:
 * ✅ Contribution uses baseline-delta (not self-normalized z-score)
 * ✅ Centered vectors for similarity calculation
 * ✅ Predictor averages within groups (not sums)
 * ✅ Entropy only on genre/tag distributions
 * ✅ Uniqueness = distance from neutral baseline
 * ✅ Feature hashing for tags (64 buckets for long tail)
 */

import { TasteProfile, MediaListEntry } from '@/types/anilist';

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

// ============================================
// FEATURE HASHING
// ============================================

function hashTag(tagName: string): number {
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    const char = tagName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % TAG_HASH_BUCKETS;
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
    const normalized = clamp(affinity / 100, 0, 1);
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
    const normalized = clamp(affinity / 100, 0, 1);
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
    const weight = clamp(tagData.affinity / 100, 0, 1);
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
    version: '2.0',
    generatedAt: new Date(),
    entropy,
    uniquenessScore,
    dominantTraits
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
  confidence: number;
  confidenceLabel: string;
  probabilityOfLiking: number;
  matchFactors: Array<{
    factor: string;
    type: 'genre' | 'tag' | 'popularity' | 'community';
    contribution: number;
    direction: 'positive' | 'negative' | 'neutral';
  }>;
  riskLevel: 'SAFE' | 'MODERATE' | 'EXPERIMENTAL';
}

/**
 * Predict enjoyment using AVERAGED group scores (not summed)
 */
export function predictEnjoyment(
  genome: TasteGenome,
  profile: TasteProfile,
  media: MediaFeatures,
  userStats: { mean: number; std: number }
): EnjoymentPrediction {
  const matchFactors: EnjoymentPrediction['matchFactors'] = [];
  
  // Build lookup maps
  const genreMap = new Map(genome.dimensions.filter(d => d.category === 'genre').map(d => [d.name, d.value]));
  const tagMap = new Map(genome.dimensions.filter(d => d.category === 'tag').map(d => [d.name, d.value]));
  const profileTagMap = new Map(profile.tagAffinity.map(t => [t.tag, t.affinity / 100]));
  
  // 1. Genre score (AVERAGED, not summed)
  let genreSum = 0;
  let genreCount = 0;
  for (const genre of media.genres) {
    const affinity = genreMap.get(genre);
    if (affinity !== undefined) {
      genreSum += affinity;
      genreCount++;
      if (Math.abs(affinity - 0.5) > 0.2) {
        matchFactors.push({
          factor: genre,
          type: 'genre',
          contribution: Math.abs(affinity - 0.5),
          direction: affinity > 0.5 ? 'positive' : 'negative'
        });
      }
    }
  }
  const genreScore = genreCount > 0 ? genreSum / genreCount : 0.5;
  
  // 2. Tag score (AVERAGED, capped to top 10 by rank)
  const topTags = [...media.tags].sort((a, b) => b.rank - a.rank).slice(0, 10);
  let tagSum = 0;
  let tagWeightSum = 0;
  for (const tag of topTags) {
    let affinity = tagMap.get(tag.name);
    if (affinity === undefined) {
      affinity = profileTagMap.get(tag.name);
    }
    if (affinity === undefined) {
      // Check hash buckets for long-tail tags
      const bucket = hashTag(tag.name);
      affinity = genome.tagBuckets[bucket] || 0.5;
    }
    
    const rankWeight = clamp(tag.rank / 100, 0.3, 1);
    tagSum += affinity * rankWeight;
    tagWeightSum += rankWeight;
    
    if (Math.abs(affinity - 0.5) > 0.25 && tag.rank > 50) {
      matchFactors.push({
        factor: tag.name,
        type: 'tag',
        contribution: Math.abs(affinity - 0.5) * rankWeight,
        direction: affinity > 0.5 ? 'positive' : 'negative'
      });
    }
  }
  const tagScore = tagWeightSum > 0 ? tagSum / tagWeightSum : 0.5;
  
  // 3. Popularity match score
  const userNicheIndex = genome.dimensions.find(d => d.name === 'nicheIndex')?.value || 0.5;
  const logPop = Math.log10(Math.max(1, media.popularity));
  const normalizedPop = clamp((logPop - 3) / 3, 0, 1); // 1k to 1M range
  // Niche users prefer low pop, mainstream users prefer high pop
  const popMatch = userNicheIndex > 0.6 
    ? 1 - normalizedPop
    : userNicheIndex < 0.4
    ? normalizedPop
    : 0.5; // Neutral users don't care
  
  // 4. Community score baseline
  const communityScore = clamp((media.meanScore - 50) / 50, 0, 1);
  
  // FINAL: Weighted average of group averages
  const weights = { genre: 0.35, tag: 0.35, pop: 0.15, community: 0.15 };
  const rawAffinity = 
    weights.genre * genreScore +
    weights.tag * tagScore +
    weights.pop * popMatch +
    weights.community * communityScore;
  
  // Convert to user's rating scale
  const predictedZ = (rawAffinity - 0.5) * 2;
  const predictedScore = clamp(
    userStats.mean + predictedZ * userStats.std * 1.5,
    1,
    10
  );
  
  // Confidence based on data quality
  const matchedGenres = media.genres.filter(g => genreMap.has(g)).length;
  const matchedTags = topTags.filter(t => tagMap.has(t.name) || profileTagMap.has(t.name)).length;
  const dataQuality = clamp((matchedGenres * 0.15 + matchedTags * 0.08), 0, 1);
  const signalStrength = matchFactors.reduce((sum, f) => sum + f.contribution, 0) / Math.max(1, matchFactors.length);
  const confidence = clamp(dataQuality * 0.6 + signalStrength * 0.4, 0, 1);
  
  // Probability of liking (7+)
  const zForSeven = (7 - userStats.mean) / (userStats.std || 1.5);
  const predictedZForSeven = (predictedScore - userStats.mean) / (userStats.std || 1.5);
  const probabilityOfLiking = clamp(50 + (predictedZForSeven - zForSeven) * 25, 5, 95);
  
  // Risk level
  let riskLevel: 'SAFE' | 'MODERATE' | 'EXPERIMENTAL' = 'MODERATE';
  const positiveFactors = matchFactors.filter(f => f.direction === 'positive').length;
  const negativeFactors = matchFactors.filter(f => f.direction === 'negative').length;
  
  if (confidence > 0.6 && positiveFactors >= 2 && negativeFactors === 0) {
    riskLevel = 'SAFE';
  } else if (confidence < 0.3 || negativeFactors > positiveFactors) {
    riskLevel = 'EXPERIMENTAL';
  }
  
  // Sort match factors by contribution
  matchFactors.sort((a, b) => b.contribution - a.contribution);
  
  return {
    predictedScore: Math.round(predictedScore * 10) / 10,
    confidence: Math.round(confidence * 100) / 100,
    confidenceLabel: confidence > 0.6 ? 'High' : confidence > 0.35 ? 'Medium' : 'Low',
    probabilityOfLiking: Math.round(probabilityOfLiking),
    matchFactors: matchFactors.slice(0, 6),
    riskLevel
  };
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
  residual: number;
  residualZ: number;
  
  contradictionType: 'GUILTY_PLEASURE' | 'UNEXPECTED_MASTERPIECE' | 'PERSONAL_EXCEPTION' | 'EXECUTION_BETRAYAL';
  label: string;
  explanation: string;
  
  // What made this unexpected (improved)
  negativeFactors: Array<{ factor: string; reason: string }>;
  positiveFactors: Array<{ factor: string; reason: string }>;
}

export function detectContradictions(
  entries: MediaListEntry[],
  genome: TasteGenome,
  profile: TasteProfile,
  userStats: { mean: number; std: number }
): TasteContradiction[] {
  const contradictions: TasteContradiction[] = [];
  
  const analyzable = entries.filter(e => 
    e.score && e.score >= 1 && 
    e.media &&
    (e.status === 'COMPLETED' || e.status === 'DROPPED')
  );
  
  for (const entry of analyzable) {
    const media = entry.media!;
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
    const residual = actualScore - expectedScore;
    const residualZ = residual / (userStats.std || 1.5);
    
    if (Math.abs(residualZ) < 1.2) continue;
    
    // Extract positive and negative factors from prediction
    const negativeFactors = prediction.matchFactors
      .filter(f => f.direction === 'negative')
      .map(f => ({ factor: f.factor, reason: `Low affinity for ${f.factor}` }));
    const positiveFactors = prediction.matchFactors
      .filter(f => f.direction === 'positive')
      .map(f => ({ factor: f.factor, reason: `High affinity for ${f.factor}` }));
    
    // Improved contradiction classification
    let contradictionType: TasteContradiction['contradictionType'];
    let label: string;
    let explanation: string;
    
    if (residual > 0 && entry.status === 'COMPLETED') {
      if (negativeFactors.length >= 2) {
        contradictionType = 'UNEXPECTED_MASTERPIECE';
        label = 'Unexpected Masterpiece';
        explanation = `Despite ${negativeFactors.length} factors working against it, you rated this ${residual.toFixed(1)} points above expected. Something special here.`;
      } else {
        contradictionType = 'GUILTY_PLEASURE';
        label = 'Guilty Pleasure';
        explanation = `You rated this ${residual.toFixed(1)} points higher than your profile suggests. A personal favorite beyond the data.`;
      }
    } else if (residual < 0 && entry.status === 'COMPLETED') {
      contradictionType = 'PERSONAL_EXCEPTION';
      label = 'Personal Exception';
      explanation = `This matched your profile well (predicted ${expectedScore.toFixed(1)}) but you rated it ${actualScore}. Sometimes execution matters more than ingredients.`;
    } else {
      contradictionType = 'EXECUTION_BETRAYAL';
      label = 'Execution Betrayal';
      explanation = `This looked perfect for you on paper but you dropped it. The concept didn't match the delivery.`;
    }
    
    contradictions.push({
      mediaId: media.id,
      title: media.title?.english || media.title?.romaji || 'Unknown',
      coverImage: media.coverImage?.large || media.coverImage?.medium,
      actualScore,
      expectedScore,
      residual: Math.round(residual * 10) / 10,
      residualZ: Math.round(residualZ * 100) / 100,
      contradictionType,
      label,
      explanation,
      negativeFactors: negativeFactors.slice(0, 3),
      positiveFactors: positiveFactors.slice(0, 3)
    });
  }
  
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
        const impact = engagementWeight * (1 / genreAffinity.count) * (genreAffinity.affinity / 100);
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
        const impact = engagementWeight * (tag.rank / 100) * (1 / tagAffinity.count) * (tagAffinity.affinity / 100);
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

export default {
  extractGenome,
  cosineSimilarity,
  euclideanDistance,
  compareDimensions,
  predictEnjoyment,
  detectContradictions,
  identifyTasteInfluencers,
  hashTag
};
