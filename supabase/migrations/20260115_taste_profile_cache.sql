-- Migration: Create taste_profile_cache table
-- Purpose: Persistent caching for computed taste profiles
-- Created: 2026-01-15

-- Create the taste_profile_cache table
CREATE TABLE IF NOT EXISTS taste_profile_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('ANIME', 'MANGA')),
    time_window VARCHAR(20) NOT NULL DEFAULT 'all' CHECK (time_window IN ('all', '12months', '90days')),
    included_statuses TEXT[] DEFAULT ARRAY['COMPLETED', 'CURRENT', 'DROPPED', 'PAUSED', 'REPEATING'],
    list_hash VARCHAR(500) NOT NULL,
    profile JSONB NOT NULL,
    analysis_version VARCHAR(20) NOT NULL,
    data_completeness JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Composite unique constraint for cache key
    CONSTRAINT unique_user_type_window UNIQUE (user_id, type, time_window)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_taste_cache_user_id ON taste_profile_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_taste_cache_user_type ON taste_profile_cache(user_id, type);
CREATE INDEX IF NOT EXISTS idx_taste_cache_list_hash ON taste_profile_cache(list_hash);
CREATE INDEX IF NOT EXISTS idx_taste_cache_created_at ON taste_profile_cache(created_at);

-- Create a function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_taste_cache_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update timestamp
DROP TRIGGER IF EXISTS trigger_taste_cache_updated ON taste_profile_cache;
CREATE TRIGGER trigger_taste_cache_updated
    BEFORE UPDATE ON taste_profile_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_taste_cache_timestamp();

-- Enable Row Level Security
ALTER TABLE taste_profile_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow users to read their own cache entries
CREATE POLICY "Users can read own cache" ON taste_profile_cache
    FOR SELECT
    USING (true); -- Allow all reads for now (cache is public-ish)

-- Allow inserts and updates
CREATE POLICY "Allow cache upserts" ON taste_profile_cache
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE taste_profile_cache IS 'Persistent cache for computed taste profiles to avoid expensive recalculations';
COMMENT ON COLUMN taste_profile_cache.user_id IS 'AniList user ID';
COMMENT ON COLUMN taste_profile_cache.type IS 'Media type: ANIME or MANGA';
COMMENT ON COLUMN taste_profile_cache.time_window IS 'Time filter applied: all, 12months, 90days';
COMMENT ON COLUMN taste_profile_cache.list_hash IS 'Hash of the user list for invalidation';
COMMENT ON COLUMN taste_profile_cache.profile IS 'Full computed TasteProfile as JSON';
COMMENT ON COLUMN taste_profile_cache.analysis_version IS 'Version of the analysis algorithm';
COMMENT ON COLUMN taste_profile_cache.data_completeness IS 'Flags for data quality and completeness';

-- Grant permissions
GRANT ALL ON taste_profile_cache TO authenticated;
GRANT ALL ON taste_profile_cache TO anon;
GRANT ALL ON taste_profile_cache TO service_role;
