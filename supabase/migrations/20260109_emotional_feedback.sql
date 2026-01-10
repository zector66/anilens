-- Emotional Feedback Collection Table
-- Stores anonymized feedback for improving the global emotional model
-- This data is opt-in only and contains no personally identifiable information

CREATE TABLE IF NOT EXISTS emotional_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Anonymous session identifier (not user ID)
  session_id TEXT NOT NULL,
  
  -- Media type (ANIME or MANGA)
  media_type TEXT NOT NULL CHECK (media_type IN ('ANIME', 'MANGA')),
  
  -- Model version this feedback is for
  model_version TEXT NOT NULL,
  
  -- Per-emotion feedback data (JSON)
  -- Structure: { emotion: { tooHighCount, accurateCount, tooLowCount, avgScoreWhenTooHigh, avgScoreWhenTooLow } }
  emotions_data JSONB NOT NULL DEFAULT '{}',
  
  -- Overall accuracy feedback counts
  overall_accurate INTEGER NOT NULL DEFAULT 0,
  overall_somewhat INTEGER NOT NULL DEFAULT 0,
  overall_inaccurate INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Index for efficient querying by model version
  CONSTRAINT valid_emotions_data CHECK (jsonb_typeof(emotions_data) = 'object')
);

-- Indexes for efficient aggregation queries
CREATE INDEX IF NOT EXISTS idx_emotional_feedback_model_version 
  ON emotional_feedback(model_version);

CREATE INDEX IF NOT EXISTS idx_emotional_feedback_media_type 
  ON emotional_feedback(media_type);

CREATE INDEX IF NOT EXISTS idx_emotional_feedback_created_at 
  ON emotional_feedback(created_at);

-- Aggregated feedback view for model training
-- This aggregates all feedback by model version and emotion
CREATE OR REPLACE VIEW emotional_feedback_aggregated AS
SELECT 
  model_version,
  media_type,
  COUNT(*) as total_sessions,
  SUM(overall_accurate) as total_accurate,
  SUM(overall_somewhat) as total_somewhat,
  SUM(overall_inaccurate) as total_inaccurate,
  MIN(created_at) as first_feedback_at,
  MAX(created_at) as last_feedback_at
FROM emotional_feedback
GROUP BY model_version, media_type;

-- Per-emotion aggregated view
-- Extracts and aggregates emotion-level feedback
CREATE OR REPLACE VIEW emotional_feedback_by_emotion AS
SELECT 
  model_version,
  media_type,
  emotion_key as emotion,
  SUM((emotion_data->>'tooHighCount')::integer) as too_high_count,
  SUM((emotion_data->>'accurateCount')::integer) as accurate_count,
  SUM((emotion_data->>'tooLowCount')::integer) as too_low_count,
  AVG((emotion_data->>'avgScoreWhenTooHigh')::float) as avg_score_when_too_high,
  AVG((emotion_data->>'avgScoreWhenTooLow')::float) as avg_score_when_too_low,
  COUNT(*) as sample_count
FROM emotional_feedback,
LATERAL jsonb_each(emotions_data) AS e(emotion_key, emotion_data)
GROUP BY model_version, media_type, emotion_key;

-- RLS (Row Level Security) - Enable for production
-- ALTER TABLE emotional_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow inserts (no reads/updates/deletes from client)
-- CREATE POLICY "Allow anonymous inserts" ON emotional_feedback
--   FOR INSERT WITH CHECK (true);

COMMENT ON TABLE emotional_feedback IS 'Anonymized user feedback for emotional profile calibration. Opt-in only.';
COMMENT ON COLUMN emotional_feedback.session_id IS 'Anonymous session ID, not linked to user identity';
COMMENT ON COLUMN emotional_feedback.emotions_data IS 'Per-emotion feedback counts and average scores';
