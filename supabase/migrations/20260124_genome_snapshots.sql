-- Genome Snapshots Table for Persistent Cache + History
-- Purpose: Store computed trait profiles for instant load + taste evolution timeline

CREATE TABLE IF NOT EXISTS genome_snapshots (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User identification
  user_anilist_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('ANIME', 'MANGA')),
  
  -- Temporal bucketing
  snapshot_month DATE NOT NULL, -- Month bucket for timeline (YYYY-MM-01)
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Versioning (critical for invalidation)
  genome_version TEXT NOT NULL DEFAULT '3.0',
  trait_system_version TEXT NOT NULL, -- Invalidate when mappings change
  
  -- Metadata
  sample_size INTEGER NOT NULL, -- Number of entries analyzed
  rating_signal_strength FLOAT, -- Avg rating variance
  warnings JSONB DEFAULT '[]'::jsonb, -- Any computation warnings
  
  -- Payload: UI-ready data (JSONB for flexibility)
  top_traits_by_channel JSONB NOT NULL, -- Top 10 per channel
  derived_indices JSONB NOT NULL, -- Computed indices
  taste_types JSONB, -- "You have a type" results
  contradictions JSONB, -- Detected contradictions
  what_shaped_me JSONB, -- Final computed influences with reasons
  
  -- Constraints
  CONSTRAINT unique_snapshot_per_month 
    UNIQUE (user_anilist_id, media_type, snapshot_month)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_genome_snapshots_user_media 
  ON genome_snapshots(user_anilist_id, media_type);

CREATE INDEX IF NOT EXISTS idx_genome_snapshots_generated_at 
  ON genome_snapshots(generated_at DESC);

-- Optional: Latest cache table for instant load (1 row per user per type)
CREATE TABLE IF NOT EXISTS genome_cache_latest (
  -- Composite primary key
  user_anilist_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('ANIME', 'MANGA')),
  
  -- Metadata
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  genome_version TEXT NOT NULL DEFAULT '3.0',
  trait_system_version TEXT NOT NULL,
  sample_size INTEGER NOT NULL,
  
  -- Full payload (same as snapshots)
  payload JSONB NOT NULL,
  
  -- Primary key
  PRIMARY KEY (user_anilist_id, media_type)
);

-- Index for version checks
CREATE INDEX IF NOT EXISTS idx_genome_cache_version 
  ON genome_cache_latest(trait_system_version);

-- Comments for documentation
COMMENT ON TABLE genome_snapshots IS 'Persistent cache + timeline history for trait profiles. Never required for UI to function.';
COMMENT ON TABLE genome_cache_latest IS 'Latest snapshot per user for instant load. Optional acceleration only.';
COMMENT ON COLUMN genome_snapshots.trait_system_version IS 'Invalidate snapshot if this does not match current version';
COMMENT ON COLUMN genome_snapshots.what_shaped_me IS 'Final computed influences with mediaId, title, influenceScore, driverTraits, reasons';
