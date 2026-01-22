-- Migration: Create AniLens profile system
-- Purpose: Core user profiles, game stats, and achievements separate from AniList
-- Created: 2026-01-22

-- ============================================
-- 1. CORE USERS TABLE (AniLens Identity Layer)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
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

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- ============================================
-- 2. USER GAME STATS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_game_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    anilist_id INTEGER NOT NULL REFERENCES users(anilist_id) ON DELETE CASCADE,
    
    -- Overall stats
    total_games_played INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    total_wrong INTEGER DEFAULT 0,
    accuracy_rate DECIMAL(5,2) DEFAULT 0.0,
    
    -- Streaks
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_played_at TIMESTAMPTZ,
    
    -- Daily challenge stats
    daily_challenges_completed INTEGER DEFAULT 0,
    daily_current_streak INTEGER DEFAULT 0,
    daily_longest_streak INTEGER DEFAULT 0,
    last_daily_completed_at DATE,
    
    -- Per-game-type stats (stored as JSONB for flexibility)
    game_type_stats JSONB DEFAULT '{}'::jsonb,
    -- Example: {"score-guess": {"played": 50, "correct": 35}, "tag-or-cap": {"played": 20, "correct": 15}}
    
    -- Multiplayer stats
    multiplayer_wins INTEGER DEFAULT 0,
    multiplayer_losses INTEGER DEFAULT 0,
    multiplayer_draws INTEGER DEFAULT 0,
    mmr INTEGER DEFAULT 1000,
    peak_mmr INTEGER DEFAULT 1000,
    
    -- Bracket stats
    brackets_completed INTEGER DEFAULT 0,
    bracket_champions JSONB DEFAULT '[]'::jsonb,
    -- Example: [{"mediaId": 123, "title": "Steins;Gate", "date": "2026-01-15"}]
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_game_stats UNIQUE (anilist_id)
);

-- Indexes for game stats
CREATE INDEX IF NOT EXISTS idx_game_stats_anilist_id ON user_game_stats(anilist_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_mmr ON user_game_stats(mmr DESC);
CREATE INDEX IF NOT EXISTS idx_game_stats_total_games ON user_game_stats(total_games_played DESC);
CREATE INDEX IF NOT EXISTS idx_game_stats_daily_streak ON user_game_stats(daily_current_streak DESC);

-- ============================================
-- 3. USER ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    anilist_id INTEGER NOT NULL REFERENCES users(anilist_id) ON DELETE CASCADE,
    
    achievement_id VARCHAR(100) NOT NULL,
    achievement_name VARCHAR(255) NOT NULL,
    achievement_description TEXT,
    achievement_icon VARCHAR(50),
    achievement_tier VARCHAR(20) DEFAULT 'bronze', -- bronze, silver, gold, platinum
    
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    progress INTEGER DEFAULT 0,
    progress_max INTEGER DEFAULT 1,
    is_completed BOOLEAN DEFAULT false,
    
    CONSTRAINT unique_user_achievement UNIQUE (anilist_id, achievement_id)
);

-- Indexes for achievements
CREATE INDEX IF NOT EXISTS idx_achievements_anilist_id ON user_achievements(anilist_id);
CREATE INDEX IF NOT EXISTS idx_achievements_earned_at ON user_achievements(earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_achievements_tier ON user_achievements(achievement_tier);

-- ============================================
-- 4. USER STUDIO TEMPLATES (Saved Snapshots)
-- ============================================
CREATE TABLE IF NOT EXISTS user_studio_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    anilist_id INTEGER NOT NULL REFERENCES users(anilist_id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50) NOT NULL, -- 'poster', 'recap', 'compare', 'tierlist'
    template_data JSONB NOT NULL,
    preview_url TEXT,
    
    is_public BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for studio templates
CREATE INDEX IF NOT EXISTS idx_studio_templates_anilist_id ON user_studio_templates(anilist_id);
CREATE INDEX IF NOT EXISTS idx_studio_templates_type ON user_studio_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_studio_templates_public ON user_studio_templates(is_public) WHERE is_public = true;

-- ============================================
-- 5. AUTO-UPDATE TRIGGERS
-- ============================================

-- Trigger for users table
CREATE OR REPLACE FUNCTION update_users_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.profile_updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_users_updated ON users;
CREATE TRIGGER trigger_users_updated
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_timestamp();

-- Trigger for user_game_stats
CREATE OR REPLACE FUNCTION update_game_stats_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_game_stats_updated ON user_game_stats;
CREATE TRIGGER trigger_game_stats_updated
    BEFORE UPDATE ON user_game_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_game_stats_timestamp();

-- Trigger for user_studio_templates
CREATE OR REPLACE FUNCTION update_studio_templates_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_studio_templates_updated ON user_studio_templates;
CREATE TRIGGER trigger_studio_templates_updated
    BEFORE UPDATE ON user_studio_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_studio_templates_timestamp();

-- ============================================
-- 6. ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_studio_templates ENABLE ROW LEVEL SECURITY;

-- Users policies (public profiles readable by all)
CREATE POLICY "Users profiles are publicly readable" ON users
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can manage own profile" ON users
    FOR ALL USING (true) WITH CHECK (true);

-- Game stats policies
CREATE POLICY "Game stats are publicly readable" ON user_game_stats
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own game stats" ON user_game_stats
    FOR ALL USING (true) WITH CHECK (true);

-- Achievements policies
CREATE POLICY "Achievements are publicly readable" ON user_achievements
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own achievements" ON user_achievements
    FOR ALL USING (true) WITH CHECK (true);

-- Studio templates policies
CREATE POLICY "Public templates are readable" ON user_studio_templates
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can manage own templates" ON user_studio_templates
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 7. HELPER FUNCTIONS
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
RETURNS users AS $$
DECLARE
    result users;
BEGIN
    INSERT INTO users (anilist_id, username, avatar_url, banner_url, total_anime, total_manga, last_seen)
    VALUES (p_anilist_id, p_username, p_avatar_url, p_banner_url, p_total_anime, p_total_manga, NOW())
    ON CONFLICT (anilist_id) DO UPDATE SET
        username = EXCLUDED.username,
        avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
        banner_url = COALESCE(EXCLUDED.banner_url, users.banner_url),
        total_anime = EXCLUDED.total_anime,
        total_manga = EXCLUDED.total_manga,
        last_seen = NOW()
    RETURNING * INTO result;
    
    -- Also ensure game stats row exists
    INSERT INTO user_game_stats (anilist_id)
    VALUES (p_anilist_id)
    ON CONFLICT (anilist_id) DO NOTHING;
    
    RETURN result;
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
RETURNS user_game_stats AS $$
DECLARE
    result user_game_stats;
    current_game_stats JSONB;
    new_game_stats JSONB;
BEGIN
    -- Get current game type stats
    SELECT game_type_stats INTO current_game_stats
    FROM user_game_stats WHERE anilist_id = p_anilist_id;
    
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
    
    UPDATE user_game_stats SET
        total_games_played = total_games_played + 1,
        total_correct = total_correct + p_correct,
        total_wrong = total_wrong + p_wrong,
        accuracy_rate = CASE 
            WHEN (total_correct + total_wrong + p_correct + p_wrong) > 0 
            THEN ((total_correct + p_correct)::decimal / (total_correct + total_wrong + p_correct + p_wrong)::decimal) * 100
            ELSE 0 
        END,
        current_streak = CASE WHEN p_wrong = 0 THEN current_streak + p_correct ELSE 0 END,
        longest_streak = GREATEST(longest_streak, CASE WHEN p_wrong = 0 THEN current_streak + p_correct ELSE current_streak END),
        last_played_at = NOW(),
        game_type_stats = new_game_stats,
        daily_challenges_completed = CASE WHEN p_is_daily THEN daily_challenges_completed + 1 ELSE daily_challenges_completed END,
        daily_current_streak = CASE 
            WHEN p_is_daily AND (last_daily_completed_at IS NULL OR last_daily_completed_at = CURRENT_DATE - 1) 
            THEN daily_current_streak + 1 
            WHEN p_is_daily AND last_daily_completed_at < CURRENT_DATE - 1
            THEN 1
            ELSE daily_current_streak 
        END,
        daily_longest_streak = CASE 
            WHEN p_is_daily 
            THEN GREATEST(daily_longest_streak, daily_current_streak + 1)
            ELSE daily_longest_streak 
        END,
        last_daily_completed_at = CASE WHEN p_is_daily THEN CURRENT_DATE ELSE last_daily_completed_at END
    WHERE anilist_id = p_anilist_id
    RETURNING * INTO result;
    
    -- Update users table total games
    UPDATE users SET total_games_played = result.total_games_played
    WHERE anilist_id = p_anilist_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. GRANT PERMISSIONS
-- ============================================
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO anon;
GRANT ALL ON users TO service_role;

GRANT ALL ON user_game_stats TO authenticated;
GRANT ALL ON user_game_stats TO anon;
GRANT ALL ON user_game_stats TO service_role;

GRANT ALL ON user_achievements TO authenticated;
GRANT ALL ON user_achievements TO anon;
GRANT ALL ON user_achievements TO service_role;

GRANT ALL ON user_studio_templates TO authenticated;
GRANT ALL ON user_studio_templates TO anon;
GRANT ALL ON user_studio_templates TO service_role;

-- ============================================
-- 9. COMMENTS
-- ============================================
COMMENT ON TABLE users IS 'Core AniLens user profiles - identity layer separate from AniList data';
COMMENT ON TABLE user_game_stats IS 'User game statistics, streaks, and progression';
COMMENT ON TABLE user_achievements IS 'User achievements and badges';
COMMENT ON TABLE user_studio_templates IS 'Saved Studio templates and snapshots';

COMMENT ON FUNCTION upsert_user_on_login IS 'Creates or updates user profile on AniList OAuth login';
COMMENT ON FUNCTION update_game_stats IS 'Updates game statistics after completing a game';
