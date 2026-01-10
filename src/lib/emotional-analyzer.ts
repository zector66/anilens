/**
 * Emotional Analyzer - Plutchik's 8 Emotions Model
 * 
 * Analyzes user's anime/manga list to determine emotional experience preferences
 * based on tag/genre semantics mapped to Plutchik's wheel of emotions.
 * 
 * Supports two modes:
 * - Consumption: what they watch/read (broad signal)
 * - Love: what they rate highly, favorite, rewatch (identity signal)
 * - Blend: weighted combination of both
 */

import { MediaListEntry } from '@/types/anilist';
import { logger } from './logger';

// ============================================================================
// Types
// ============================================================================

/** Plutchik's 8 primary emotions */
export type PrimaryEmotion = 
  | 'joy' 
  | 'trust' 
  | 'fear' 
  | 'surprise' 
  | 'sadness' 
  | 'disgust' 
  | 'anger' 
  | 'anticipation';

/** Intensity levels for each emotion */
export type EmotionIntensity = 'low' | 'medium' | 'high';

/** Emotion score with intensity breakdown */
export interface EmotionScore {
  emotion: PrimaryEmotion;
  score: number; // 0-1 normalized
  intensity: EmotionIntensity;
  /** Human-readable label based on intensity */
  label: string;
  /** Top contributing tags for this emotion */
  topTags: Array<{ tag: string; contribution: number }>;
  /** Top contributing titles */
  topTitles: Array<{ title: string; contribution: number }>;
}

/** Derived emotional combinations (dyads) */
export interface EmotionDyad {
  name: string;
  emotions: [PrimaryEmotion, PrimaryEmotion];
  score: number;
  description: string;
}

/** Full emotional profile */
export interface EmotionalProfile {
  /** Primary emotion scores */
  emotions: EmotionScore[];
  /** Derived dyads (emotion combinations) */
  dyads: EmotionDyad[];
  /** Dominant emotion */
  dominant: PrimaryEmotion;
  /** Secondary emotion */
  secondary: PrimaryEmotion;
  /** Overall emotional diversity (0-1) */
  diversity: number;
  /** Confidence in the profile (based on evidence) */
  confidence: number;
  /** Number of entries analyzed */
  entriesAnalyzed: number;
  /** Mode used for analysis */
  mode: 'consumption' | 'love' | 'blend';
  /** Blend ratio (only for blend mode) */
  blendRatio?: number;
}

/** Tag to emotion mapping entry */
interface TagEmotionVector {
  joy: number;
  trust: number;
  fear: number;
  surprise: number;
  sadness: number;
  disgust: number;
  anger: number;
  anticipation: number;
}

// ============================================================================
// Emotion intensity labels (Plutchik's wheel)
// ============================================================================

const EMOTION_LABELS: Record<PrimaryEmotion, { low: string; medium: string; high: string }> = {
  joy: { low: 'Serenity', medium: 'Joy', high: 'Ecstasy' },
  trust: { low: 'Acceptance', medium: 'Trust', high: 'Admiration' },
  fear: { low: 'Apprehension', medium: 'Fear', high: 'Terror' },
  surprise: { low: 'Distraction', medium: 'Surprise', high: 'Amazement' },
  sadness: { low: 'Pensiveness', medium: 'Sadness', high: 'Grief' },
  disgust: { low: 'Boredom', medium: 'Disgust', high: 'Loathing' },
  anger: { low: 'Annoyance', medium: 'Anger', high: 'Rage' },
  anticipation: { low: 'Interest', medium: 'Anticipation', high: 'Vigilance' },
};

const DYAD_DEFINITIONS: Array<{
  name: string;
  emotions: [PrimaryEmotion, PrimaryEmotion];
  description: string;
}> = [
  { name: 'Love', emotions: ['joy', 'trust'], description: 'Warmth, connection, and wholesome feelings' },
  { name: 'Optimism', emotions: ['joy', 'anticipation'], description: 'Hope, excitement for what\'s coming' },
  { name: 'Submission', emotions: ['trust', 'fear'], description: 'Vulnerability, being swept along' },
  { name: 'Awe', emotions: ['fear', 'surprise'], description: 'Wonder at something greater than yourself' },
  { name: 'Disapproval', emotions: ['surprise', 'sadness'], description: 'Unexpected loss or disappointment' },
  { name: 'Remorse', emotions: ['sadness', 'disgust'], description: 'Regret, moral weight, consequence' },
  { name: 'Contempt', emotions: ['disgust', 'anger'], description: 'Dark justice, cathartic villainy' },
  { name: 'Aggressiveness', emotions: ['anger', 'anticipation'], description: 'Drive, competition, intensity' },
];

// ============================================================================
// Tag to Emotion Mappings
// ============================================================================

/**
 * Core tag-to-emotion vectors.
 * Each tag maps to an 8-dimensional emotion vector (Plutchik's wheel).
 * Values are -1 to 1 (negative = anti-correlated, positive = correlated).
 * 
 * These are curated based on tag semantics. The system also uses
 * category-based priors for unmapped tags.
 */
const TAG_EMOTION_VECTORS: Record<string, Partial<TagEmotionVector>> = {
  // ===== JOY-HEAVY TAGS =====
  'Comedy': { joy: 0.9, trust: 0.3, anticipation: 0.4, sadness: -0.3 },
  'Slice of Life': { joy: 0.7, trust: 0.6, fear: -0.4, anger: -0.4 },
  'Iyashikei': { joy: 0.9, trust: 0.7, fear: -0.6, anger: -0.6, sadness: -0.3 },
  'Feel-Good': { joy: 0.95, trust: 0.5, sadness: -0.4 },
  'Cute Girls Doing Cute Things': { joy: 0.8, trust: 0.6 },
  'Gag Humor': { joy: 0.85, surprise: 0.5 },
  'Parody': { joy: 0.7, surprise: 0.6, disgust: 0.2 },
  'Slapstick': { joy: 0.75, surprise: 0.5 },
  
  // ===== TRUST/LOVE-HEAVY TAGS =====
  'Romance': { joy: 0.6, trust: 0.8, anticipation: 0.5, sadness: 0.2 },
  'Love Triangle': { trust: 0.5, anticipation: 0.7, sadness: 0.4, anger: 0.2 },
  'Childhood Friends': { trust: 0.8, joy: 0.5 },
  'Family Life': { trust: 0.7, joy: 0.5, sadness: 0.2 },
  'Found Family': { trust: 0.85, joy: 0.6, sadness: 0.3 },
  'Friendship': { trust: 0.8, joy: 0.6 },
  'Coming of Age': { trust: 0.5, joy: 0.4, sadness: 0.4, anticipation: 0.5 },
  'Seinen': { trust: 0.3, sadness: 0.3, anger: 0.2 },
  'Josei': { trust: 0.4, sadness: 0.3, joy: 0.3 },
  
  // ===== FEAR-HEAVY TAGS =====
  'Horror': { fear: 0.9, disgust: 0.5, surprise: 0.4, joy: -0.5 },
  'Psychological': { fear: 0.6, surprise: 0.5, trust: -0.3, anticipation: 0.4 },
  'Thriller': { fear: 0.7, anticipation: 0.7, surprise: 0.5 },
  'Survival': { fear: 0.8, anticipation: 0.6, anger: 0.3 },
  'Gore': { fear: 0.6, disgust: 0.8, anger: 0.4 },
  'Body Horror': { fear: 0.7, disgust: 0.85 },
  'Cosmic Horror': { fear: 0.85, surprise: 0.5, sadness: 0.4 },
  'Dementia': { fear: 0.7, surprise: 0.6, disgust: 0.4 },
  'Monsters': { fear: 0.6, surprise: 0.4, anticipation: 0.3 },
  'Zombies': { fear: 0.7, disgust: 0.6, surprise: 0.3 },
  
  // ===== SURPRISE-HEAVY TAGS =====
  'Mystery': { surprise: 0.8, anticipation: 0.7, fear: 0.3 },
  'Plot Twist': { surprise: 0.95, anticipation: 0.4 },
  'Mind Games': { surprise: 0.7, anticipation: 0.6, fear: 0.4 },
  'Surreal': { surprise: 0.8, fear: 0.3, disgust: 0.2 },
  'Avant Garde': { surprise: 0.85, disgust: 0.3 },
  'Meta': { surprise: 0.6, joy: 0.4 },
  'Non-linear': { surprise: 0.7, anticipation: 0.3 },
  'Time Manipulation': { surprise: 0.7, anticipation: 0.5, sadness: 0.3 },
  'Isekai': { surprise: 0.5, anticipation: 0.6, joy: 0.3 },
  
  // ===== SADNESS-HEAVY TAGS =====
  'Tragedy': { sadness: 0.95, fear: 0.3, anger: 0.2, joy: -0.4 },
  'Drama': { sadness: 0.5, trust: 0.3, joy: 0.2, anger: 0.2 },
  'Death': { sadness: 0.8, fear: 0.5 },
  'Loss': { sadness: 0.9, trust: 0.2 },
  'Terminal Illness': { sadness: 0.9, trust: 0.3, fear: 0.4 },
  'Suicide': { sadness: 0.85, fear: 0.4, anger: 0.2 },
  'War': { sadness: 0.6, anger: 0.6, fear: 0.5 },
  'Post-Apocalyptic': { sadness: 0.5, fear: 0.5, anticipation: 0.3 },
  'Dystopian': { sadness: 0.5, fear: 0.5, anger: 0.4 },
  'Melancholy': { sadness: 0.8, joy: -0.2 },
  'Bittersweet': { sadness: 0.6, joy: 0.5, trust: 0.3 },
  
  // ===== DISGUST-HEAVY TAGS =====
  'Ecchi': { disgust: 0.3, joy: 0.3, anticipation: 0.4 },
  'Hentai': { disgust: 0.4, anticipation: 0.5 },
  'Netorare': { disgust: 0.7, anger: 0.6, sadness: 0.5, trust: -0.8 },
  'Torture': { disgust: 0.8, fear: 0.6, anger: 0.5 },
  'Cannibalism': { disgust: 0.9, fear: 0.6 },
  'Dark': { disgust: 0.4, fear: 0.5, sadness: 0.4, joy: -0.4 },
  'Seinen Dark': { disgust: 0.5, fear: 0.4, anger: 0.4 },
  
  // ===== ANGER-HEAVY TAGS =====
  'Action': { anger: 0.5, anticipation: 0.7, joy: 0.3 },
  'Battle Royale': { anger: 0.7, fear: 0.6, anticipation: 0.6 },
  'Revenge': { anger: 0.9, sadness: 0.4, anticipation: 0.5 },
  'Bullying': { anger: 0.7, sadness: 0.6, disgust: 0.4 },
  'Crime': { anger: 0.5, fear: 0.4, anticipation: 0.4 },
  'Delinquents': { anger: 0.6, joy: 0.3, anticipation: 0.4 },
  'Martial Arts': { anger: 0.5, anticipation: 0.6, joy: 0.3 },
  'Military': { anger: 0.5, fear: 0.4, trust: 0.3 },
  'Shounen': { anger: 0.4, anticipation: 0.6, joy: 0.5, trust: 0.4 },
  
  // ===== ANTICIPATION-HEAVY TAGS =====
  'Adventure': { anticipation: 0.8, joy: 0.5, surprise: 0.4 },
  'Sports': { anticipation: 0.8, joy: 0.5, anger: 0.3 },
  'Competition': { anticipation: 0.85, anger: 0.4, joy: 0.4 },
  'Fantasy': { anticipation: 0.6, joy: 0.4, surprise: 0.4 },
  'Sci-Fi': { anticipation: 0.6, surprise: 0.5 },
  'Mecha': { anticipation: 0.6, anger: 0.4, joy: 0.3 },
  'Superhero': { anticipation: 0.6, joy: 0.5, anger: 0.4 },
  'Game': { anticipation: 0.7, joy: 0.4, surprise: 0.3 },
  'Card Battle': { anticipation: 0.7, joy: 0.3 },
  'Cultivation': { anticipation: 0.7, trust: 0.3 },
  'Training': { anticipation: 0.6, trust: 0.4, joy: 0.3 },
  'Tournament Arc': { anticipation: 0.85, anger: 0.5, joy: 0.4 },
  'Hype': { anticipation: 0.9, joy: 0.6, anger: 0.3 },
  
  // ===== MIXED/COMPLEX TAGS =====
  'Seinen Psychological': { fear: 0.5, sadness: 0.4, surprise: 0.5, anger: 0.3 },
  'Supernatural': { fear: 0.4, surprise: 0.5, anticipation: 0.4 },
  'Demons': { fear: 0.5, anger: 0.4, anticipation: 0.3 },
  'Vampires': { fear: 0.5, trust: 0.2, anticipation: 0.3 },
  'Magic': { joy: 0.4, anticipation: 0.5, surprise: 0.4 },
  'School': { joy: 0.4, trust: 0.4, anticipation: 0.3 },
  'Music': { joy: 0.6, anticipation: 0.5, trust: 0.3 },
  'Idol': { joy: 0.6, anticipation: 0.5, trust: 0.4 },
  'Otaku Culture': { joy: 0.5, trust: 0.3 },
};

/**
 * Genre to emotion mappings (AniList genres)
 */
const GENRE_EMOTION_VECTORS: Record<string, Partial<TagEmotionVector>> = {
  'Action': { anger: 0.5, anticipation: 0.7, joy: 0.3 },
  'Adventure': { anticipation: 0.8, joy: 0.5, surprise: 0.4 },
  'Comedy': { joy: 0.9, trust: 0.3, anticipation: 0.3 },
  'Drama': { sadness: 0.5, trust: 0.3, joy: 0.2 },
  'Ecchi': { joy: 0.3, anticipation: 0.4, disgust: 0.2 },
  'Fantasy': { anticipation: 0.6, joy: 0.4, surprise: 0.4 },
  'Horror': { fear: 0.9, disgust: 0.5, surprise: 0.4 },
  'Mahou Shoujo': { joy: 0.6, trust: 0.5, anticipation: 0.5 },
  'Mecha': { anticipation: 0.6, anger: 0.4, joy: 0.3 },
  'Music': { joy: 0.6, anticipation: 0.5, trust: 0.3 },
  'Mystery': { surprise: 0.8, anticipation: 0.7, fear: 0.3 },
  'Psychological': { fear: 0.6, surprise: 0.5, sadness: 0.3 },
  'Romance': { joy: 0.5, trust: 0.8, anticipation: 0.5 },
  'Sci-Fi': { anticipation: 0.6, surprise: 0.5, fear: 0.2 },
  'Slice of Life': { joy: 0.7, trust: 0.6, fear: -0.3 },
  'Sports': { anticipation: 0.8, joy: 0.5, anger: 0.3 },
  'Supernatural': { fear: 0.4, surprise: 0.5, anticipation: 0.4 },
  'Thriller': { fear: 0.7, anticipation: 0.7, surprise: 0.5 },
};

/**
 * Category-based priors for unmapped tags
 */
const CATEGORY_PRIORS: Record<string, Partial<TagEmotionVector>> = {
  'Theme-Horror': { fear: 0.6, disgust: 0.3 },
  'Theme-Romance': { trust: 0.5, joy: 0.4 },
  'Theme-Drama': { sadness: 0.4, trust: 0.2 },
  'Theme-Action': { anger: 0.4, anticipation: 0.5 },
  'Theme-Comedy': { joy: 0.6 },
  'Cast-Traits': { trust: 0.2 },
  'Setting-Universe': { anticipation: 0.3, surprise: 0.2 },
  'Technical': { }, // neutral
};

// ============================================================================
// Core Analysis Functions
// ============================================================================

/**
 * Get emotion vector for a tag (with fallback to category priors)
 */
function getTagEmotionVector(tagName: string, tagCategory?: string): TagEmotionVector {
  const base: TagEmotionVector = {
    joy: 0, trust: 0, fear: 0, surprise: 0,
    sadness: 0, disgust: 0, anger: 0, anticipation: 0,
  };

  // Check direct mapping first
  const direct = TAG_EMOTION_VECTORS[tagName];
  if (direct) {
    return { ...base, ...direct };
  }

  // Check genre mapping
  const genre = GENRE_EMOTION_VECTORS[tagName];
  if (genre) {
    return { ...base, ...genre };
  }

  // Fall back to category prior
  if (tagCategory) {
    const categoryKey = Object.keys(CATEGORY_PRIORS).find(k => 
      tagCategory.toLowerCase().includes(k.toLowerCase().replace('Theme-', '').replace('Cast-', '').replace('Setting-', ''))
    );
    if (categoryKey) {
      const prior = CATEGORY_PRIORS[categoryKey];
      // Apply at reduced strength (0.3x) since it's a prior
      return Object.fromEntries(
        Object.entries(base).map(([k, v]) => [k, v + (prior[k as PrimaryEmotion] || 0) * 0.3])
      ) as TagEmotionVector;
    }
  }

  return base;
}

/**
 * Calculate entry weight based on mode
 */
function calculateEntryWeight(
  entry: MediaListEntry,
  mode: 'consumption' | 'love',
  userScoreStats: { mean: number; std: number }
): number {
  const status = entry.status || '';
  const score = entry.score || 0;
  const progress = entry.progress || 0;
  const repeat = entry.repeat || 0;
  const media = entry.media;
  const total = media?.episodes || media?.chapters || 1;
  const progressRatio = Math.min(1, progress / total);

  if (mode === 'consumption') {
    // Weight by engagement level
    let statusWeight = 0.5;
    if (status === 'COMPLETED') statusWeight = 1.0;
    else if (status === 'CURRENT') statusWeight = 0.8;
    else if (status === 'REPEATING') statusWeight = 1.2;
    else if (status === 'DROPPED') statusWeight = 0.3;
    else if (status === 'PAUSED') statusWeight = 0.4;

    return statusWeight * Math.sqrt(progressRatio + 0.1);
  } else {
    // Love mode: heavily weight favorites, high scores, rewatches
    let weight = 0.1; // base

    // Score signal (z-score normalized)
    if (score > 0 && userScoreStats.std > 0) {
      const zScore = (score - userScoreStats.mean) / userScoreStats.std;
      weight += Math.max(0, zScore) * 0.5; // positive z-scores boost weight
      if (score >= 9) weight += 0.4;
      if (score === 10) weight += 0.3;
    }

    // Rewatch/reread signal
    if (repeat > 0) {
      weight += 0.3 * Math.min(repeat, 3);
    }

    // Completion matters for love
    if (status === 'COMPLETED') weight += 0.2;

    return weight;
  }
}

/**
 * Calculate user score statistics for normalization
 */
function calculateScoreStats(entries: MediaListEntry[]): { mean: number; std: number } {
  const scores = entries
    .map(e => e.score)
    .filter((s): s is number => s != null && s > 0);

  if (scores.length === 0) return { mean: 7, std: 1.5 };

  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
  const std = Math.sqrt(variance) || 1;

  return { mean, std };
}

/**
 * Get intensity level from score
 */
function getIntensity(score: number): EmotionIntensity {
  if (score >= 0.7) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
}

/**
 * Normalize emotion scores to 0-1 range
 */
function normalizeEmotions(raw: TagEmotionVector): TagEmotionVector {
  const values = Object.values(raw);
  const max = Math.max(...values.map(Math.abs), 0.001);
  
  return {
    joy: Math.max(0, raw.joy) / max,
    trust: Math.max(0, raw.trust) / max,
    fear: Math.max(0, raw.fear) / max,
    surprise: Math.max(0, raw.surprise) / max,
    sadness: Math.max(0, raw.sadness) / max,
    disgust: Math.max(0, raw.disgust) / max,
    anger: Math.max(0, raw.anger) / max,
    anticipation: Math.max(0, raw.anticipation) / max,
  };
}

// ============================================================================
// Main Analyzer Class
// ============================================================================

export class EmotionalAnalyzer {
  private static readonly SMOOTHING_K = 50; // Bayesian smoothing constant

  /**
   * Analyze emotional profile from media list
   */
  static analyze(
    entries: MediaListEntry[],
    options: {
      mode?: 'consumption' | 'love' | 'blend';
      blendRatio?: number; // 0 = pure consumption, 1 = pure love
      favoriteIds?: Set<number>;
    } = {}
  ): EmotionalProfile {
    const { mode = 'blend', blendRatio = 0.6, favoriteIds = new Set() } = options;

    if (entries.length === 0) {
      return this.emptyProfile(mode, blendRatio);
    }

    logger.debug(`[EmotionalAnalyzer] Analyzing ${entries.length} entries in ${mode} mode`);

    const scoreStats = calculateScoreStats(entries);

    // Accumulate emotion vectors with weights
    const rawEmotions: TagEmotionVector = {
      joy: 0, trust: 0, fear: 0, surprise: 0,
      sadness: 0, disgust: 0, anger: 0, anticipation: 0,
    };

    // Track tag contributions for explainability
    const tagContributions: Record<PrimaryEmotion, Map<string, number>> = {
      joy: new Map(), trust: new Map(), fear: new Map(), surprise: new Map(),
      sadness: new Map(), disgust: new Map(), anger: new Map(), anticipation: new Map(),
    };

    const titleContributions: Record<PrimaryEmotion, Map<string, number>> = {
      joy: new Map(), trust: new Map(), fear: new Map(), surprise: new Map(),
      sadness: new Map(), disgust: new Map(), anger: new Map(), anticipation: new Map(),
    };

    let totalWeight = 0;

    for (const entry of entries) {
      const media = entry.media;
      if (!media) continue;

      // Calculate weights for both modes
      const consumptionWeight = calculateEntryWeight(entry, 'consumption', scoreStats);
      const loveWeight = calculateEntryWeight(entry, 'love', scoreStats);

      // Add favorite boost
      const isFavorite = favoriteIds.has(media.id);
      const favoriteBoost = isFavorite ? 1.5 : 1.0;

      // Blend weights based on mode
      let entryWeight: number;
      if (mode === 'consumption') {
        entryWeight = consumptionWeight;
      } else if (mode === 'love') {
        entryWeight = loveWeight * favoriteBoost;
      } else {
        entryWeight = (1 - blendRatio) * consumptionWeight + blendRatio * loveWeight * favoriteBoost;
      }

      totalWeight += entryWeight;

      // Get title for attribution
      const title = media.title?.english || media.title?.romaji || 'Unknown';

      // Process genres
      if (media.genres) {
        for (const genre of media.genres) {
          const vector = getTagEmotionVector(genre);
          for (const [emotion, value] of Object.entries(vector)) {
            const contribution = value * entryWeight;
            rawEmotions[emotion as PrimaryEmotion] += contribution;

            if (Math.abs(contribution) > 0.01) {
              const e = emotion as PrimaryEmotion;
              tagContributions[e].set(genre, (tagContributions[e].get(genre) || 0) + contribution);
              titleContributions[e].set(title, (titleContributions[e].get(title) || 0) + contribution);
            }
          }
        }
      }

      // Process tags (with rank weighting)
      if (media.tags) {
        for (const tag of media.tags) {
          const tagRank = tag.rank || 50;
          const rankWeight = Math.pow(tagRank / 100, 1.5); // Higher rank = more weight
          const vector = getTagEmotionVector(tag.name, tag.category);

          for (const [emotion, value] of Object.entries(vector)) {
            const contribution = value * entryWeight * rankWeight;
            rawEmotions[emotion as PrimaryEmotion] += contribution;

            if (Math.abs(contribution) > 0.01) {
              const e = emotion as PrimaryEmotion;
              tagContributions[e].set(tag.name, (tagContributions[e].get(tag.name) || 0) + contribution);
              titleContributions[e].set(title, (titleContributions[e].get(title) || 0) + contribution);
            }
          }
        }
      }
    }

    // Normalize by total weight
    if (totalWeight > 0) {
      for (const emotion of Object.keys(rawEmotions) as PrimaryEmotion[]) {
        rawEmotions[emotion] /= totalWeight;
      }
    }

    // Apply Bayesian smoothing toward neutral
    const n = entries.length;
    const smoothingFactor = n / (n + this.SMOOTHING_K);
    for (const emotion of Object.keys(rawEmotions) as PrimaryEmotion[]) {
      rawEmotions[emotion] = rawEmotions[emotion] * smoothingFactor;
    }

    // Normalize to 0-1
    const normalized = normalizeEmotions(rawEmotions);

    // Build emotion scores with explainability
    const emotions: EmotionScore[] = (Object.keys(normalized) as PrimaryEmotion[]).map(emotion => {
      const score = normalized[emotion];
      const intensity = getIntensity(score);
      const label = EMOTION_LABELS[emotion][intensity];

      const topTags = Array.from(tagContributions[emotion].entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, contribution]) => ({ tag, contribution }));

      const topTitles = Array.from(titleContributions[emotion].entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([title, contribution]) => ({ title, contribution }));

      return { emotion, score, intensity, label, topTags, topTitles };
    }).sort((a, b) => b.score - a.score);

    // Calculate dyads
    const dyads: EmotionDyad[] = DYAD_DEFINITIONS.map(def => ({
      name: def.name,
      emotions: def.emotions,
      score: (normalized[def.emotions[0]] + normalized[def.emotions[1]]) / 2,
      description: def.description,
    })).sort((a, b) => b.score - a.score);

    // Calculate diversity (entropy-based)
    const total = Object.values(normalized).reduce((a, b) => a + b, 0) || 1;
    const probs = Object.values(normalized).map(v => v / total);
    const entropy = -probs.reduce((sum, p) => sum + (p > 0 ? p * Math.log2(p) : 0), 0);
    const maxEntropy = Math.log2(8);
    const diversity = entropy / maxEntropy;

    // Calculate confidence
    const confidence = Math.min(1, Math.sqrt(n / 100));

    return {
      emotions,
      dyads,
      dominant: emotions[0].emotion,
      secondary: emotions[1]?.emotion || emotions[0].emotion,
      diversity,
      confidence,
      entriesAnalyzed: n,
      mode,
      blendRatio: mode === 'blend' ? blendRatio : undefined,
    };
  }

  private static emptyProfile(
    mode: 'consumption' | 'love' | 'blend',
    blendRatio?: number
  ): EmotionalProfile {
    const emotions: EmotionScore[] = (Object.keys(EMOTION_LABELS) as PrimaryEmotion[]).map(emotion => ({
      emotion,
      score: 0,
      intensity: 'low' as const,
      label: EMOTION_LABELS[emotion].low,
      topTags: [],
      topTitles: [],
    }));

    return {
      emotions,
      dyads: DYAD_DEFINITIONS.map(def => ({
        name: def.name,
        emotions: def.emotions,
        score: 0,
        description: def.description,
      })),
      dominant: 'joy',
      secondary: 'trust',
      diversity: 0,
      confidence: 0,
      entriesAnalyzed: 0,
      mode,
      blendRatio,
    };
  }
}
