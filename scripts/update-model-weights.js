/**
 * Update Emotional Model Weights
 * 
 * This script reads aggregated feedback data and applies
 * regularized updates to the tag->emotion weight mappings.
 * 
 * Algorithm:
 * - For each emotion with "too high" feedback, reduce weights
 * - For each emotion with "too low" feedback, increase weights
 * - Apply regularization to prevent extreme weights
 * - Bump model version
 * 
 * Run by GitHub Actions weekly.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const LEARNING_RATE = 0.05;
const MIN_SAMPLES_FOR_UPDATE = 3;
const MIN_WEIGHT = -1.0;
const MAX_WEIGHT = 1.0;

// Paths
const FEEDBACK_PATH = path.join(__dirname, 'feedback-data.json');
const MODEL_PATH = path.join(__dirname, '..', 'src', 'lib', 'emotion-model.json');

// Default model structure
const DEFAULT_MODEL = {
  version: '1.0.0',
  updatedAt: new Date().toISOString(),
  globalAdjustments: {
    joy: 0,
    trust: 0,
    fear: 0,
    surprise: 0,
    sadness: 0,
    disgust: 0,
    anger: 0,
    anticipation: 0,
  },
  tagAdjustments: {},
  categoryAdjustments: {},
  feedbackStats: {
    totalSamples: 0,
    lastUpdateSamples: 0,
  },
};

function loadModel() {
  try {
    if (fs.existsSync(MODEL_PATH)) {
      return JSON.parse(fs.readFileSync(MODEL_PATH, 'utf-8'));
    }
  } catch (e) {
    console.log('Could not load existing model, using default');
  }
  return { ...DEFAULT_MODEL };
}

function loadFeedback() {
  try {
    if (fs.existsSync(FEEDBACK_PATH)) {
      return JSON.parse(fs.readFileSync(FEEDBACK_PATH, 'utf-8'));
    }
  } catch (e) {
    console.log('Could not load feedback data');
  }
  return { emotions: {}, overall: {} };
}

function bumpVersion(version) {
  const parts = version.split('.').map(Number);
  parts[2] = (parts[2] || 0) + 1;
  return parts.join('.');
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function updateWeights() {
  const model = loadModel();
  const feedback = loadFeedback();

  console.log('Current model version:', model.version);
  console.log('Feedback data keys:', Object.keys(feedback.emotions));

  let totalUpdates = 0;
  let totalSamples = 0;

  // Process feedback for current model version
  for (const [key, emotionFeedback] of Object.entries(feedback.emotions)) {
    // key format: "modelVersion_mediaType"
    const [modelVersion] = key.split('_');
    
    // Only process feedback for current or previous model version
    // (feedback from much older versions may not be relevant)
    
    for (const [emotion, data] of Object.entries(emotionFeedback)) {
      const { tooHighCount, tooLowCount, accurateCount, sampleCount } = data;
      
      if (sampleCount < MIN_SAMPLES_FOR_UPDATE) {
        continue;
      }

      totalSamples += sampleCount;

      // Calculate net direction: negative if too high, positive if too low
      const tooHighRatio = tooHighCount / sampleCount;
      const tooLowRatio = tooLowCount / sampleCount;
      const accurateRatio = accurateCount / sampleCount;

      // Only update if there's a clear signal (>30% in one direction)
      if (tooHighRatio > 0.3 || tooLowRatio > 0.3) {
        const direction = tooLowRatio - tooHighRatio; // positive = increase, negative = decrease
        const confidence = 1 - accurateRatio; // more accurate = less update needed
        
        const adjustment = direction * LEARNING_RATE * confidence * Math.sqrt(sampleCount);
        
        const currentAdjustment = model.globalAdjustments[emotion] || 0;
        const newAdjustment = clamp(currentAdjustment + adjustment, MIN_WEIGHT * 0.3, MAX_WEIGHT * 0.3);
        
        model.globalAdjustments[emotion] = newAdjustment;
        totalUpdates++;
        
        console.log(`  ${emotion}: ${currentAdjustment.toFixed(3)} -> ${newAdjustment.toFixed(3)} (samples: ${sampleCount}, tooHigh: ${(tooHighRatio * 100).toFixed(1)}%, tooLow: ${(tooLowRatio * 100).toFixed(1)}%)`);
      }
    }
  }

  // Update model metadata
  if (totalUpdates > 0) {
    model.version = bumpVersion(model.version);
    model.updatedAt = new Date().toISOString();
    model.feedbackStats = {
      totalSamples: (model.feedbackStats?.totalSamples || 0) + totalSamples,
      lastUpdateSamples: totalSamples,
    };

    console.log(`\nApplied ${totalUpdates} weight updates from ${totalSamples} samples`);
    console.log(`New model version: ${model.version}`);
  } else {
    console.log('\nNo significant updates needed');
  }

  // Write updated model
  fs.writeFileSync(MODEL_PATH, JSON.stringify(model, null, 2));
  console.log(`Model written to ${MODEL_PATH}`);
}

updateWeights();
