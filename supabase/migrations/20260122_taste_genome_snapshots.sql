-- Taste Genome Snapshots
-- Stores periodic snapshots of user taste genomes for drift analysis

CREATE TABLE IF NOT EXISTS taste_genome_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  anilist_id INTEGER NOT NULL,
  media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('ANIME', 'MANGA')),
  
  -- Genome data
  vector JSONB NOT NULL,                    -- The full genome vector (array of numbers)
  tag_buckets JSONB,                        -- 64 hash buckets for long-tail tags
  dominant_traits JSONB NOT NULL,           -- Top 3 defining traits
  
  -- Summary stats for quick comparison
  entropy DECIMAL(5,4) NOT NULL,
  uniqueness_score DECIMAL(5,4) NOT NULL,
  
  -- Key dimension values for trend display (avoid parsing full vector)
  dim_summary JSONB NOT NULL,               -- { "Action": 0.8, "Drama": 0.6, "nicheIndex": 0.7, ... }
  
  -- Metadata
  genome_version VARCHAR(10) NOT NULL,      -- e.g., "2.0"
  list_hash VARCHAR(64),                    -- Hash of user's list for cache invalidation
  entry_count INTEGER,                      -- How many entries in user's list
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Index for fast lookups
  CONSTRAINT unique_snapshot UNIQUE (anilist_id, media_type, created_at)
);

-- Indexes
CREATE INDEX idx_genome_snapshots_user ON taste_genome_snapshots (anilist_id, media_type);
CREATE INDEX idx_genome_snapshots_created ON taste_genome_snapshots (created_at DESC);
CREATE INDEX idx_genome_snapshots_user_time ON taste_genome_snapshots (anilist_id, media_type, created_at DESC);

-- Function to get latest snapshot for a user
CREATE OR REPLACE FUNCTION get_latest_genome_snapshot(
  p_anilist_id INTEGER,
  p_media_type VARCHAR(10)
)
RETURNS taste_genome_snapshots AS $$
BEGIN
  RETURN (
    SELECT *
    FROM taste_genome_snapshots
    WHERE anilist_id = p_anilist_id
      AND media_type = p_media_type
    ORDER BY created_at DESC
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get genome history for drift analysis
CREATE OR REPLACE FUNCTION get_genome_history(
  p_anilist_id INTEGER,
  p_media_type VARCHAR(10),
  p_limit INTEGER DEFAULT 12
)
RETURNS SETOF taste_genome_snapshots AS $$
BEGIN
  RETURN QUERY
    SELECT *
    FROM taste_genome_snapshots
    WHERE anilist_id = p_anilist_id
      AND media_type = p_media_type
    ORDER BY created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate drift between two snapshots
CREATE OR REPLACE FUNCTION calculate_genome_drift(
  p_anilist_id INTEGER,
  p_media_type VARCHAR(10)
)
RETURNS TABLE (
  dimension_name TEXT,
  old_value DECIMAL,
  new_value DECIMAL,
  delta DECIMAL,
  direction TEXT
) AS $$
DECLARE
  v_latest taste_genome_snapshots;
  v_previous taste_genome_snapshots;
BEGIN
  -- Get two most recent snapshots
  SELECT * INTO v_latest
  FROM taste_genome_snapshots
  WHERE anilist_id = p_anilist_id AND media_type = p_media_type
  ORDER BY created_at DESC LIMIT 1;
  
  SELECT * INTO v_previous
  FROM taste_genome_snapshots
  WHERE anilist_id = p_anilist_id AND media_type = p_media_type
  ORDER BY created_at DESC LIMIT 1 OFFSET 1;
  
  IF v_previous IS NULL THEN
    RETURN;
  END IF;
  
  -- Compare dimensions and return significant changes
  RETURN QUERY
    SELECT 
      key::TEXT as dimension_name,
      (v_previous.dim_summary->>key)::DECIMAL as old_value,
      (v_latest.dim_summary->>key)::DECIMAL as new_value,
      ((v_latest.dim_summary->>key)::DECIMAL - (v_previous.dim_summary->>key)::DECIMAL) as delta,
      CASE 
        WHEN (v_latest.dim_summary->>key)::DECIMAL > (v_previous.dim_summary->>key)::DECIMAL THEN 'up'
        WHEN (v_latest.dim_summary->>key)::DECIMAL < (v_previous.dim_summary->>key)::DECIMAL THEN 'down'
        ELSE 'stable'
      END as direction
    FROM jsonb_object_keys(v_latest.dim_summary) as key
    WHERE ABS((v_latest.dim_summary->>key)::DECIMAL - COALESCE((v_previous.dim_summary->>key)::DECIMAL, 0)) > 0.05
    ORDER BY ABS((v_latest.dim_summary->>key)::DECIMAL - COALESCE((v_previous.dim_summary->>key)::DECIMAL, 0)) DESC;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE taste_genome_snapshots ENABLE ROW LEVEL SECURITY;

-- Users can read their own snapshots
CREATE POLICY "Users can read own genome snapshots"
  ON taste_genome_snapshots FOR SELECT
  USING (true); -- Public read for now (snapshots don't contain sensitive data)

-- Only authenticated users can insert their own snapshots
CREATE POLICY "Users can insert own genome snapshots"
  ON taste_genome_snapshots FOR INSERT
  WITH CHECK (true); -- Will be called from server-side

-- Cleanup: Keep max 24 snapshots per user per type (2 years of monthly snapshots)
CREATE OR REPLACE FUNCTION cleanup_old_genome_snapshots()
RETURNS void AS $$
BEGIN
  DELETE FROM taste_genome_snapshots
  WHERE id IN (
    SELECT id FROM (
      SELECT id, 
             ROW_NUMBER() OVER (PARTITION BY anilist_id, media_type ORDER BY created_at DESC) as rn
      FROM taste_genome_snapshots
    ) ranked
    WHERE rn > 24
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE taste_genome_snapshots IS 'Stores periodic snapshots of user taste genomes for drift/evolution analysis';
