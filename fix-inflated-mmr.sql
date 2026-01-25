-- Fix Inflated MMR Values
-- This script identifies and fixes users with unrealistic MMR values

-- Step 1: Identify users with inflated MMR (more than 50 MMR per game on average)
SELECT 
    users.anilist_id,
    users.username,
    player_ratings.game_type,
    player_ratings.rating as current_mmr,
    player_ratings.games_played,
    ROUND(player_ratings.rating::float / NULLIF(player_ratings.games_played, 1), 2) as mmr_per_game,
    CASE 
        WHEN player_ratings.games_played <= 5 THEN player_ratings.rating * 0.3  -- Reduce by 70% for very few games
        WHEN player_ratings.games_played <= 10 THEN player_ratings.rating * 0.4  -- Reduce by 60% for few games  
        WHEN player_ratings.games_played <= 20 THEN player_ratings.rating * 0.6  -- Reduce by 40% for moderate games
        ELSE player_ratings.rating * 0.8  -- Reduce by 20% for many games
    END as suggested_mmr
FROM player_ratings
INNER JOIN users ON player_ratings.user_id = users.id
WHERE player_ratings.games_played > 0 
  AND player_ratings.rating > 500  -- Only fix high MMR
  AND (player_ratings.rating::float / NULLIF(player_ratings.games_played, 1)) > 50  -- More than 50 MMR per game
ORDER BY mmr_per_game DESC;

-- Step 2: Apply the fixes (run this after reviewing the above results)
UPDATE player_ratings 
SET rating = CASE 
    WHEN games_played <= 5 THEN rating * 0.3  -- Reduce by 70% for very few games
    WHEN games_played <= 10 THEN rating * 0.4  -- Reduce by 60% for few games  
    WHEN games_played <= 20 THEN rating * 0.6  -- Reduce by 40% for moderate games
    ELSE rating * 0.8  -- Reduce by 20% for many games
END
WHERE rating > 500 
  AND games_played > 0 
  AND (rating::float / NULLIF(games_played, 1)) > 50;

-- Step 3: Verify the fixes
SELECT 
    users.anilist_id,
    users.username,
    player_ratings.game_type,
    player_ratings.rating as fixed_mmr,
    player_ratings.games_played,
    ROUND(player_ratings.rating::float / NULLIF(player_ratings.games_played, 1), 2) as mmr_per_game_after_fix
FROM player_ratings
INNER JOIN users ON player_ratings.user_id = users.id
WHERE player_ratings.games_played > 0 
ORDER BY player_ratings.rating DESC
LIMIT 20;
