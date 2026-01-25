-- Fix Inflated MMR Values
-- This script identifies and fixes users with unrealistic MMR values

-- Step 1: Identify users with inflated MMR (more than 200 MMR per game on average)
SELECT 
    u.anilist_id,
    u.username,
    pr.game_type,
    pr.rating as current_mmr,
    pr.games_played,
    ROUND(pr.rating::float / NULLIF(pr.games_played, 1), 2) as mmr_per_game,
    CASE 
        WHEN pr.games_played <= 5 THEN pr.rating * 0.3  -- Reduce by 70% for very few games
        WHEN pr.games_played <= 10 THEN pr.rating * 0.4  -- Reduce by 60% for few games  
        WHEN pr.games_played <= 20 THEN pr.rating * 0.6  -- Reduce by 40% for moderate games
        ELSE pr.rating * 0.8  -- Reduce by 20% for many games
    END as suggested_mmr
FROM player_ratings pr
JOIN users u ON pr.user_id = u.id
WHERE pr.games_played > 0 
  AND pr.rating > 500  -- Only fix high MMR
  AND (pr.rating::float / NULLIF(pr.games_played, 1)) > 50  -- More than 50 MMR per game
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
    u.anilist_id,
    u.username,
    pr.game_type,
    pr.rating as fixed_mmr,
    pr.games_played,
    ROUND(pr.rating::float / NULLIF(pr.games_played, 1), 2) as mmr_per_game_after_fix
FROM player_ratings pr
JOIN users u ON pr.user_id = u.id
WHERE pr.games_played > 0 
ORDER BY pr.rating DESC
LIMIT 20;
