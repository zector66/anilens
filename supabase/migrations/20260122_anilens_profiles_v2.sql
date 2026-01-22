-- Migration: Create AniLens profile system
-- Purpose: Core user profiles, game stats, and achievements separate from AniList
-- Created: 2026-01-22
-- Version: 2 (Fixed column reference errors)

-- ============================================
-- 1. DROP EXISTING OBJECTS IF THEY EXIST
-- ============================================
DROP TABLE IF EXISTS user_studio_templates CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS user_game_stats CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP FUNCTION IF EXISTS upsert_user_on_login CASCADE;
DROP FUNCTION IF EXISTS update_game_stats CASCADE;

-- ============================================
-- 2. CORE USERS TABLE (AniLens Identity Layer)
-- ============================================
CREATE TABLE users (
    anilist_id INTEGER PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    banner_url TEXT,
    
    -- Profile metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    
    -- Computed taste data (quick access)
    anime_archetype VARCHAR(100),
    manga_archetype VARCHAR(100),
    taste_title VARCHAR(255),
    
    -- Flags
    is_public BOOLEAN DEFAULT true,
    adult_content_enabled BOOLEAN DEFAULT false,
    
    -- Stats cache for quick display
    total_anime INTEGER DEFAULT 0,
    total_manga INTEGER DEFAULT 0,
    total_games_played INTEGER DEFAULT 0,
    
    -- Timestamps
    profile_updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. USER GAME STATS TABLE
-- ============================================
CREATE TABLE user_game_stats (
    anilist_id INTEGER PRIMARY KEY REFERENCES users(anilist_id) ON DELETE CASCADE,
    
    -- Overall stats
    total_games_played INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    total_wrong INTEGER DEFAULT 0,
    accuracy_rate DECIMAL DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_played_at TIMESTAMPTZ,
    
    -- Daily challenge stats
    daily_challenges_completed INTEGER DEFAULT 0,
    daily_current_streak INTEGER DEFAULT 0,
    daily_longest_streak INTEGER DEFAULT 0,
    last_daily_completed_at DATE,
    
    -- Per-game-type stats (JSONB for flexibility)
    game_type_stats JSONB DEFAULT '{}'::jsonb,
    
    -- Multiplayer stats
    multiplayer_wins INTEGER DEFAULT 0,
    multiplayer_losses INTEGER DEFAULT 0,
    multiplayer_draws INTEGER DEFAULT 0,
    mmr INTEGER DEFAULT 1000,
    peak_mmr INTEGER DEFAULT 1000,
    
    -- Bracket stats
    brackets_completed INTEGER DEFAULT 0,
    bracket_champions JSONB DEFAULT '[]'::jsonb
);

-- ============================================
-- 4. USER ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anilist_id INTEGER REFERENCES users(anilist_id) ON DELETE CASCADE,
    
    -- Achievement details
    achievement_id VARCHAR(100) NOT NULL,
    achievement_name VARCHAR(255) NOT NULL,
    achievement_description TEXT,
    achievement_icon VARCHAR(100),
    achievement_tier VARCHAR(20) DEFAULT 'bronze' CHECK (achievement_tier IN ('bronze', 'silver', 'gold', 'platinum')),
    
    -- Progress tracking
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    progress INTEGER DEFAULT 0,
    progress_max INTEGER DEFAULT 1,
    is_completed BOOLEAN DEFAULT false,
    
    -- Unique constraint
    UNIQUE(anilist_id, achievement_id)
);

-- ============================================
-- 5. USER STUDIO TEMPLATES TABLE
-- ============================================
CREATE TABLE user_studio_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anilist_id INTEGER REFERENCES users(anilist_id) ON DELETE CASCADE,
    
    -- Template metadata
    template_name VARCHAR(255) NOT NULL,
    template_description TEXT,
    is_public BOOLEAN DEFAULT false,
    
    -- Template data
    snapshot_data JSONB NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. CREATE INDEXES
-- ============================================
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_last_seen ON users(last_seen);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_game_stats_mmr ON user_game_stats(mmr DESC);
CREATE INDEX idx_game_stats_accuracy ON user_game_stats(accuracy_rate DESC);
CREATE INDEX idx_game_stats_daily_streak ON user_game_stats(daily_current_streak DESC);

CREATE INDEX idx_achievements_anilist_id ON user_achievements(anilist_id);
CREATE INDEX idx_achievements_earned_at ON user_achievements(earned_at DESC);

CREATE INDEX idx_templates_anilist_id ON user_studio_templates(anilist_id);
CREATE INDEX idx_templates_public ON user_studio_templates(is_public) WHERE is_public = true;

-- ============================================
-- 7. TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON user_studio_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. ROW LEVEL SECURITY POLICIES
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_studio_templates ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users profiles are publicly readable" ON users
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete own profile" ON users
    FOR DELETE USING (true);

-- Game stats policies
CREATE POLICY "Game stats are publicly readable" ON user_game_stats
    FOR SELECT USING (true);

CREATE POLICY "Users can insert game stats" ON user_game_stats
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update game stats" ON user_game_stats
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete game stats" ON user_game_stats
    FOR DELETE USING (true);

-- Achievements policies
CREATE POLICY "Achievements are publicly readable" ON user_achievements
    FOR SELECT USING (true);

CREATE POLICY "Users can insert achievements" ON user_achievements
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update achievements" ON user_achievements
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete achievements" ON user_achievements
    FOR DELETE USING (true);

-- Studio templates policies
CREATE POLICY "Public templates are readable" ON user_studio_templates
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert templates" ON user_studio_templates
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update templates" ON user_studio_templates
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete templates" ON user_studio_templates
    FOR DELETE USING (true);

-- ============================================
-- 9. HELPER FUNCTIONS
-- ============================================

-- Function to upsert user on login
CREATE OR REPLACE FUNCTION upsert_user_on_login(
    p_anilist_id INTEGER,
    p_username VARCHAR(255),
    p_avatar_url TEXT DEFAULT NULL,
    p_banner_url TEXT DEFAULT NULL,
    p_total_anime INTEGER DEFAULT 0,
    p_total_manga INTEGER DEFAULT 0
)
RETURNS TABLE (
    anilist_id INTEGER,
    username VARCHAR(255),
    avatar_url TEXT,
    banner_url TEXT,
    created_at TIMESTAMPTZ,
    last_seen TIMESTAMPTZ,
    anime_archetype VARCHAR(100),
    manga_archetype VARCHAR(100),
    taste_title VARCHAR(255),
    is_public BOOLEAN,
    adult_content_enabled BOOLEAN,
    total_anime INTEGER,
    total_manga INTEGER,
    total_games_played INTEGER,
    profile_updated_at TIMESTAMPTZ
) AS $$
BEGIN
    INSERT INTO users (anilist_id, username, avatar_url, banner_url, total_anime, total_manga, last_seen)
    VALUES (p_anilist_id, p_username, p_avatar_url, p_banner_url, p_total_anime, p_total_manga, NOW())
    ON CONFLICT (anilist_id) DO UPDATE SET
        username = EXCLUDED.username,
        avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
        banner_url = COALESCE(EXCLUDED.banner_url, users.banner_url),
        total_anime = EXCLUDED.total_anime,
        total_manga = EXCLUDED.total_manga,
        last_seen = NOW();
    
    -- Also ensure game stats row exists
    INSERT INTO user_game_stats (anilist_id)
    VALUES (p_anilist_id)
    ON CONFLICT (anilist_id) DO NOTHING;
    
    -- Return the user record
    RETURN QUERY SELECT * FROM users WHERE users.anilist_id = p_anilist_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update game stats after a game
CREATE OR REPLACE FUNCTION update_game_stats(
    p_anilist_id INTEGER,
    p_game_type VARCHAR(50),
    p_correct INTEGER,
    p_wrong INTEGER,
    p_is_daily BOOLEAN DEFAULT false
)
RETURNS TABLE (
    anilist_id INTEGER,
    total_games_played INTEGER,
    total_correct INTEGER,
    total_wrong INTEGER,
    accuracy_rate DECIMAL,
    current_streak INTEGER,
    longest_streak INTEGER,
    last_played_at TIMESTAMPTZ,
    daily_challenges_completed INTEGER,
    daily_current_streak INTEGER,
    daily_longest_streak INTEGER,
    last_daily_completed_at DATE,
    game_type_stats JSONB,
    multiplayer_wins INTEGER,
    multiplayer_losses INTEGER,
    multiplayer_draws INTEGER,
    mmr INTEGER,
    peak_mmr INTEGER,
    brackets_completed INTEGER,
    bracket_champions JSONB
) AS $$
DECLARE
    current_game_stats JSONB;
    new_game_stats JSONB;
BEGIN
    -- Get current game type stats
    SELECT ugs.game_type_stats INTO current_game_stats
    FROM user_game_stats ugs WHERE ugs.anilist_id = p_anilist_id;
    
    -- Update game type stats
    new_game_stats = COALESCE(current_game_stats, '{}'::jsonb);
    new_game_stats = jsonb_set(
        new_game_stats,
        ARRAY[p_game_type],
        jsonb_build_object(
            'played', COALESCE((new_game_stats->p_game_type->>'played')::integer, 0) + 1,
            'correct', COALESCE((new_game_stats->p_game_type->>'correct')::integer, 0) + p_correct,
            'wrong', COALESCE((new_game_stats->p_game_type->>'wrong')::integer, 0) + p_wrong
        )
    );
    
    UPDATE user_game_stats ugs SET
        total_games_played = ugs.total_games_played + 1,
        total_correct = ugs.total_correct + p_correct,
        total_wrong = ugs.total_wrong + p_wrong,
        accuracy_rate = CASE 
            WHEN (ugs.total_correct + ugs.total_wrong + p_correct + p_wrong) > 0 
            THEN ((ugs.total_correct + p_correct)::decimal / (ugs.total_correct + ugs.total_wrong + p_correct + p_wrong)::decimal) * 100
            ELSE 0 
        END,
        current_streak = CASE WHEN p_wrong = 0 THEN ugs.current_streak + p_correct ELSE 0 END,
        longest_streak = GREATEST(ugs.longest_streak, CASE WHEN p_wrong = 0 THEN ugs.current_streak + p_correct ELSE ugs.current_streak END),
        last_played_at = NOW(),
        game_type_stats = new_game_stats,
        daily_challenges_completed = CASE WHEN p_is_daily THEN ugs.daily_challenges_completed + 1 ELSE ugs.daily_challenges_completed END,
        daily_current_streak = CASE 
            WHEN p_is_daily AND (ugs.last_daily_completed_at IS NULL OR ugs.last_daily_completed_at = CURRENT_DATE - 1) 
            THEN ugs.daily_current_streak + 1 
            WHEN p_is_daily AND ugs.last_daily_completed_at < CURRENT_DATE - 1
            THEN 1
            ELSE ugs.daily_current_streak 
        END,
        daily_longest_streak = CASE 
            WHEN p_is_daily 
            THEN GREATEST(ugs.daily_longest_streak, ugs.daily_current_streak + 1)
            ELSE ugs.daily_longest_streak 
        END,
        last_daily_completed_at = CASE WHEN p_is_daily THEN CURRENT_DATE ELSE ugs.last_daily_completed_at END
    WHERE ugs.anilist_id = p_anilist_id;
    
    -- Update users table total games
    UPDATE users u SET total_games_played = (SELECT ugs.total_games_played FROM user_game_stats ugs WHERE ugs.anilist_id = p_anilist_id)
    WHERE u.anilist_id = p_anilist_id;
    
    -- Return the updated stats
    RETURN QUERY SELECT * FROM user_game_stats ugs WHERE ugs.anilist_id = p_anilist_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. GRANT PERMISSIONS
-- ============================================
GRANT ALL ON users TO authenticated, anon, service_role;
GRANT ALL ON user_game_stats TO authenticated, anon, service_role;
GRANT ALL ON user_achievements TO authenticated, anon, service_role;
GRANT ALL ON user_studio_templates TO authenticated, anon, service_role;

-- ============================================
-- 11. COMMENTS
-- ============================================
COMMENT ON TABLE users IS 'Core AniLens user profiles - identity layer separate from AniList data';
COMMENT ON TABLE user_game_stats IS 'User game statistics, streaks, and progression';
COMMENT ON TABLE user_achievements IS 'User achievements and badges';
COMMENT ON TABLE user_studio_templates IS 'Saved Studio templates and snapshots';

COMMENT ON FUNCTION upsert_user_on_login IS 'Creates or updates user profile on AniList OAuth login';
COMMENT ON FUNCTION update_game_stats IS 'Updates game statistics after completing a game';
