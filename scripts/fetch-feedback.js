/**
 * Fetch Feedback from Supabase
 * 
 * This script fetches aggregated feedback data from Supabase
 * and writes it to a local JSON file for model training.
 * 
 * Run by GitHub Actions weekly.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function fetchFeedback() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.log('Supabase not configured, skipping feedback fetch');
    // Write empty feedback file
    fs.writeFileSync(
      path.join(__dirname, 'feedback-data.json'),
      JSON.stringify({ emotions: {}, overall: {}, fetchedAt: new Date().toISOString() }, null, 2)
    );
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  console.log('Fetching aggregated feedback from Supabase...');

  // Fetch per-emotion aggregated feedback
  const { data: emotionData, error: emotionError } = await supabase
    .from('emotional_feedback_by_emotion')
    .select('*');

  if (emotionError) {
    console.error('Error fetching emotion feedback:', emotionError);
    process.exit(1);
  }

  // Fetch overall aggregated feedback
  const { data: overallData, error: overallError } = await supabase
    .from('emotional_feedback_aggregated')
    .select('*');

  if (overallError) {
    console.error('Error fetching overall feedback:', overallError);
    process.exit(1);
  }

  // Structure the data
  const feedbackData = {
    emotions: {},
    overall: {},
    fetchedAt: new Date().toISOString(),
  };

  // Process emotion-level feedback
  for (const row of emotionData || []) {
    const key = `${row.model_version}_${row.media_type}`;
    if (!feedbackData.emotions[key]) {
      feedbackData.emotions[key] = {};
    }
    feedbackData.emotions[key][row.emotion] = {
      tooHighCount: row.too_high_count || 0,
      accurateCount: row.accurate_count || 0,
      tooLowCount: row.too_low_count || 0,
      avgScoreWhenTooHigh: row.avg_score_when_too_high || 0,
      avgScoreWhenTooLow: row.avg_score_when_too_low || 0,
      sampleCount: row.sample_count || 0,
    };
  }

  // Process overall feedback
  for (const row of overallData || []) {
    const key = `${row.model_version}_${row.media_type}`;
    feedbackData.overall[key] = {
      totalSessions: row.total_sessions || 0,
      totalAccurate: row.total_accurate || 0,
      totalSomewhat: row.total_somewhat || 0,
      totalInaccurate: row.total_inaccurate || 0,
      firstFeedbackAt: row.first_feedback_at,
      lastFeedbackAt: row.last_feedback_at,
    };
  }

  // Write to file
  const outputPath = path.join(__dirname, 'feedback-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(feedbackData, null, 2));
  console.log(`Feedback data written to ${outputPath}`);
  console.log(`- ${Object.keys(feedbackData.emotions).length} model/media type combinations`);
  console.log(`- ${Object.keys(feedbackData.overall).length} overall feedback records`);
}

fetchFeedback().catch(console.error);
