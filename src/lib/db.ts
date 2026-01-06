import { neon } from '@neondatabase/serverless';

// Lazy initialization of database connection
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _sql: any = null;

function getDb() {
  if (!_sql) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) {
      throw new Error('DATABASE_URL or POSTGRES_URL environment variable is not set');
    }
    _sql = neon(url);
  }
  return _sql;
}

// ============================================================================
// Database Schema Setup
// ============================================================================

export async function initializeDatabase() {
  // Users table - linked to AniList accounts
  await getDb()`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      anilist_id INTEGER UNIQUE NOT NULL,
      username VARCHAR(255) NOT NULL,
      avatar_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Player ratings table - MMR for each game type (starts at 0 = Iron IV)
  await getDb()`
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
  `;

  // Game sessions table - track individual games
  await getDb()`
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
  `;

  // Leaderboard cache table - for fast leaderboard queries
  await getDb()`
    CREATE TABLE IF NOT EXISTS leaderboard_cache (
      id SERIAL PRIMARY KEY,
      game_type VARCHAR(50) NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      rank INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(game_type, user_id)
    )
  `;

  // Create indexes for performance
  await getDb()`CREATE INDEX IF NOT EXISTS idx_ratings_game_type ON player_ratings(game_type)`;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_ratings_rating ON player_ratings(rating DESC)`;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_sessions_user ON game_sessions(user_id)`;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_sessions_game_type ON game_sessions(game_type)`;
  await getDb()`CREATE INDEX IF NOT EXISTS idx_leaderboard_game_type ON leaderboard_cache(game_type, rank)`;
}

// ============================================================================
// User Operations
// ============================================================================

export async function getOrCreateUser(anilistId: number, username: string, avatarUrl?: string) {
  // Try to get existing user
  const existing = await getDb()`
    SELECT * FROM users WHERE anilist_id = ${anilistId}
  `;

  if (existing.length > 0) {
    // Update username/avatar if changed
    await getDb()`
      UPDATE users 
      SET username = ${username}, avatar_url = ${avatarUrl || null}, updated_at = CURRENT_TIMESTAMP
      WHERE anilist_id = ${anilistId}
    `;
    return existing[0];
  }

  // Create new user
  const result = await getDb()`
    INSERT INTO users (anilist_id, username, avatar_url)
    VALUES (${anilistId}, ${username}, ${avatarUrl || null})
    RETURNING *
  `;

  return result[0];
}

export async function getUserByAnilistId(anilistId: number) {
  const result = await getDb()`
    SELECT * FROM users WHERE anilist_id = ${anilistId}
  `;
  return result[0] || null;
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

// Calculate rating change based on correct answers
function calculateRatingChange(
  currentRating: number,
  correctCount: number,
  questionsCount: number,
  difficulty: string
): number {
  // Base MMR per correct answer (scales with difficulty)
  const basePerCorrect = difficulty === 'hard' ? 15 : difficulty === 'easy' ? 8 : 10;
  
  // Penalty per wrong answer (smaller than reward to encourage playing)
  const penaltyPerWrong = difficulty === 'hard' ? 5 : difficulty === 'easy' ? 3 : 4;
  
  const wrongCount = questionsCount - correctCount;
  
  // Calculate change: gain MMR for correct, lose small amount for wrong
  let change = (correctCount * basePerCorrect) - (wrongCount * penaltyPerWrong);
  
  // Bonus for perfect games
  if (correctCount === questionsCount && questionsCount >= 5) {
    change += 25; // Perfect game bonus
  }
  
  // High accuracy bonus (90%+)
  const accuracy = correctCount / questionsCount;
  if (accuracy >= 0.9 && questionsCount >= 5) {
    change += 10;
  }
  
  // At higher ratings, gains are slightly reduced (harder to climb)
  if (currentRating >= 2000) {
    change = Math.round(change * 0.8);
  } else if (currentRating >= 1600) {
    change = Math.round(change * 0.9);
  }
  
  // Minimum change is 0 (can't lose MMR below 0, handled elsewhere)
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
  difficulty: string
) {
  const rating = await getPlayerRating(userId, gameType);
  const ratingChange = calculateRatingChange(rating.rating, correctCount, questionsCount, difficulty);
  const newRating = Math.max(0, rating.rating + ratingChange);
  const isWin = score / maxScore >= 0.7; // 70%+ is a win
  
  // Update rating
  await getDb()`
    UPDATE player_ratings
    SET 
      rating = ${newRating},
      games_played = games_played + 1,
      wins = wins + ${isWin ? 1 : 0},
      current_streak = ${isWin ? rating.current_streak + 1 : 0},
      best_streak = GREATEST(best_streak, ${isWin ? rating.current_streak + 1 : rating.current_streak}),
      last_played = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
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

export async function getLeaderboard(gameType: string, limit: number = 100) {
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
    JOIN users u ON pr.user_id = u.id
    WHERE pr.game_type = ${gameType} AND pr.games_played > 0
    ORDER BY pr.rating DESC
    LIMIT ${limit}
  `;

  return result;
}

export async function getGlobalLeaderboard(limit: number = 100) {
  // Aggregate ratings across all game types - use consistent column names
  const result = await getDb()`
    SELECT 
      u.anilist_id,
      u.username,
      u.avatar_url,
      AVG(pr.rating)::INTEGER as rating,
      SUM(pr.games_played)::INTEGER as games_played,
      SUM(pr.wins)::INTEGER as wins,
      MAX(pr.best_streak) as best_streak,
      RANK() OVER (ORDER BY AVG(pr.rating) DESC) as rank
    FROM player_ratings pr
    JOIN users u ON pr.user_id = u.id
    WHERE pr.games_played > 0
    GROUP BY u.id, u.anilist_id, u.username, u.avatar_url
    HAVING SUM(pr.games_played) >= 1
    ORDER BY rating DESC
    LIMIT ${limit}
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
