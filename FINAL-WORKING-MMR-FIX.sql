-- FINAL WORKING MMR FIX - WITH DIAGNOSTIC
-- Run this step by step to identify the issue

-- STEP 0: Check what tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- STEP 0b: Check columns in users table
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- STEP 0c: Check columns in player_ratings table  
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'player_ratings' AND table_schema = 'public'
ORDER BY ordinal_position;

-- STEP 1: See the problem accounts (using full table names)
SELECT 
  users.username,
  player_ratings.rating as current_mmr,
  player_ratings.games_played,
  (player_ratings.rating::float / NULLIF(player_ratings.games_played, 1)) as mmr_per_game
FROM player_ratings
INNER JOIN users ON player_ratings.user_id = users.id
WHERE player_ratings.games_played > 0 
  AND player_ratings.rating > 500
  AND (player_ratings.rating::float / NULLIF(player_ratings.games_played, 1)) > 50
ORDER BY (player_ratings.rating::float / NULLIF(player_ratings.games_played, 1)) DESC;

-- STEP 2: FIX THE MMR VALUES (using full table names)
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

-- STEP 3: VERIFY THE FIX (using full table names)
SELECT 
  users.username,
  player_ratings.rating as fixed_mmr,
  player_ratings.games_played,
  (player_ratings.rating::float / NULLIF(player_ratings.games_played, 1)) as mmr_per_game_after
FROM player_ratings
INNER JOIN users ON player_ratings.user_id = users.id
WHERE player_ratings.games_played > 0 
ORDER BY player_ratings.rating DESC
LIMIT 20;
