import postgres from 'postgres';

// Lazy initialization of database connection
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _sql: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDb(): any {
  if (!_sql) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) {
      throw new Error('DATABASE_URL or POSTGRES_URL environment variable is not set');
    }
    _sql = postgres(url, {
      ssl: 'require',
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false, // disable prepared statements for pgbouncer compatibility
    });
  }
  return _sql;
}

// ============================================================================
// Database Schema Setup
// ============================================================================

async function safeExec(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (err) {
    console.warn(`[DB Init] ${label} skipped:`, err instanceof Error ? err.message : String(err));
  }
}

export async function initializeDatabase() {
  // Users table - linked to AniList accounts
  await safeExec('users', () => getDb()`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      anilist_id INTEGER UNIQUE NOT NULL,
      username VARCHAR(255) NOT NULL,
      avatar_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Player ratings table
  await safeExec('player_ratings', () => getDb()`
    CREATE TABLE IF NOT EXISTS player_ratings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      game_type VARCHAR(50) NOT NULL,
      rating INTEGER DEFAULT 0,
      games_played INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      best_streak INTEGER DEFAULT 0,
      current_streak INTEGER DEFAULT 0,
      last_played TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, game_type)
    )
  `);

  // Game sessions table
  await safeExec('game_sessions', () => getDb()`
    CREATE TABLE IF NOT EXISTS game_sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      game_type VARCHAR(50) NOT NULL,
      score INTEGER NOT NULL,
      max_score INTEGER NOT NULL,
      questions_count INTEGER NOT NULL,
      correct_count INTEGER NOT NULL,
      avg_time_per_question FLOAT,
      difficulty VARCHAR(20),
      rating_change INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Leaderboard cache table
  await safeExec('leaderboard_cache', () => getDb()`
    CREATE TABLE IF NOT EXISTS leaderboard_cache (
      id SERIAL PRIMARY KEY,
      game_type VARCHAR(50) NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      rank INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(game_type, user_id)
    )
  `);

  // AniList list cache table
  await safeExec('anilist_list_cache', () => getDb()`
    CREATE TABLE IF NOT EXISTS anilist_list_cache (
      id SERIAL PRIMARY KEY,
      anilist_id INTEGER NOT NULL,
      list_type VARCHAR(10) NOT NULL,
      max_updated_at BIGINT NOT NULL,
      payload_json JSONB NOT NULL,
      cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(anilist_id, list_type)
    )
  `);

  // Taste profile cache table
  await safeExec('taste_profile_cache', () => getDb()`
    CREATE TABLE IF NOT EXISTS taste_profile_cache (
      id SERIAL PRIMARY KEY,
      anilist_id INTEGER NOT NULL,
      profile_type VARCHAR(10) NOT NULL,
      analysis_version VARCHAR(10) NOT NULL,
      max_updated_at BIGINT NOT NULL,
      profile_json JSONB NOT NULL,
      computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(anilist_id, profile_type, analysis_version)
    )
  `);

  // Prediction residuals table - for ML training
  await safeExec('prediction_residuals', () => getDb()`
    CREATE TABLE IF NOT EXISTS prediction_residuals (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      anilist_media_id INTEGER NOT NULL,
      media_type VARCHAR(10) NOT NULL,
      predicted_score FLOAT NOT NULL,
      actual_score FLOAT,
      features_json JSONB NOT NULL,
      genome_version VARCHAR(10) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User learned model weights
  await safeExec('user_model_weights', () => getDb()`
    CREATE TABLE IF NOT EXISTS user_model_weights (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      media_type VARCHAR(10) NOT NULL,
      bias FLOAT NOT NULL DEFAULT 5.0,
      weights_json JSONB NOT NULL,
      feature_names JSONB NOT NULL,
      r_squared FLOAT,
      rmse FLOAT,
      sample_count INTEGER NOT NULL DEFAULT 0,
      genome_version VARCHAR(10) NOT NULL,
      trained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, media_type, genome_version)
    )
  `);

  // Global learned model weights
  await safeExec('global_model_weights', () => getDb()`
    CREATE TABLE IF NOT EXISTS global_model_weights (
      id SERIAL PRIMARY KEY,
      media_type VARCHAR(10) NOT NULL,
      bias FLOAT NOT NULL DEFAULT 5.0,
      weights_json JSONB NOT NULL,
      feature_names JSONB NOT NULL,
      r_squared FLOAT,
      rmse FLOAT,
      sample_count INTEGER NOT NULL DEFAULT 0,
      genome_version VARCHAR(10) NOT NULL,
      trained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(media_type, genome_version)
    )
  `);

  // Create indexes for performance
  await safeExec('idx_ratings_game_type', () => getDb()`CREATE INDEX IF NOT EXISTS idx_ratings_game_type ON player_ratings(game_type)`);
  await safeExec('idx_ratings_rating', () => getDb()`CREATE INDEX IF NOT EXISTS idx_ratings_rating ON player_ratings(rating DESC)`);
  await safeExec('idx_sessions_user', () => getDb()`CREATE INDEX IF NOT EXISTS idx_sessions_user ON game_sessions(user_id)`);
  await safeExec('idx_sessions_game_type', () => getDb()`CREATE INDEX IF NOT EXISTS idx_sessions_game_type ON game_sessions(game_type)`);
  await safeExec('idx_leaderboard_game_type', () => getDb()`CREATE INDEX IF NOT EXISTS idx_leaderboard_game_type ON leaderboard_cache(game_type, rank)`);
  await safeExec('idx_anilist_cache_user', () => getDb()`CREATE INDEX IF NOT EXISTS idx_anilist_cache_user ON anilist_list_cache(anilist_id, list_type)`);
  await safeExec('idx_taste_cache_user', () => getDb()`CREATE INDEX IF NOT EXISTS idx_taste_cache_user ON taste_profile_cache(anilist_id, profile_type)`);
  await safeExec('idx_residuals_user', () => getDb()`CREATE INDEX IF NOT EXISTS idx_residuals_user ON prediction_residuals(user_id, anilist_media_id)`);
  await safeExec('idx_residuals_created', () => getDb()`CREATE INDEX IF NOT EXISTS idx_residuals_created ON prediction_residuals(created_at DESC)`);
  await safeExec('idx_residuals_media', () => getDb()`CREATE INDEX IF NOT EXISTS idx_residuals_media ON prediction_residuals(media_type, anilist_media_id)`);
}

// ============================================================================
// User Operations
// ============================================================================

// ============================================================================
// AniList Cache Operations
// ============================================================================

export async function getCachedList(anilistId: number, listType: 'ANIME' | 'MANGA') {
  const result = await getDb()`
    SELECT payload_json, max_updated_at, cached_at 
    FROM anilist_list_cache 
    WHERE anilist_id = ${anilistId} AND list_type = ${listType}
  `;
  return result[0] || null;
}

export async function setCachedList(
  anilistId: number, 
  listType: 'ANIME' | 'MANGA', 
  maxUpdatedAt: number, 
  payload: unknown
) {
  await getDb()`
    INSERT INTO anilist_list_cache (anilist_id, list_type, max_updated_at, payload_json)
    VALUES (${anilistId}, ${listType}, ${maxUpdatedAt}, ${JSON.stringify(payload)})
    ON CONFLICT (anilist_id, list_type)
    DO UPDATE SET 
      max_updated_at = ${maxUpdatedAt},
      payload_json = ${JSON.stringify(payload)},
      cached_at = CURRENT_TIMESTAMP
  `;
}

export async function getCachedTasteProfile(
  anilistId: number, 
  profileType: 'ANIME' | 'MANGA',
  analysisVersion: string = 'v1'
) {
  const result = await getDb()`
    SELECT profile_json, max_updated_at, computed_at 
    FROM taste_profile_cache 
    WHERE anilist_id = ${anilistId} 
      AND profile_type = ${profileType}
      AND analysis_version = ${analysisVersion}
  `;
  return result[0] || null;
}

export async function setCachedTasteProfile(
  anilistId: number,
  profileType: 'ANIME' | 'MANGA',
  analysisVersion: string,
  maxUpdatedAt: number,
  profile: unknown
) {
  await getDb()`
    INSERT INTO taste_profile_cache (anilist_id, profile_type, analysis_version, max_updated_at, profile_json)
    VALUES (${anilistId}, ${profileType}, ${analysisVersion}, ${maxUpdatedAt}, ${JSON.stringify(profile)})
    ON CONFLICT (anilist_id, profile_type, analysis_version)
    DO UPDATE SET 
      max_updated_at = ${maxUpdatedAt},
      profile_json = ${JSON.stringify(profile)},
      computed_at = CURRENT_TIMESTAMP
  `;
}

export async function getOrCreateUser(anilistId: number, username: string, avatarUrl?: string) {
  // Try to get existing user
  const existing = await getDb()`
    SELECT * FROM users WHERE anilist_id = ${anilistId}
  `;

  if (existing.length > 0) {
    // Update username/avatar if changed, and touch updated_at
    await getDb()`
      UPDATE users 
      SET username = ${username}, avatar_url = ${avatarUrl || null}, updated_at = CURRENT_TIMESTAMP
      WHERE anilist_id = ${anilistId}
    `;
    const user = existing[0];
    // player_ratings.user_id stores anilist_id, not the DB primary key.
    // In Supabase users.id is a UUID; in local PG it may be SERIAL.
    // Either way, the game tables reference anilist_id.
    user.id = user.anilist_id;
    return user;
  }

  // Create new user
  const result = await getDb()`
    INSERT INTO users (anilist_id, username, avatar_url)
    VALUES (${anilistId}, ${username}, ${avatarUrl || null})
    RETURNING *
  `;

  const user = result[0];
  user.id = user.anilist_id;
  return user;
}

export async function getUserByAnilistId(anilistId: number) {
  const result = await getDb()`
    SELECT * FROM users WHERE anilist_id = ${anilistId}
  `;
  return result[0] || null;
}

/**
 * Get users whose profile data (avatar, username) hasn't been refreshed in a while
 */
export async function getStaleAvatarUsers(
  anilistIds: number[],
  maxAgeDays: number = 7,
  limit: number = 10
): Promise<Array<{ anilist_id: number; username: string }>> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - maxAgeDays);
  
  const result = await getDb()`
    SELECT anilist_id, username 
    FROM users 
    WHERE anilist_id IN ${anilistIds}
      AND (updated_at < ${cutoff.toISOString()} OR updated_at IS NULL)
    LIMIT ${limit}
  `;
  
  return result;
}

// ============================================================================
// Rating Operations
// ============================================================================

export async function getPlayerRating(userId: number, gameType: string) {
  const result = await getDb()`
    SELECT * FROM player_ratings 
    WHERE user_id = ${userId} AND game_type = ${gameType}
  `;

  if (result.length === 0) {
    // Create default rating - start at 0 (Iron IV)
    const newRating = await getDb()`
      INSERT INTO player_ratings (user_id, game_type, rating)
      VALUES (${userId}, ${gameType}, 0)
      RETURNING *
    `;
    return newRating[0];
  }

  return result[0];
}

export async function getAllPlayerRatings(userId: number) {
  const result = await getDb()`
    SELECT * FROM player_ratings WHERE user_id = ${userId}
  `;
  return result;
}

// Calculate overall MMR from all game modes
export async function getOverallRating(userId: number) {
  const result = await getDb()`
    SELECT 
      COALESCE(SUM(rating), 0) as total_rating,
      COALESCE(SUM(games_played), 0) as total_games,
      COALESCE(SUM(wins), 0) as total_wins,
      COALESCE(MAX(best_streak), 0) as best_streak,
      COUNT(*) as game_types_played
    FROM player_ratings 
    WHERE user_id = ${userId} AND games_played > 0
  `;
  return result[0] || { total_rating: 0, total_games: 0, total_wins: 0, best_streak: 0, game_types_played: 0 };
}

// Calculate rating change based on correct answers, difficulty, time, question count, and game type
function calculateRatingChange(
  currentRating: number,
  correctCount: number,
  questionsCount: number,
  difficulty: string,
  gameType: string,
  avgTime?: number,
  timeLimit?: string
): number {
  // Base MMR per correct answer (scales with difficulty)
  const basePerCorrect = difficulty === 'hard' ? 15 : difficulty === 'easy' ? 8 : 10;
  
  // Game type difficulty modifier (some games are easier/harder)
  // 1.0 = normal, <1.0 = easier game (less MMR), >1.0 = harder game (more MMR)
  const gameTypeModifiers: Record<string, number> = {
    'op-guessing': 1.0,         // Standard difficulty
    'character-guessing': 0.7,  // Easier - visual recognition
    'score-guessing': 0.9,      // Slightly easier
    'season-matching': 1.2,     // Hard - need to know air dates
    'cover-guessing': 0.8,      // Easier - visual recognition
    'chapters-guessing': 1.1,   // Harder - need to know manga details
    'hangman': 0.85,            // Medium-easy
    'popularity-battle': 1.0,   // Standard - general knowledge
    'tag-or-cap': 0.9,          // Slightly easier - some guesswork
    'taste-consistency': 0.8,   // Easier - based on own ratings
    'studio-match': 1.15,       // Hard - need studio knowledge
    'va-connection': 1.1,         // Harder - voice actor knowledge
    'relation-type': 1.0,       // Standard
    'score-ladder': 0.95,       // Slightly easier - own ratings
    'tag-ladder': 0.9,          // Slightly easier - own tags
    'seiyuu-guessing': 0.75,    // Easier - visual recognition
    'screenshot-guessing': 0.8, // Easier - visual recognition
    'quote-guessing': 1.0,      // Standard
    'wordle': 0.9,              // Slightly easier
  };
  const gameModifier = gameTypeModifiers[gameType] || 1.0;
  
  // Penalty per wrong answer (smaller than reward to encourage playing)
  const penaltyPerWrong = difficulty === 'hard' ? 5 : difficulty === 'easy' ? 3 : 4;
  
  const wrongCount = questionsCount - correctCount;
  
  // Calculate base change: gain MMR for correct, lose small amount for wrong
  let change = (correctCount * basePerCorrect) - (wrongCount * penaltyPerWrong);
  
  // Time limit bonus: speed runs give more MMR
  if (timeLimit === 'speed') {
    change = Math.round(change * 1.25); // 25% bonus for speed mode (15 seconds)
  } else if (timeLimit === 'relaxed') {
    change = Math.round(change * 0.9); // 10% reduction for relaxed mode
  }
  
  // Fast answer bonus: if average time per question is under 5 seconds
  if (avgTime && avgTime < 5000) {
    change += Math.round((5000 - avgTime) / 500); // Up to +10 bonus for very fast answers
  }
  
  // Bonus for perfect games (scales with question count)
  // This replaces separate accuracy and long game bonuses to prevent stacking
  if (correctCount === questionsCount) {
    if (questionsCount >= 20) {
      change += 25; // Large perfect bonus for 20+ questions
    } else if (questionsCount >= 15) {
      change += 20; // Medium perfect bonus for 15+ questions
    } else if (questionsCount >= 10) {
      change += 15; // Small perfect bonus for 10+ questions
    } else if (questionsCount >= 5) {
      change += 10; // Minimal perfect bonus for 5+ questions
    }
  } else {
    // High accuracy bonus for non-perfect games (90%+)
    const accuracy = correctCount / questionsCount;
    if (accuracy >= 0.9 && questionsCount >= 5) {
      change += 5; // Smaller bonus for high accuracy
    }
    
    // Long game bonus for non-perfect games
    if (questionsCount >= 20) {
      change += 8; // Bonus for marathon games
    } else if (questionsCount >= 15) {
      change += 5;
    }
  }
  
  // At higher ratings, gains are slightly reduced (harder to climb)
  if (currentRating >= 2000) {
    change = Math.round(change * 0.8);
  } else if (currentRating >= 1600) {
    change = Math.round(change * 0.9);
  }
  
  // Apply game type modifier (easier games give less MMR)
  change = Math.round(change * gameModifier);
  
  // Hard caps to prevent extreme inflation
  // Maximum gain per game: 50 MMR
  // Maximum loss per game: -20 MMR
  change = Math.max(-20, Math.min(50, change));
  
  return change;
}

export async function updateRatingAfterGame(
  userId: number,
  gameType: string,
  score: number,
  maxScore: number,
  correctCount: number,
  questionsCount: number,
  avgTime: number,
  difficulty: string,
  timeLimit?: string
) {
  console.log('[DB updateRatingAfterGame] Input:', { userId, gameType, score, maxScore, correctCount, questionsCount, avgTime, difficulty, timeLimit });

  const rating = await getPlayerRating(userId, gameType);
  console.log('[DB updateRatingAfterGame] Current rating:', rating);

  const ratingChange = calculateRatingChange(rating.rating, correctCount, questionsCount, difficulty, gameType, avgTime, timeLimit);
  const newRating = Math.max(0, rating.rating + ratingChange);
  const isWin = score / maxScore >= 0.7; // 70%+ is a win

  console.log('[DB updateRatingAfterGame] Calculated:', { ratingChange, newRating, isWin });
  
  // Update rating
  await getDb()`
    UPDATE player_ratings
    SET 
      rating = ${newRating},
      games_played = games_played + 1,
      wins = wins + ${isWin ? 1 : 0},
      current_streak = ${isWin ? rating.current_streak + 1 : 0},
      best_streak = GREATEST(best_streak, ${isWin ? rating.current_streak + 1 : rating.current_streak}),
      last_played = CURRENT_TIMESTAMP
    WHERE user_id = ${userId} AND game_type = ${gameType}
  `;

  // Record game session
  await getDb()`
    INSERT INTO game_sessions (
      user_id, game_type, score, max_score, questions_count, 
      correct_count, avg_time_per_question, difficulty, rating_change
    )
    VALUES (
      ${userId}, ${gameType}, ${score}, ${maxScore}, ${questionsCount},
      ${correctCount}, ${avgTime}, ${difficulty}, ${ratingChange}
    )
  `;

  return {
    oldRating: rating.rating,
    newRating,
    change: ratingChange,
    isWin,
  };
}

// ============================================================================
// Leaderboard Operations
// ============================================================================

export async function getLeaderboard(gameType: string, limit: number = 100, offset: number = 0) {
  const result = await getDb()`
    SELECT 
      u.anilist_id,
      u.username,
      u.avatar_url,
      pr.rating,
      pr.games_played,
      pr.wins,
      pr.best_streak,
      RANK() OVER (ORDER BY pr.rating DESC) as rank
    FROM player_ratings pr
    JOIN users u ON pr.user_id = u.anilist_id
    WHERE pr.game_type = ${gameType} AND pr.games_played > 0
    ORDER BY pr.rating DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return result;
}

export async function getGlobalLeaderboard(limit: number = 100, offset: number = 0) {
  // Aggregate ratings across all game types - use SUM for overall MMR
  const result = await getDb()`
    SELECT 
      u.anilist_id,
      u.username,
      u.avatar_url,
      SUM(pr.rating)::INTEGER as rating,
      SUM(pr.games_played)::INTEGER as games_played,
      SUM(pr.wins)::INTEGER as wins,
      MAX(pr.best_streak) as best_streak,
      RANK() OVER (ORDER BY SUM(pr.rating) DESC) as rank
    FROM player_ratings pr
    JOIN users u ON pr.user_id = u.anilist_id
    WHERE pr.games_played > 0
    GROUP BY u.anilist_id, u.username, u.avatar_url
    HAVING SUM(pr.games_played) >= 1
    ORDER BY rating DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return result;
}

export async function getUserRank(userId: number, gameType: string) {
  const result = await getDb()`
    SELECT rank FROM (
      SELECT 
        user_id,
        RANK() OVER (ORDER BY rating DESC) as rank
      FROM player_ratings
      WHERE game_type = ${gameType} AND games_played > 0
    ) ranked
    WHERE user_id = ${userId}
  `;

  return result[0]?.rank || null;
}

// ============================================================================
// Game History
// ============================================================================

export async function getGameHistory(userId: number, limit: number = 20) {
  const result = await getDb()`
    SELECT * FROM game_sessions
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;

  return result;
}

export async function getGameStats(userId: number) {
  const result = await getDb()`
    SELECT 
      game_type,
      COUNT(*) as games_played,
      AVG(score::FLOAT / max_score * 100)::INTEGER as avg_accuracy,
      AVG(avg_time_per_question)::FLOAT as avg_time,
      SUM(correct_count) as total_correct,
      SUM(questions_count) as total_questions
    FROM game_sessions
    WHERE user_id = ${userId}
    GROUP BY game_type
  `;

  return result;
}

// ============================================================================
// Prediction Residuals & ML Model Operations
// ============================================================================

export async function logPredictionResidual(
  userId: number,
  anilistMediaId: number,
  mediaType: 'ANIME' | 'MANGA',
  predictedScore: number,
  actualScore: number | null,
  features: Record<string, number>,
  genomeVersion: string = 'v3'
) {
  await getDb()`
    INSERT INTO prediction_residuals 
      (user_id, anilist_media_id, media_type, predicted_score, actual_score, features_json, genome_version)
    VALUES 
      (${userId}, ${anilistMediaId}, ${mediaType}, ${predictedScore}, ${actualScore}, ${JSON.stringify(features)}, ${genomeVersion})
    ON CONFLICT DO NOTHING
  `;
}

export async function getUserResiduals(userId: number, mediaType?: 'ANIME' | 'MANGA', limit: number = 500) {
  const typeFilter = mediaType ? getDb()`AND media_type = ${mediaType}` : getDb()``;
  const result = await getDb()`
    SELECT * FROM prediction_residuals 
    WHERE user_id = ${userId} ${typeFilter}
      AND actual_score IS NOT NULL
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return result;
}

export async function getUserModelWeights(
  userId: number,
  mediaType: 'ANIME' | 'MANGA',
  genomeVersion: string = 'v3'
) {
  const result = await getDb()`
    SELECT * FROM user_model_weights 
    WHERE user_id = ${userId} AND media_type = ${mediaType} AND genome_version = ${genomeVersion}
  `;
  return result[0] || null;
}

export async function storeUserModelWeights(
  userId: number,
  mediaType: 'ANIME' | 'MANGA',
  weights: Record<string, number>,
  featureNames: string[],
  bias: number,
  rSquared: number,
  rmse: number,
  sampleCount: number,
  genomeVersion: string = 'v3'
) {
  await getDb()`
    INSERT INTO user_model_weights 
      (user_id, media_type, bias, weights_json, feature_names, r_squared, rmse, sample_count, genome_version)
    VALUES 
      (${userId}, ${mediaType}, ${bias}, ${JSON.stringify(weights)}, ${JSON.stringify(featureNames)}, ${rSquared}, ${rmse}, ${sampleCount}, ${genomeVersion})
    ON CONFLICT (user_id, media_type, genome_version)
    DO UPDATE SET 
      bias = ${bias},
      weights_json = ${JSON.stringify(weights)},
      feature_names = ${JSON.stringify(featureNames)},
      r_squared = ${rSquared},
      rmse = ${rmse},
      sample_count = ${sampleCount},
      trained_at = CURRENT_TIMESTAMP
  `;
}

export async function updateResidualActualScore(
  userId: number,
  anilistMediaId: number,
  actualScore: number,
  mediaType: 'ANIME' | 'MANGA' = 'ANIME'
) {
  // Update existing residuals; allow re-rating by NOT requiring actual_score IS NULL
  const updateResult = await getDb()`
    UPDATE prediction_residuals
    SET actual_score = ${actualScore}
    WHERE user_id = ${userId} AND anilist_media_id = ${anilistMediaId}
    RETURNING id
  `;

  // If no residual existed (user rated something never recommended), insert a stub record
  if (!updateResult || updateResult.length === 0) {
    await getDb()`
      INSERT INTO prediction_residuals
        (user_id, anilist_media_id, media_type, predicted_score, actual_score, features_json, genome_version)
      VALUES
        (${userId}, ${anilistMediaId}, ${mediaType}, ${actualScore}, ${actualScore}, ${JSON.stringify({})}, 'v3')
      ON CONFLICT DO NOTHING
    `;
  }
}

export async function getGlobalModelWeights(
  mediaType: 'ANIME' | 'MANGA',
  genomeVersion: string = 'v3'
) {
  const result = await getDb()`
    SELECT * FROM global_model_weights 
    WHERE media_type = ${mediaType} AND genome_version = ${genomeVersion}
  `;
  return result[0] || null;
}

export async function storeGlobalModelWeights(
  mediaType: 'ANIME' | 'MANGA',
  weights: Record<string, number>,
  featureNames: string[],
  bias: number,
  rSquared: number,
  rmse: number,
  sampleCount: number,
  genomeVersion: string = 'v3'
) {
  await getDb()`
    INSERT INTO global_model_weights 
      (media_type, bias, weights_json, feature_names, r_squared, rmse, sample_count, genome_version)
    VALUES 
      (${mediaType}, ${bias}, ${JSON.stringify(weights)}, ${JSON.stringify(featureNames)}, ${rSquared}, ${rmse}, ${sampleCount}, ${genomeVersion})
    ON CONFLICT (media_type, genome_version)
    DO UPDATE SET 
      bias = ${bias},
      weights_json = ${JSON.stringify(weights)},
      feature_names = ${JSON.stringify(featureNames)},
      r_squared = ${rSquared},
      rmse = ${rmse},
      sample_count = ${sampleCount},
      trained_at = CURRENT_TIMESTAMP
  `;
}

export async function getAllResidualsForGlobalTraining(
  mediaType: 'ANIME' | 'MANGA',
  limit: number = 5000
) {
  const result = await getDb()`
    SELECT predicted_score, actual_score, features_json, user_id
    FROM prediction_residuals 
    WHERE media_type = ${mediaType}
      AND actual_score IS NOT NULL
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return result;
}

export async function getCommunityScoreForMedia(
  anilistMediaId: number,
  mediaType: 'ANIME' | 'MANGA'
): Promise<{ mean: number; count: number; std: number } | null> {
  const result = await getDb()`
    SELECT 
      AVG(actual_score)::FLOAT as mean,
      COUNT(*)::INTEGER as count,
      STDDEV(actual_score)::FLOAT as std
    FROM prediction_residuals 
    WHERE anilist_media_id = ${anilistMediaId}
      AND media_type = ${mediaType}
      AND actual_score IS NOT NULL
  `;
  const row = result[0];
  if (!row || row.count < 3) return null;
  return {
    mean: Number(row.mean),
    count: Number(row.count),
    std: Number(row.std) || 1.5,
  };
}

// Export the getDb function for use in API routes
export { getDb };
