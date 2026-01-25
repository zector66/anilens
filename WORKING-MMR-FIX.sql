-- WORKING MMR FIX - CORRECTED SQL SYNTAX
-- This will fix the inflated MMR values

-- STEP 1: See the problem accounts (CORRECTED)
SELECT 
  u.username,
  pr.rating as current_mmr,
  pr.games_played,
  (pr.rating::float / NULLIF(pr.games_played, 1)) as mmr_per_game
FROM player_ratings pr
JOIN users u ON pr.user_id = u.id
WHERE pr.games_played > 0 
  AND pr.rating > 500
  AND (pr.rating::float / NULLIF(pr.games_played, 1)) > 50
ORDER BY (pr.rating::float / NULLIF(pr.games_played, 1)) DESC;

-- STEP 2: FIX THE MMR VALUES (CORRECTED)
UPDATE player_ratings 
SET rating = CASE 
  WHEN games_played <= 5 THEN rating * 0.3
  WHEN games_played <= 10 THEN rating * 0.4
  WHEN games_played <= 20 THEN rating * 0.6
  ELSE rating * 0.8
END
WHERE rating > 500 
  AND games_played > 0 
  AND (rating::float / NULLIF(games_played, 1)) > 50;

-- STEP 3: VERIFY THE FIX (CORRECTED)
SELECT 
  u.username,
  pr.rating as fixed_mmr,
  pr.games_played,
  (pr.rating::float / NULLIF(pr.games_played, 1)) as mmr_per_game_after
FROM player_ratings pr
JOIN users u ON pr.user_id = u.id
WHERE pr.games_played > 0 
ORDER BY pr.rating DESC
LIMIT 20;
