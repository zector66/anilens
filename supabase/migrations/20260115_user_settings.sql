-- Migration: Create user_settings table
-- Purpose: Store user preferences including content filter settings
-- Created: 2026-01-15

-- Create the user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    content_filter JSONB DEFAULT '{"hideAdult": true, "hideEcchi": false, "blurNsfwCovers": false, "includeInAnalysis": true}'::jsonb,
    display_preferences JSONB DEFAULT '{}'::jsonb,
    notification_preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_settings_updated ON user_settings;
CREATE TRIGGER trigger_user_settings_updated
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_settings_timestamp();

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read all settings" ON user_settings
    FOR SELECT
    USING (true);

CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Add comments
COMMENT ON TABLE user_settings IS 'User preferences and settings including content filters';
COMMENT ON COLUMN user_settings.user_id IS 'AniList user ID';
COMMENT ON COLUMN user_settings.content_filter IS 'Content filtering preferences (hideAdult, hideEcchi, etc.)';

-- Grant permissions
GRANT ALL ON user_settings TO authenticated;
GRANT ALL ON user_settings TO anon;
GRANT ALL ON user_settings TO service_role;
