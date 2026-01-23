/**
 * TASTE GENOME
 * 
 * A user's taste compressed into a fixed-length vector fingerprint.
 * This enables:
 * - Find "taste twins" (cosine similarity)
 * - Predict what you'll like
 * - Track taste drift over time
 * - Compare users meaningfully
 * - Cluster users into archetypes
 */

import { TasteProfile, MediaListEntry } from '@/types/anilist';

// ============================================
// GENOME STRUCTURE
// ============================================

/**
 * Fixed-length genome vector components
 * Total: 50 dimensions (expandable)
 */
export interface TasteGenome {
  // Vector components (all normalized 0-1 or z-scored)
  vector: number[];
  
  // Metadata
  dimensions: GenomeDimension[];
  version: string;
  generatedAt: Date;
  
  // Summary stats
  entropy: number;           // How diverse/unpredictable the genome is
  uniquenessScore: number;   // How unusual compared to population
  dominantTraits: string[];  // Top 3 defining characteristics
}

export interface GenomeDimension {
  name: string;
  category: 'genre' | 'tag' | 'emotional' | 'structural' | 'behavioral';
  value: number;
  zScore: number;       // Normalized against population (if available)
  contribution: number; // How much this dimension defines you
}

// ============================================
// GENOME CONFIGURATION
// ============================================

// Top genres to include in genome (ordered by global popularity)
const GENOME_GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy',
  'Horror', 'Mystery', 'Psychological', 'Romance', 'Sci-Fi',
  'Slice of Life', 'Sports', 'Supernatural', 'Thriller', 'Mecha'
];

// Top tags to include in genome (curated for taste differentiation)
const GENOME_TAGS = [
  // Tone/Atmosphere
  'Dark', 'Gore', 'Cute Girls Doing Cute Things', 'Iyashikei', 'Parody',
  // Theme
  'Coming of Age', 'Tragedy', 'Revenge', 'Time Travel', 'Isekai',
  // Character
  'Anti-Hero', 'Ensemble Cast', 'Female Protagonist', 'Male Protagonist',
  // Setting
  'School', 'Military', 'Historical', 'Space', 'Urban'
];

// Emotional axes (from TasteProfile.emotionalProfile)
const EMOTIONAL_AXES = [
  'escapism', 'bleakness', 'idealism', 'intensity', 'sentimentality'
];

// Structural axes (from TasteProfile.structuralPreferences)
const STRUCTURAL_AXES = [
  'episodicVsSerial', 'pacingPreference', 'plotVsCharacter', 'complexityPreference'
];

// Behavioral axes (derived from TasteProfile.behavioralMetrics)
const BEHAVIORAL_AXES = [
  'completionRate', 'nicheIndex', 'diversityIndex', 'experimentalIndex', 'mainstreamIndex'
];

// Personality traits (from TasteProfile.personalityTraits)
const PERSONALITY_AXES = [
  'chaosLevel', 'emotionalDamageIndex', 'completionist', 'cultHunter', 'avantGarde'
];

// ============================================
// GENOME EXTRACTION
// ============================================

/**
 * Extract a Taste Genome from a TasteProfile
 * Creates a fixed-length normalized vector representation
 */
export function extractGenome(profile: TasteProfile): TasteGenome {
  const dimensions: GenomeDimension[] = [];
  const vector: number[] = [];
  
  // 1. Genre affinity vector (15 dimensions)
  const genreMap = new Map(profile.genreAffinity.map(g => [g.genre, g.affinity]));
  for (const genre of GENOME_GENRES) {
    const affinity = genreMap.get(genre) || 0;
    const normalized = clamp(affinity / 100, 0, 1);
    dimensions.push({
      name: genre,
      category: 'genre',
      value: normalized,
      zScore: 0, // Will be calculated with population data
      contribution: 0
    });
    vector.push(normalized);
  }
  
  // 2. Tag affinity vector (20 dimensions)
  const tagMap = new Map(profile.tagAffinity.map(t => [t.tag, t.affinity]));
  for (const tag of GENOME_TAGS) {
    const affinity = tagMap.get(tag) || 0;
    const normalized = clamp(affinity / 100, 0, 1);
    dimensions.push({
      name: tag,
      category: 'tag',
      value: normalized,
      zScore: 0,
      contribution: 0
    });
    vector.push(normalized);
  }
  
  // 3. Emotional profile vector (5 dimensions)
  for (const axis of EMOTIONAL_AXES) {
    const value = profile.emotionalProfile?.[axis as keyof typeof profile.emotionalProfile] || 0.5;
    dimensions.push({
      name: axis,
      category: 'emotional',
      value,
      zScore: 0,
      contribution: 0
    });
    vector.push(value);
  }
  
  // 4. Structural preferences vector (4 dimensions)
  for (const axis of STRUCTURAL_AXES) {
    const value = profile.structuralPreferences?.[axis as keyof typeof profile.structuralPreferences] || 0.5;
    dimensions.push({
      name: axis,
      category: 'structural',
      value,
      zScore: 0,
      contribution: 0
    });
    vector.push(value);
  }
  
  // 5. Behavioral metrics vector (5 dimensions)
  const behavioralMap: Record<string, number> = {
    completionRate: profile.behavioralMetrics?.completionRate || 0.5,
    nicheIndex: profile.behavioralMetrics?.nicheIndex || 0.5,
    diversityIndex: profile.behavioralMetrics?.diversityIndex || 0.5,
    experimentalIndex: profile.behavioralMetrics?.experimentalIndex || 0.5,
    mainstreamIndex: profile.behavioralMetrics?.mainstreamIndex || 0.5,
  };
  for (const axis of BEHAVIORAL_AXES) {
    const value = behavioralMap[axis] || 0.5;
    dimensions.push({
      name: axis,
      category: 'behavioral',
      value,
      zScore: 0,
      contribution: 0
    });
    vector.push(value);
  }
  
  // 6. Personality traits vector (5 dimensions) - normalized to 0-1
  const personalityMap: Record<string, number> = {
    chaosLevel: (profile.personalityTraits?.chaosLevel || 5) / 10,
    emotionalDamageIndex: (profile.personalityTraits?.emotionalDamageIndex || 5) / 10,
    completionist: (profile.personalityTraits?.completionist || 5) / 10,
    cultHunter: (profile.personalityTraits?.cultHunter || 5) / 10,
    avantGarde: (profile.personalityTraits?.avantGarde || 5) / 10,
  };
  for (const axis of PERSONALITY_AXES) {
    const value = personalityMap[axis] || 0.5;
    dimensions.push({
      name: axis,
      category: 'behavioral', // Personality is behavioral
      value,
      zScore: 0,
      contribution: 0
    });
    vector.push(value);
  }
  
  // Calculate contributions (how much each dimension defines the user)
  const mean = vector.reduce((a, b) => a + b, 0) / vector.length;
  const std = Math.sqrt(vector.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vector.length) || 1;
  
  dimensions.forEach((dim, i) => {
    dim.zScore = (dim.value - mean) / std;
    dim.contribution = Math.abs(dim.zScore);
  });
  
  // Sort by contribution to find dominant traits
  const sortedDimensions = [...dimensions].sort((a, b) => b.contribution - a.contribution);
  const dominantTraits = sortedDimensions.slice(0, 3).map(d => d.name);
  
  // Calculate genome entropy (diversity)
  const entropy = calculateEntropy(vector);
  
  // Calculate uniqueness (how far from center)
  const magnitude = Math.sqrt(vector.reduce((a, b) => a + b * b, 0));
  const uniquenessScore = clamp(magnitude / Math.sqrt(vector.length), 0, 1);
  
  return {
    vector,
    dimensions,
    version: '1.0',
    generatedAt: new Date(),
    entropy,
    uniquenessScore,
    dominantTraits
  };
}

// ============================================
// SIMILARITY & DISTANCE FUNCTIONS
// ============================================

/**
 * Calculate cosine similarity between two genomes (0-1)
 * 1 = identical taste, 0 = orthogonal/no overlap
 */
export function cosineSimilarity(genomeA: TasteGenome, genomeB: TasteGenome): number {
  if (genomeA.vector.length !== genomeB.vector.length) {
    throw new Error('Genome vectors must have same length');
  }
  
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  for (let i = 0; i < genomeA.vector.length; i++) {
    dotProduct += genomeA.vector[i] * genomeB.vector[i];
    magnitudeA += genomeA.vector[i] * genomeA.vector[i];
    magnitudeB += genomeB.vector[i] * genomeB.vector[i];
  }
  
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Calculate Euclidean distance between two genomes
 * Lower = more similar
 */
export function euclideanDistance(genomeA: TasteGenome, genomeB: TasteGenome): number {
  if (genomeA.vector.length !== genomeB.vector.length) {
    throw new Error('Genome vectors must have same length');
  }
  
  let sumSquares = 0;
  for (let i = 0; i < genomeA.vector.length; i++) {
    sumSquares += Math.pow(genomeA.vector[i] - genomeB.vector[i], 2);
  }
  
  return Math.sqrt(sumSquares);
}

/**
 * Find which dimensions differ most between two genomes
 */
export function compareDimensions(
  genomeA: TasteGenome, 
  genomeB: TasteGenome
): Array<{ dimension: string; category: string; delta: number; direction: 'higher' | 'lower' }> {
  const differences: Array<{ dimension: string; category: string; delta: number; direction: 'higher' | 'lower' }> = [];
  
  for (let i = 0; i < genomeA.dimensions.length; i++) {
    const dimA = genomeA.dimensions[i];
    const dimB = genomeB.dimensions[i];
    const delta = dimA.value - dimB.value;
    
    if (Math.abs(delta) > 0.1) { // Threshold for meaningful difference
      differences.push({
        dimension: dimA.name,
        category: dimA.category,
        delta: Math.abs(delta),
        direction: delta > 0 ? 'higher' : 'lower'
      });
    }
  }
  
  return differences.sort((a, b) => b.delta - a.delta);
}

// ============================================
// ENJOYMENT PREDICTOR
// ============================================

/**
 * Media feature vector for prediction
 */
export interface MediaFeatures {
  genres: string[];
  tags: Array<{ name: string; rank: number }>;
  popularity: number;
  meanScore: number;
  format: string;
  seasonYear?: number;
  studios?: string[];
}

/**
 * Prediction result with confidence
 */
export interface EnjoymentPrediction {
  predictedScore: number;      // 1-10 scale
  confidence: number;          // 0-1 how confident we are
  confidenceLabel: string;     // "High", "Medium", "Low"
  probabilityOfLiking: number; // 0-100% chance of rating 7+
  matchFactors: Array<{
    factor: string;
    type: 'genre' | 'tag' | 'emotional' | 'structural';
    contribution: number;      // How much this factor contributed
    direction: 'positive' | 'negative';
  }>;
  riskLevel: 'SAFE' | 'MODERATE' | 'EXPERIMENTAL';
}

/**
 * Predict how much a user will enjoy a piece of media
 * Uses weighted linear model: predicted = baseline + Σ(feature × affinity)
 */
export function predictEnjoyment(
  genome: TasteGenome,
  profile: TasteProfile,
  media: MediaFeatures,
  userStats: { mean: number; std: number }
): EnjoymentPrediction {
  const matchFactors: EnjoymentPrediction['matchFactors'] = [];
  let totalWeight = 0;
  let weightedSum = 0;
  let matchCount = 0;
  
  // 1. Genre matching (weight: 0.35)
  const genreWeight = 0.35;
  const genreMap = new Map(genome.dimensions.filter(d => d.category === 'genre').map(d => [d.name, d.value]));
  
  for (const genre of media.genres) {
    const affinity = genreMap.get(genre) || 0.5;
    const contribution = (affinity - 0.5) * 2; // Scale to -1 to 1
    
    if (Math.abs(contribution) > 0.1) {
      matchFactors.push({
        factor: genre,
        type: 'genre',
        contribution: Math.abs(contribution),
        direction: contribution > 0 ? 'positive' : 'negative'
      });
    }
    
    weightedSum += affinity * genreWeight;
    totalWeight += genreWeight;
    if (affinity > 0.6) matchCount++;
  }
  
  // 2. Tag matching (weight: 0.35)
  const tagWeight = 0.35;
  const tagMap = new Map(genome.dimensions.filter(d => d.category === 'tag').map(d => [d.name, d.value]));
  const profileTagMap = new Map(profile.tagAffinity.map(t => [t.tag, t.affinity]));
  
  for (const tag of media.tags) {
    // Check genome tags first
    let affinity = tagMap.get(tag.name);
    
    // If not in genome, check full profile
    if (affinity === undefined) {
      const profileAffinity = profileTagMap.get(tag.name);
      affinity = profileAffinity ? clamp(profileAffinity / 100, 0, 1) : 0.5;
    }
    
    // Weight by tag rank (higher rank = more relevant)
    const rankWeight = clamp(tag.rank / 100, 0.3, 1);
    const adjustedWeight = tagWeight * rankWeight;
    const contribution = (affinity - 0.5) * 2;
    
    if (Math.abs(contribution) > 0.15 && tag.rank > 50) {
      matchFactors.push({
        factor: tag.name,
        type: 'tag',
        contribution: Math.abs(contribution) * rankWeight,
        direction: contribution > 0 ? 'positive' : 'negative'
      });
    }
    
    weightedSum += affinity * adjustedWeight;
    totalWeight += adjustedWeight;
    if (affinity > 0.6 && tag.rank > 60) matchCount++;
  }
  
  // 3. Popularity matching (weight: 0.15)
  const popWeight = 0.15;
  const userNicheIndex = genome.dimensions.find(d => d.name === 'nicheIndex')?.value || 0.5;
  const mediaPopularity = Math.log10(Math.max(1, media.popularity));
  const normalizedPop = clamp((mediaPopularity - 3) / 3, 0, 1); // 3 = 1k, 6 = 1M
  
  // Niche users prefer low popularity, mainstream users prefer high
  const popMatch = userNicheIndex > 0.5 
    ? 1 - normalizedPop  // Niche user: low pop = good
    : normalizedPop;     // Mainstream user: high pop = good
  
  weightedSum += popMatch * popWeight;
  totalWeight += popWeight;
  
  // 4. Community score as baseline (weight: 0.15)
  const scoreWeight = 0.15;
  const normalizedScore = clamp((media.meanScore - 50) / 50, 0, 1);
  weightedSum += normalizedScore * scoreWeight;
  totalWeight += scoreWeight;
  
  // Calculate raw predicted affinity (0-1)
  const rawAffinity = totalWeight > 0 ? weightedSum / totalWeight : 0.5;
  
  // Convert to user's rating scale
  const predictedZ = (rawAffinity - 0.5) * 2; // -1 to 1
  const predictedScore = clamp(
    userStats.mean + predictedZ * userStats.std * 1.5,
    1,
    10
  );
  
  // Calculate confidence based on data quality
  const matchingGenres = media.genres.filter(g => genreMap.has(g)).length;
  const matchingTags = media.tags.filter(t => tagMap.has(t.name) || profileTagMap.has(t.name)).length;
  const dataQuality = clamp((matchingGenres + matchingTags * 0.5) / 10, 0, 1);
  const confidence = dataQuality * 0.7 + (matchCount > 2 ? 0.3 : matchCount * 0.1);
  
  // Probability of liking (7+ rating)
  const zForSeven = (7 - userStats.mean) / userStats.std;
  const predictedZForSeven = (predictedScore - userStats.mean) / userStats.std;
  const probabilityOfLiking = clamp(
    50 + (predictedZForSeven - zForSeven) * 30,
    5,
    95
  );
  
  // Risk level based on confidence and match count
  let riskLevel: 'SAFE' | 'MODERATE' | 'EXPERIMENTAL' = 'MODERATE';
  if (confidence > 0.7 && matchCount > 3) {
    riskLevel = 'SAFE';
  } else if (confidence < 0.4 || matchCount < 1) {
    riskLevel = 'EXPERIMENTAL';
  }
  
  // Sort match factors by contribution
  matchFactors.sort((a, b) => b.contribution - a.contribution);
  
  return {
    predictedScore: Math.round(predictedScore * 10) / 10,
    confidence: Math.round(confidence * 100) / 100,
    confidenceLabel: confidence > 0.7 ? 'High' : confidence > 0.4 ? 'Medium' : 'Low',
    probabilityOfLiking: Math.round(probabilityOfLiking),
    matchFactors: matchFactors.slice(0, 5),
    riskLevel
  };
}

// ============================================
// CONTRADICTION DETECTOR
// ============================================

/**
 * A contradiction/anomaly in user's taste
 */
export interface TasteContradiction {
  mediaId: number;
  title: string;
  coverImage?: string;
  
  actualScore: number;
  expectedScore: number;
  residual: number;        // actual - expected
  residualZ: number;       // How many standard deviations off
  
  contradictionType: 'GUILTY_PLEASURE' | 'UNEXPECTED_MASTERPIECE' | 'PERSONAL_EXCEPTION' | 'CURIOUS_DROP';
  label: string;
  explanation: string;
  
  // What made this unexpected
  surprisingFactors: Array<{
    factor: string;
    expected: string;      // What we expected based on profile
    actual: string;        // What actually happened
  }>;
}

/**
 * Detect contradictions in user's taste
 * Find anime/manga that "shouldn't" fit their profile but they loved (or hated)
 */
export function detectContradictions(
  entries: MediaListEntry[],
  genome: TasteGenome,
  profile: TasteProfile,
  userStats: { mean: number; std: number }
): TasteContradiction[] {
  const contradictions: TasteContradiction[] = [];
  
  // Only analyze scored, completed/dropped entries
  const analyzable = entries.filter(e => 
    e.score && e.score >= 1 && 
    e.media &&
    (e.status === 'COMPLETED' || e.status === 'DROPPED')
  );
  
  for (const entry of analyzable) {
    const media = entry.media!;
    const actualScore = entry.score!;
    
    // Build media features
    const mediaFeatures: MediaFeatures = {
      genres: media.genres || [],
      tags: (media.tags || []).map(t => ({ name: t.name, rank: t.rank })),
      popularity: media.popularity || 10000,
      meanScore: media.meanScore || 70,
      format: media.format || 'TV',
      seasonYear: media.seasonYear,
      studios: media.studios?.edges?.filter(e => e.isMain).map(e => e.node.name)
    };
    
    // Predict what we expected them to score
    const prediction = predictEnjoyment(genome, profile, mediaFeatures, userStats);
    const expectedScore = prediction.predictedScore;
    
    // Calculate residual
    const residual = actualScore - expectedScore;
    const residualZ = residual / (userStats.std || 1.5);
    
    // Only flag significant contradictions (|z| > 1.5)
    if (Math.abs(residualZ) < 1.2) continue;
    
    // Determine contradiction type
    let contradictionType: TasteContradiction['contradictionType'];
    let label: string;
    let explanation: string;
    
    if (residual > 0 && entry.status === 'COMPLETED') {
      // They loved something they "shouldn't" have
      if (prediction.riskLevel === 'EXPERIMENTAL') {
        contradictionType = 'UNEXPECTED_MASTERPIECE';
        label = 'Unexpected Masterpiece';
        explanation = `Based on your taste profile, we expected you to rate this around ${expectedScore.toFixed(1)}, but you gave it a ${actualScore}. This is outside your usual preferences but clearly resonated with you.`;
      } else {
        contradictionType = 'GUILTY_PLEASURE';
        label = 'Guilty Pleasure';
        explanation = `You rated this ${residual.toFixed(1)} points higher than we predicted. Something about this title clicked with you beyond your typical preferences.`;
      }
    } else if (residual < 0 && entry.status === 'COMPLETED') {
      // They didn't like something they "should" have
      contradictionType = 'PERSONAL_EXCEPTION';
      label = 'Personal Exception';
      explanation = `Despite matching your taste profile well (predicted ${expectedScore.toFixed(1)}), you rated this a ${actualScore}. Something about this specific title didn't work for you.`;
    } else {
      // Dropped something that matched their taste
      contradictionType = 'CURIOUS_DROP';
      label = 'Curious Drop';
      explanation = `This matched your preferences well but you dropped it. Sometimes the execution doesn't match the concept.`;
    }
    
    // Find surprising factors
    const surprisingFactors: TasteContradiction['surprisingFactors'] = [];
    
    // Check genre expectations
    for (const genre of media.genres) {
      const genreAffinity = profile.genreAffinity.find(g => g.genre === genre);
      if (genreAffinity) {
        if (residual > 0 && genreAffinity.affinity < 40) {
          surprisingFactors.push({
            factor: genre,
            expected: `You typically dislike ${genre} (${genreAffinity.affinity.toFixed(0)}% affinity)`,
            actual: `But you loved this ${genre} title`
          });
        } else if (residual < 0 && genreAffinity.affinity > 70) {
          surprisingFactors.push({
            factor: genre,
            expected: `You typically love ${genre} (${genreAffinity.affinity.toFixed(0)}% affinity)`,
            actual: `But this ${genre} title didn't work for you`
          });
        }
      }
    }
    
    // Check tag expectations
    for (const tag of (media.tags || []).slice(0, 5)) {
      const tagAffinity = profile.tagAffinity.find(t => t.tag === tag.name);
      if (tagAffinity) {
        if (residual > 0 && tagAffinity.affinity < 30) {
          surprisingFactors.push({
            factor: tag.name,
            expected: `Low affinity for "${tag.name}" (${tagAffinity.affinity.toFixed(0)}%)`,
            actual: `But you rated this highly despite the tag`
          });
        } else if (residual < 0 && tagAffinity.affinity > 75) {
          surprisingFactors.push({
            factor: tag.name,
            expected: `High affinity for "${tag.name}" (${tagAffinity.affinity.toFixed(0)}%)`,
            actual: `But you didn't enjoy this title`
          });
        }
      }
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
      surprisingFactors: surprisingFactors.slice(0, 3)
    });
  }
  
  // Sort by absolute residual (most surprising first)
  contradictions.sort((a, b) => Math.abs(b.residualZ) - Math.abs(a.residualZ));
  
  return contradictions;
}

// ============================================
// TASTE CAUSALITY (What Shaped You)
// ============================================

/**
 * A title that significantly influenced the user's taste profile
 */
export interface TasteInfluencer {
  mediaId: number;
  title: string;
  coverImage?: string;
  
  influenceScore: number;    // 0-100 how much it shaped taste
  rank: number;              // Position in influence ranking
  
  shapedTraits: Array<{
    trait: string;           // e.g., "Psychological", "Dark", "Mecha"
    type: 'genre' | 'tag';
    contribution: number;    // How much this title pushed this trait up
  }>;
  
  engagementWeight: number;  // Based on score, completion, rewatches
  wasFormative: boolean;     // One of the first entries in their history
}

/**
 * Identify titles that shaped the user's taste the most
 * These are "origin stories" - the shows that made them who they are
 */
export function identifyTasteInfluencers(
  entries: MediaListEntry[],
  profile: TasteProfile,
  limit: number = 10
): TasteInfluencer[] {
  const influencers: TasteInfluencer[] = [];
  
  // Only analyze high-engagement completed entries
  const completed = entries.filter(e => 
    e.status === 'COMPLETED' && 
    e.media &&
    e.score && e.score >= 7 // Only positive influences
  );
  
  // Sort by completion date to identify formative entries
  const sorted = [...completed].sort((a, b) => {
    const dateA = a.completedAt?.year || a.updatedAt || 0;
    const dateB = b.completedAt?.year || b.updatedAt || 0;
    return dateA - dateB;
  });
  
  const formativeThreshold = Math.floor(sorted.length * 0.2); // First 20%
  
  // Calculate influence for each entry
  for (let i = 0; i < completed.length; i++) {
    const entry = completed[i];
    const media = entry.media!;
    const score = entry.score!;
    const repeats = entry.repeat || 0;
    
    // Base engagement weight
    const scoreWeight = (score - 5) / 5; // 0-1 for scores 5-10
    const repeatWeight = Math.min(1, repeats * 0.3);
    const engagementWeight = 0.7 * scoreWeight + 0.3 * repeatWeight;
    
    // Find original sorted index to check if formative
    const originalIndex = sorted.findIndex(e => e.media?.id === media.id);
    const wasFormative = originalIndex < formativeThreshold;
    const formativeBonus = wasFormative ? 1.3 : 1.0;
    
    // Calculate trait contributions
    const shapedTraits: TasteInfluencer['shapedTraits'] = [];
    
    // Genre contributions
    for (const genre of media.genres || []) {
      const genreAffinity = profile.genreAffinity.find(g => g.genre === genre);
      if (genreAffinity && genreAffinity.affinity > 50) {
        // This entry contributed to their genre affinity
        const contribution = engagementWeight * (genreAffinity.count > 0 ? 1 / genreAffinity.count : 0.1);
        shapedTraits.push({
          trait: genre,
          type: 'genre',
          contribution
        });
      }
    }
    
    // Tag contributions (top 5 tags only)
    for (const tag of (media.tags || []).slice(0, 5)) {
      const tagAffinity = profile.tagAffinity.find(t => t.tag === tag.name);
      if (tagAffinity && tagAffinity.affinity > 50) {
        const contribution = engagementWeight * (tag.rank / 100) * (tagAffinity.count > 0 ? 1 / tagAffinity.count : 0.1);
        shapedTraits.push({
          trait: tag.name,
          type: 'tag',
          contribution
        });
      }
    }
    
    // Total influence score
    const traitContributionSum = shapedTraits.reduce((sum, t) => sum + t.contribution, 0);
    const influenceScore = clamp(
      (engagementWeight * 40 + traitContributionSum * 30 + (wasFormative ? 20 : 0) + (repeats > 0 ? 10 : 0)) * formativeBonus,
      0,
      100
    );
    
    if (influenceScore > 10) { // Minimum threshold
      influencers.push({
        mediaId: media.id,
        title: media.title?.english || media.title?.romaji || 'Unknown',
        coverImage: media.coverImage?.large || media.coverImage?.medium,
        influenceScore: Math.round(influenceScore),
        rank: 0, // Will be set after sorting
        shapedTraits: shapedTraits.sort((a, b) => b.contribution - a.contribution).slice(0, 3),
        engagementWeight: Math.round(engagementWeight * 100) / 100,
        wasFormative
      });
    }
  }
  
  // Sort by influence and assign ranks
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

function calculateEntropy(vector: number[]): number {
  const sum = vector.reduce((a, b) => a + b, 0);
  if (sum === 0) return 0;
  
  const normalized = vector.map(v => v / sum);
  let entropy = 0;
  
  for (const p of normalized) {
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }
  
  // Normalize by max possible entropy
  const maxEntropy = Math.log2(vector.length);
  return maxEntropy > 0 ? entropy / maxEntropy : 0;
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
  identifyTasteInfluencers
};
