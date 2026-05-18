import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization of Supabase client to avoid build-time errors
let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (_supabase) return _supabase;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('[AniLens Profile] Supabase credentials not configured');
    return null;
  }
  
  _supabase = createClient(supabaseUrl, supabaseKey);
  return _supabase;
}

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface AniLensUser {
  anilist_id: number;
  username: string;
  avatar_url: string | null;
  banner_url: string | null;
  created_at: string;
  last_seen: string;
  anime_archetype: string | null;
  manga_archetype: string | null;
  taste_title: string | null;
  is_public: boolean;
  adult_content_enabled: boolean;
  total_anime: number;
  total_manga: number;
  total_games_played: number;
  profile_updated_at: string;
}

export interface UserGameStats {
  anilist_id: number;
  total_games_played: number;
  total_correct: number;
  total_wrong: number;
  accuracy_rate: number;
  current_streak: number;
  longest_streak: number;
  last_played_at: string | null;
  daily_challenges_completed: number;
  daily_current_streak: number;
  daily_longest_streak: number;
  last_daily_completed_at: string | null;
  game_type_stats: Record<string, { played: number; correct: number; wrong: number }>;
  multiplayer_wins: number;
  multiplayer_losses: number;
  multiplayer_draws: number;
  mmr: number;
  peak_mmr: number;
  brackets_completed: number;
  bracket_champions: Array<{ mediaId: number; title: string; date: string }>;
}

export interface UserAchievement {
  id: string;
  anilist_id: number;
  achievement_id: string;
  achievement_name: string;
  achievement_description: string | null;
  achievement_icon: string | null;
  achievement_tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  earned_at: string;
  progress: number;
  progress_max: number;
  is_completed: boolean;
}

export interface UserSettings {
  anilist_id: number;
  content_filter: {
    hideAdult: boolean;
    hideEcchi: boolean;
    blurNsfwCovers: boolean;
    includeInAnalysis: boolean;
  };
  display_preferences: {
    theme?: 'dark' | 'light' | 'system';
    accentColor?: string;
    defaultTab?: string;
    defaultTimeWindow?: 'all' | '12months' | '90days';
    defaultStatusFilters?: string[];
  };
  notification_preferences: {
    dailyReminder?: boolean;
    streakReminder?: boolean;
  };
}

// ============================================
// USER PROFILE FUNCTIONS
// ============================================

/**
 * Create or update user profile on login
 */
export async function upsertUserOnLogin(
  anilistId: number,
  username: string,
  avatarUrl?: string | null,
  bannerUrl?: string | null,
  totalAnime?: number,
  totalManga?: number
): Promise<AniLensUser | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  
  try {
    // Try using RPC function first (if it exists)
    const { data: rpcData, error: rpcError } = await supabase.rpc('upsert_user_on_login', {
      p_anilist_id: anilistId,
      p_username: username,
      p_avatar_url: avatarUrl,
      p_banner_url: bannerUrl,
      p_total_anime: totalAnime || 0,
      p_total_manga: totalManga || 0,
    });

    if (!rpcError && rpcData) {
      return rpcData as AniLensUser;
    }

    // Fallback to direct upsert if RPC doesn't exist yet
    const { data, error } = await supabase
      .from('users')
      .upsert({
        anilist_id: anilistId,
        username,
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
        total_anime: totalAnime || 0,
        total_manga: totalManga || 0,
        last_seen: new Date().toISOString(),
      }, {
        onConflict: 'anilist_id',
      })
      .select()
      .single();

    if (error) {
      console.error('[AniLens Profile] Error upserting user:', error);
      return null;
    }

    // Ensure game stats row exists
    await supabase
      .from('user_game_stats')
      .upsert({ anilist_id: anilistId }, { onConflict: 'anilist_id' });

    return data as AniLensUser;
  } catch (error) {
    console.error('[AniLens Profile] Exception upserting user:', error);
    return null;
  }
}

/**
 * Get user profile by AniList ID
 */
export async function getUserProfile(anilistId: number): Promise<AniLensUser | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('anilist_id', anilistId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // User not found
        return null;
      }
      console.error('[AniLens Profile] Error fetching user:', error);
      return null;
    }

    return data as AniLensUser;
  } catch (error) {
    console.error('[AniLens Profile] Exception fetching user:', error);
    return null;
  }
}

/**
 * Get user profile by username
 */
export async function getUserByUsername(username: string): Promise<AniLensUser | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('username', username)
      .single();

    if (error) {
      return null;
    }

    return data as AniLensUser;
  } catch (error) {
    console.error('[AniLens Profile] Exception fetching user by username:', error);
    return null;
  }
}

/**
 * Update user's taste archetype
 */
export async function updateUserArchetype(
  anilistId: number,
  type: 'anime' | 'manga',
  archetype: string,
  tasteTitle?: string
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  
  try {
    const updateData: Record<string, string> = {};
    if (type === 'anime') {
      updateData.anime_archetype = archetype;
    } else {
      updateData.manga_archetype = archetype;
    }
    if (tasteTitle) {
      updateData.taste_title = tasteTitle;
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('anilist_id', anilistId);

    return !error;
  } catch (error) {
    console.error('[AniLens Profile] Error updating archetype:', error);
    return false;
  }
}

// ============================================
// GAME STATS FUNCTIONS
// ============================================

/**
 * Get user's game stats
 */
export async function getUserGameStats(anilistId: number): Promise<UserGameStats | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('user_game_stats')
      .select('*')
      .eq('anilist_id', anilistId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('[AniLens Profile] Error fetching game stats:', error);
      return null;
    }

    return data as UserGameStats;
  } catch (error) {
    console.error('[AniLens Profile] Exception fetching game stats:', error);
    return null;
  }
}

/**
 * Update game stats after a game
 */
export async function updateGameStats(
  anilistId: number,
  gameType: string,
  correct: number,
  wrong: number,
  isDaily: boolean = false
): Promise<UserGameStats | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  
  try {
    // Try RPC first
    const { data: rpcData, error: rpcError } = await supabase.rpc('update_game_stats', {
      p_anilist_id: anilistId,
      p_game_type: gameType,
      p_correct: correct,
      p_wrong: wrong,
      p_is_daily: isDaily,
    });

    if (!rpcError && rpcData) {
      return rpcData as UserGameStats;
    }

    // Fallback to manual update
    const currentStats = await getUserGameStats(anilistId);
    if (!currentStats) {
      // Create new stats row
      const { data, error } = await supabase
        .from('user_game_stats')
        .insert({
          anilist_id: anilistId,
          total_games_played: 1,
          total_correct: correct,
          total_wrong: wrong,
          accuracy_rate: correct / (correct + wrong) * 100,
          current_streak: wrong === 0 ? correct : 0,
          longest_streak: wrong === 0 ? correct : 0,
          last_played_at: new Date().toISOString(),
          game_type_stats: { [gameType]: { played: 1, correct, wrong } },
        })
        .select()
        .single();

      return data as UserGameStats;
    }

    // Update existing stats
    const gameTypeStats = currentStats.game_type_stats || {};
    const currentGameType = gameTypeStats[gameType] || { played: 0, correct: 0, wrong: 0 };
    gameTypeStats[gameType] = {
      played: currentGameType.played + 1,
      correct: currentGameType.correct + correct,
      wrong: currentGameType.wrong + wrong,
    };

    const newTotalCorrect = currentStats.total_correct + correct;
    const newTotalWrong = currentStats.total_wrong + wrong;
    const newStreak = wrong === 0 ? currentStats.current_streak + correct : 0;

    const { data, error } = await supabase
      .from('user_game_stats')
      .update({
        total_games_played: currentStats.total_games_played + 1,
        total_correct: newTotalCorrect,
        total_wrong: newTotalWrong,
        accuracy_rate: (newTotalCorrect / (newTotalCorrect + newTotalWrong)) * 100,
        current_streak: newStreak,
        longest_streak: Math.max(currentStats.longest_streak, newStreak),
        last_played_at: new Date().toISOString(),
        game_type_stats: gameTypeStats,
      })
      .eq('anilist_id', anilistId)
      .select()
      .single();

    if (error) {
      console.error('[AniLens Profile] Error updating game stats:', error);
      return null;
    }

    return data as UserGameStats;
  } catch (error) {
    console.error('[AniLens Profile] Exception updating game stats:', error);
    return null;
  }
}

// ============================================
// USER SETTINGS FUNCTIONS
// ============================================

/**
 * Get user settings
 */
export async function getUserSettings(anilistId: number): Promise<UserSettings | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('anilist_id', anilistId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('[AniLens Profile] Error fetching settings:', error);
      return null;
    }

    return data as UserSettings;
  } catch (error) {
    console.error('[AniLens Profile] Exception fetching settings:', error);
    return null;
  }
}

/**
 * Update user settings
 */
export async function updateUserSettings(
  anilistId: number,
  settings: Partial<UserSettings>
): Promise<UserSettings | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        anilist_id: anilistId,
        ...settings,
      }, {
        onConflict: 'anilist_id',
      })
      .select()
      .single();

    if (error) {
      console.error('[AniLens Profile] Error updating settings:', error);
      return null;
    }

    return data as UserSettings;
  } catch (error) {
    console.error('[AniLens Profile] Exception updating settings:', error);
    return null;
  }
}

// ============================================
// ACHIEVEMENTS FUNCTIONS
// ============================================

/**
 * Get user achievements
 */
export async function getUserAchievements(anilistId: number): Promise<UserAchievement[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  
  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('anilist_id', anilistId)
      .order('earned_at', { ascending: false });

    if (error) {
      console.error('[AniLens Profile] Error fetching achievements:', error);
      return [];
    }

    return data as UserAchievement[];
  } catch (error) {
    console.error('[AniLens Profile] Exception fetching achievements:', error);
    return [];
  }
}

/**
 * Award achievement to user
 */
export async function awardAchievement(
  anilistId: number,
  achievementId: string,
  achievementName: string,
  description?: string,
  icon?: string,
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze'
): Promise<UserAchievement | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .upsert({
        anilist_id: anilistId,
        achievement_id: achievementId,
        achievement_name: achievementName,
        achievement_description: description,
        achievement_icon: icon,
        achievement_tier: tier,
        is_completed: true,
        progress: 1,
        progress_max: 1,
      }, {
        onConflict: 'anilist_id,achievement_id',
      })
      .select()
      .single();

    if (error) {
      console.error('[AniLens Profile] Error awarding achievement:', error);
      return null;
    }

    return data as UserAchievement;
  } catch (error) {
    console.error('[AniLens Profile] Exception awarding achievement:', error);
    return null;
  }
}

// ============================================
// LEADERBOARD FUNCTIONS
// ============================================

/**
 * Get game stats leaderboard
 */
export async function getGameStatsLeaderboard(
  orderBy: 'total_games_played' | 'accuracy_rate' | 'longest_streak' | 'mmr' = 'total_games_played',
  limit: number = 50
): Promise<Array<UserGameStats & { username: string; avatar_url: string }>> {
  const supabase = getSupabase();
  if (!supabase) return [];
  
  try {
    const { data, error } = await supabase
      .from('user_game_stats')
      .select(`
        *,
        users!inner(username, avatar_url)
      `)
      .order(orderBy, { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[AniLens Profile] Error fetching leaderboard:', error);
      return [];
    }

    // Flatten the response
    return (data || []).map((row: Record<string, unknown>) => ({
      ...row,
      username: (row.users as { username: string }).username,
      avatar_url: (row.users as { avatar_url: string }).avatar_url,
    })) as Array<UserGameStats & { username: string; avatar_url: string }>;
  } catch (error) {
    console.error('[AniLens Profile] Exception fetching leaderboard:', error);
    return [];
  }
}

/**
 * Get daily streak leaderboard
 */
export async function getDailyStreakLeaderboard(limit: number = 50) {
  const supabase = getSupabase();
  if (!supabase) return [];
  
  try {
    const { data, error } = await supabase
      .from('user_game_stats')
      .select(`
        anilist_id,
        daily_current_streak,
        daily_longest_streak,
        daily_challenges_completed,
        users!inner(username, avatar_url)
      `)
      .order('daily_current_streak', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[AniLens Profile] Error fetching daily leaderboard:', error);
      return [];
    }

    return (data || []).map((row: Record<string, unknown>) => ({
      ...row,
      username: (row.users as { username: string }).username,
      avatar_url: (row.users as { avatar_url: string }).avatar_url,
    }));
  } catch (error) {
    console.error('[AniLens Profile] Exception fetching daily leaderboard:', error);
    return [];
  }
}

// ============================================
// FULL PROFILE FETCH (for public profiles)
// ============================================

export interface FullAniLensProfile {
  user: AniLensUser;
  gameStats: UserGameStats | null;
  achievements: UserAchievement[];
  settings: UserSettings | null;
}

/**
 * Get complete user profile for public display
 */
export async function getFullProfile(anilistId: number): Promise<FullAniLensProfile | null> {
  try {
    const [user, gameStats, achievements, settings] = await Promise.all([
      getUserProfile(anilistId),
      getUserGameStats(anilistId),
      getUserAchievements(anilistId),
      getUserSettings(anilistId),
    ]);

    if (!user) {
      return null;
    }

    return {
      user,
      gameStats,
      achievements,
      settings,
    };
  } catch (error) {
    console.error('[AniLens Profile] Error fetching full profile:', error);
    return null;
  }
}
