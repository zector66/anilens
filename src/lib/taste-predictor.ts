/**
 * Taste Predictor Orchestrator
 * 
 * Combines the rule-based genome predictor with learned per-user weights.
 * Handles the full flow: predict → blend with ML → optionally log residual.
 */

import { predictEnjoyment, extractPredictionFeatures, predictWithLearnedWeights } from './taste-genome';
import type { TasteGenome, MediaFeatures, EnjoymentPrediction } from './taste-genome';
import type { TasteProfile } from '@/types/anilist';
import { getUserModelWeights, getGlobalModelWeights, getCommunityScoreForMedia, logPredictionResidual } from './db';

export interface PredictorOptions {
  userId: number;
  anilistMediaId: number;
  mediaType: 'ANIME' | 'MANGA';
  genome: TasteGenome;
  profile: TasteProfile;
  media: MediaFeatures;
  userStats: { mean: number; std: number };
  logPrediction?: boolean; // Whether to store this prediction for future training
}

export interface PredictorResult {
  prediction: EnjoymentPrediction;
  features: Record<string, number>;
  modelSource: 'user' | 'global' | 'rule';
}

/**
 * Predict enjoyment with three-tier fallback:
 * 1. Per-user model (15+ samples) — 60% learned, 40% rule-based
 * 2. Global model (cold start) — 40% global, 60% rule-based
 * 3. Pure rule-based (no data yet)
 */
export async function predictWithLearning(
  options: PredictorOptions
): Promise<PredictorResult> {
  const { userId, anilistMediaId, mediaType, genome, profile, media, userStats, logPrediction = true } = options;

  // Step 1: Rule-based base prediction
  const basePrediction = predictEnjoyment(genome, profile, media, userStats);

  // Step 2: Extract features
  const features = extractPredictionFeatures(basePrediction, userStats);

  // Step 3: Check for per-user learned weights
  const learned = await getUserModelWeights(userId, mediaType, genome.version || 'v3');

  let prediction: EnjoymentPrediction;
  let modelSource: 'user' | 'global' | 'rule' = 'rule';

  if (learned && learned.weights_json && learned.sample_count >= 15) {
    const weights = typeof learned.weights_json === 'string'
      ? JSON.parse(learned.weights_json)
      : learned.weights_json;
    const featureNames = typeof learned.feature_names === 'string'
      ? JSON.parse(learned.feature_names)
      : learned.feature_names;

    prediction = predictWithLearnedWeights(
      basePrediction,
      features,
      weights,
      learned.bias,
      featureNames,
      0.6 // 60% learned, 40% rule-based
    );
    modelSource = 'user';
  } else {
    // Step 4: Fallback to global model for cold-start users
    const global = await getGlobalModelWeights(mediaType, genome.version || 'v3');

    if (global && global.weights_json && global.sample_count >= 100) {
      const weights = typeof global.weights_json === 'string'
        ? JSON.parse(global.weights_json)
        : global.weights_json;
      const featureNames = typeof global.feature_names === 'string'
        ? JSON.parse(global.feature_names)
        : global.feature_names;

      prediction = predictWithLearnedWeights(
        basePrediction,
        features,
        weights,
        global.bias,
        featureNames,
        0.4 // 40% global, 60% rule-based (lighter touch for crowd wisdom)
      );
      modelSource = 'global';
    } else {
      prediction = basePrediction;
    }
  }

  // Step 5: Blend collaborative signal (community score) if available
  const community = await getCommunityScoreForMedia(anilistMediaId, mediaType);
  if (community && community.count >= 3) {
    const collaborativeWeight = Math.min(0.15, community.count / 100); // 3 ratings = 3%, 15+ ratings = 15%
    const contentWeight = 1 - collaborativeWeight;
    const blended = prediction.predictedScore * contentWeight + community.mean * collaborativeWeight;
    const delta = blended - prediction.predictedScore;
    prediction = {
      ...prediction,
      predictedScore: Math.round(blended * 10) / 10,
      expectedRange: {
        low: Math.max(1, Math.round((prediction.expectedRange.low + delta) * 10) / 10),
        high: Math.min(10, Math.round((prediction.expectedRange.high + delta) * 10) / 10),
      },
    };
  }

  // Step 6: Log prediction for future training (fire and forget)
  if (logPrediction) {
    try {
      await logPredictionResidual(
        userId,
        anilistMediaId,
        mediaType,
        prediction.predictedScore,
        null,
        features,
        genome.version || 'v3'
      );
    } catch {
      // Silent fail
    }
  }

  return {
    prediction,
    features,
    modelSource,
  };
}

/**
 * Quick predict without logging — for cases where we just need a score.
 */
export async function predictQuick(
  userId: number,
  anilistMediaId: number,
  mediaType: 'ANIME' | 'MANGA',
  genome: TasteGenome,
  profile: TasteProfile,
  media: MediaFeatures,
  userStats: { mean: number; std: number }
): Promise<EnjoymentPrediction> {
  const result = await predictWithLearning({
    userId,
    anilistMediaId,
    mediaType,
    genome,
    profile,
    media,
    userStats,
    logPrediction: false,
  });
  return result.prediction;
}
