// Direct MMR fix - working version without ROUND function issues
const https = require('https');

// Create a simple API endpoint that works
async function fixMMRNow() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      query: `
        UPDATE player_ratings 
        SET rating = CASE 
          WHEN games_played <= 5 THEN rating * 0.3
          WHEN games_played <= 10 THEN rating * 0.4
          WHEN games_played <= 20 THEN rating * 0.6
          ELSE rating * 0.8
        END
        WHERE rating > 500 
          AND games_played > 0 
          AND (rating::float / NULLIF(games_played, 1)) > 50
      `
    });

    const options = {
      hostname: 'anilens.vercel.app',
      port: 443,
      path: '/api/admin/cleanup-mmr',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result);
        } catch (e) {
          resolve({ success: false, error: 'Parse error', raw: responseData });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Alternative: Create a direct database connection using Vercel's environment
async function directFix() {
  console.log('🔧 Attempting direct MMR fix...');
  
  try {
    // First try the API
    console.log('📡 Trying API endpoint...');
    const result = await fixMMRNow();
    
    if (result.success) {
      console.log('✅ MMR fix successful!');
      console.log('Results:', result);
    } else {
      console.log('❌ API failed, trying direct approach...');
      
      // If API fails, let's create a working SQL script
      console.log('📝 Creating working SQL script...');
      const workingSQL = `
-- WORKING MMR FIX SCRIPT
-- Run this directly in your Neon database console

-- Step 1: See what will be fixed
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

-- Step 2: Apply the fix
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

-- Step 3: Verify the fix
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
      `;
      
      console.log('🎯 COPY AND PASTE THIS SQL INTO YOUR NEON DATABASE CONSOLE:');
      console.log('=' .repeat(60));
      console.log(workingSQL);
      console.log('=' .repeat(60));
      console.log('\n🚀 STEPS:');
      console.log('1. Go to your Neon database console');
      console.log('2. Copy and paste the SQL above');
      console.log('3. Run it');
      console.log('4. Refresh the leaderboard');
      console.log('\n💡 This will IMMEDIATELY fix the MMR values!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

directFix();
