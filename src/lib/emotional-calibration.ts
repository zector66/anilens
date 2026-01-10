/**
 * Emotional Calibration System
 * 
 * Applies user feedback to adjust emotional profile scores.
 * Supports both per-user calibration (localStorage) and global model updates.
 * 
 * Calibration Philosophy:
 * - User says "too high" → reduce that emotion's displayed score
 * - User says "too low" → increase that emotion's displayed score
 * - User says "accurate" → reinforce current weight
 * 
 * The calibration is a multiplier/offset system that's easy to understand and debug.
 */

import { PrimaryEmotion, EmotionalProfile, EmotionScore } from './emotional-analyzer';
import { logger } from './logger';

// ============================================================================
// Types
// ============================================================================

export type EmotionFeedback = 'accurate' | 'too_high' | 'too_low' | null;
export type OverallFeedback = 'accurate' | 'somewhat' | 'inaccurate' | null;

export interface UserCalibration {
  /** Per-emotion adjustments: multiplier (0.5 = half, 1.5 = 1.5x) */
  emotionMultipliers: Partial<Record<PrimaryEmotion, number>>;
  /** Per-emotion offsets: added after multiplier (-0.2 to +0.2 range) */
  emotionOffsets: Partial<Record<PrimaryEmotion, number>>;
  /** Number of feedback events per emotion (for confidence) */
  feedbackCounts: Partial<Record<PrimaryEmotion, number>>;
  /** Overall calibration confidence (0-1) */
  confidence: number;
  /** Last updated timestamp */
  updatedAt: string;
  /** Model version this calibration was created against */
  modelVersion: string;
}

export interface FeedbackEvent {
  emotion: PrimaryEmotion;
  feedback: EmotionFeedback;
  currentScore: number;
  timestamp: string;
}

// ============================================================================
// Constants
// ============================================================================

const CALIBRATION_STORAGE_KEY = 'anilens_emotional_calibration';
const CURRENT_MODEL_VERSION = '1.0.0';

/** How much each feedback event adjusts the multiplier */
const LEARNING_RATE = 0.1;

/** Minimum/maximum multiplier bounds */
const MIN_MULTIPLIER = 0.3;
const MAX_MULTIPLIER = 2.0;

/** Minimum/maximum offset bounds */
const MIN_OFFSET = -0.3;
const MAX_OFFSET = 0.3;

/** How many feedback events before we're "confident" in calibration */
const CONFIDENCE_THRESHOLD = 5;

// ============================================================================
// Calibration Storage
// ============================================================================

function getStorageKey(userId: number, mediaType: string): string {
  return `${CALIBRATION_STORAGE_KEY}_${userId}_${mediaType}`;
}

export function loadCalibration(userId: number, mediaType: string): UserCalibration {
  if (typeof window === 'undefined') return createEmptyCalibration();
  
  try {
    const stored = localStorage.getItem(getStorageKey(userId, mediaType));
    if (!stored) return createEmptyCalibration();
    
    const parsed = JSON.parse(stored) as UserCalibration;
    
    // If model version changed, reset calibration (weights may have shifted)
    if (parsed.modelVersion !== CURRENT_MODEL_VERSION) {
      logger.info('[Calibration] Model version changed, resetting calibration');
      return createEmptyCalibration();
    }
    
    return parsed;
  } catch {
    return createEmptyCalibration();
  }
}

export function saveCalibration(userId: number, mediaType: string, calibration: UserCalibration): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(
      getStorageKey(userId, mediaType),
      JSON.stringify({
        ...calibration,
        updatedAt: new Date().toISOString(),
        modelVersion: CURRENT_MODEL_VERSION,
      })
    );
  } catch {
    logger.warn('[Calibration] Failed to save calibration to localStorage');
  }
}

function createEmptyCalibration(): UserCalibration {
  return {
    emotionMultipliers: {},
    emotionOffsets: {},
    feedbackCounts: {},
    confidence: 0,
    updatedAt: new Date().toISOString(),
    modelVersion: CURRENT_MODEL_VERSION,
  };
}

// ============================================================================
// Calibration Application
// ============================================================================

/**
 * Apply user calibration to an emotional profile.
 * This modifies the scores based on user feedback history.
 */
export function applyCalibration(
  profile: EmotionalProfile,
  calibration: UserCalibration
): EmotionalProfile {
  if (Object.keys(calibration.emotionMultipliers).length === 0 &&
      Object.keys(calibration.emotionOffsets).length === 0) {
    // No calibration to apply
    return profile;
  }

  const calibratedEmotions: EmotionScore[] = profile.emotions.map(emotion => {
    const multiplier = calibration.emotionMultipliers[emotion.emotion] ?? 1.0;
    const offset = calibration.emotionOffsets[emotion.emotion] ?? 0.0;
    
    // Apply calibration: score * multiplier + offset, clamped to [0, 1]
    const calibratedScore = Math.max(0, Math.min(1, emotion.score * multiplier + offset));
    
    // Recalculate intensity based on new score
    const intensity = calibratedScore >= 0.7 ? 'high' : calibratedScore >= 0.4 ? 'medium' : 'low';
    
    return {
      ...emotion,
      score: calibratedScore,
      intensity,
      // Keep the original label for now (could update based on intensity)
    };
  });

  // Re-sort by score
  calibratedEmotions.sort((a, b) => b.score - a.score);

  // Update dominant/secondary
  const dominant = calibratedEmotions[0]?.emotion || profile.dominant;
  const secondary = calibratedEmotions[1]?.emotion || profile.secondary;

  return {
    ...profile,
    emotions: calibratedEmotions,
    dominant,
    secondary,
    // Add a flag indicating calibration was applied
  };
}

// ============================================================================
// Calibration Learning
// ============================================================================

/**
 * Update calibration based on user feedback.
 * Uses a simple online learning rule.
 */
export function updateCalibration(
  currentCalibration: UserCalibration,
  feedback: FeedbackEvent
): UserCalibration {
  const { emotion, feedback: feedbackType, currentScore } = feedback;
  
  if (!feedbackType || feedbackType === 'accurate') {
    // "Accurate" feedback reinforces current calibration slightly toward neutral
    const currentMultiplier = currentCalibration.emotionMultipliers[emotion] ?? 1.0;
    const newMultiplier = currentMultiplier + (1.0 - currentMultiplier) * (LEARNING_RATE * 0.5);
    
    return {
      ...currentCalibration,
      emotionMultipliers: {
        ...currentCalibration.emotionMultipliers,
        [emotion]: newMultiplier,
      },
      feedbackCounts: {
        ...currentCalibration.feedbackCounts,
        [emotion]: (currentCalibration.feedbackCounts[emotion] ?? 0) + 1,
      },
      confidence: calculateConfidence(currentCalibration.feedbackCounts),
    };
  }

  // Calculate adjustment direction
  const direction = feedbackType === 'too_high' ? -1 : 1;
  
  // Calculate new multiplier
  const currentMultiplier = currentCalibration.emotionMultipliers[emotion] ?? 1.0;
  const multiplierDelta = direction * LEARNING_RATE * (1 + currentScore); // Larger scores get larger adjustments
  const newMultiplier = Math.max(MIN_MULTIPLIER, Math.min(MAX_MULTIPLIER, currentMultiplier + multiplierDelta));
  
  // Also apply a small offset for fine-tuning
  const currentOffset = currentCalibration.emotionOffsets[emotion] ?? 0.0;
  const offsetDelta = direction * LEARNING_RATE * 0.5;
  const newOffset = Math.max(MIN_OFFSET, Math.min(MAX_OFFSET, currentOffset + offsetDelta));
  
  const newFeedbackCounts = {
    ...currentCalibration.feedbackCounts,
    [emotion]: (currentCalibration.feedbackCounts[emotion] ?? 0) + 1,
  };

  logger.debug(`[Calibration] Updated ${emotion}: multiplier ${currentMultiplier.toFixed(2)} → ${newMultiplier.toFixed(2)}, offset ${currentOffset.toFixed(2)} → ${newOffset.toFixed(2)}`);

  return {
    ...currentCalibration,
    emotionMultipliers: {
      ...currentCalibration.emotionMultipliers,
      [emotion]: newMultiplier,
    },
    emotionOffsets: {
      ...currentCalibration.emotionOffsets,
      [emotion]: newOffset,
    },
    feedbackCounts: newFeedbackCounts,
    confidence: calculateConfidence(newFeedbackCounts),
  };
}

function calculateConfidence(feedbackCounts: Partial<Record<PrimaryEmotion, number>>): number {
  const totalFeedback = Object.values(feedbackCounts).reduce((sum, count) => sum + (count || 0), 0);
  // Confidence grows with feedback, maxes at 1.0 after CONFIDENCE_THRESHOLD * 8 (all emotions)
  return Math.min(1, totalFeedback / (CONFIDENCE_THRESHOLD * 8));
}

// ============================================================================
// Feedback Aggregation (for server upload)
// ============================================================================

export interface AggregatedFeedback {
  userId: number;
  mediaType: 'ANIME' | 'MANGA';
  modelVersion: string;
  emotions: Record<PrimaryEmotion, {
    tooHighCount: number;
    accurateCount: number;
    tooLowCount: number;
    avgScoreWhenTooHigh: number;
    avgScoreWhenTooLow: number;
  }>;
  overallAccurate: number;
  overallSomewhat: number;
  overallInaccurate: number;
  timestamp: string;
}

const FEEDBACK_HISTORY_KEY = 'anilens_feedback_history';

/**
 * Store feedback event for later aggregation and upload.
 */
export function storeFeedbackEvent(
  userId: number,
  mediaType: string,
  event: FeedbackEvent
): void {
  if (typeof window === 'undefined') return;
  
  try {
    const key = `${FEEDBACK_HISTORY_KEY}_${userId}_${mediaType}`;
    const existing = localStorage.getItem(key);
    const history: FeedbackEvent[] = existing ? JSON.parse(existing) : [];
    
    history.push(event);
    
    // Keep only last 100 events per user/mediaType
    const trimmed = history.slice(-100);
    localStorage.setItem(key, JSON.stringify(trimmed));
  } catch {
    // Storage full or unavailable
  }
}

/**
 * Get aggregated feedback ready for server upload.
 */
export function getAggregatedFeedback(
  userId: number,
  mediaType: 'ANIME' | 'MANGA'
): AggregatedFeedback | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const key = `${FEEDBACK_HISTORY_KEY}_${userId}_${mediaType}`;
    const existing = localStorage.getItem(key);
    if (!existing) return null;
    
    const history: FeedbackEvent[] = JSON.parse(existing);
    if (history.length === 0) return null;
    
    // Aggregate
    const emotions: AggregatedFeedback['emotions'] = {} as AggregatedFeedback['emotions'];
    const allEmotions: PrimaryEmotion[] = ['joy', 'trust', 'fear', 'surprise', 'sadness', 'disgust', 'anger', 'anticipation'];
    
    for (const emotion of allEmotions) {
      const emotionEvents = history.filter(e => e.emotion === emotion);
      const tooHighEvents = emotionEvents.filter(e => e.feedback === 'too_high');
      const tooLowEvents = emotionEvents.filter(e => e.feedback === 'too_low');
      const accurateEvents = emotionEvents.filter(e => e.feedback === 'accurate');
      
      emotions[emotion] = {
        tooHighCount: tooHighEvents.length,
        accurateCount: accurateEvents.length,
        tooLowCount: tooLowEvents.length,
        avgScoreWhenTooHigh: tooHighEvents.length > 0
          ? tooHighEvents.reduce((sum, e) => sum + e.currentScore, 0) / tooHighEvents.length
          : 0,
        avgScoreWhenTooLow: tooLowEvents.length > 0
          ? tooLowEvents.reduce((sum, e) => sum + e.currentScore, 0) / tooLowEvents.length
          : 0,
      };
    }
    
    return {
      userId,
      mediaType,
      modelVersion: CURRENT_MODEL_VERSION,
      emotions,
      overallAccurate: 0, // TODO: track from overall feedback
      overallSomewhat: 0,
      overallInaccurate: 0,
      timestamp: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Clear feedback history after successful upload.
 */
export function clearFeedbackHistory(userId: number, mediaType: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const key = `${FEEDBACK_HISTORY_KEY}_${userId}_${mediaType}`;
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

// ============================================================================
// Model Version Management
// ============================================================================

export function getCurrentModelVersion(): string {
  return CURRENT_MODEL_VERSION;
}

/**
 * Check if user's calibration is outdated (model version mismatch).
 */
export function isCalibrationOutdated(calibration: UserCalibration): boolean {
  return calibration.modelVersion !== CURRENT_MODEL_VERSION;
}
