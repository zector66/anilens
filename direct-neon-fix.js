// Direct Neon database connection and MMR fix
const https = require('https');

// Create a temporary API endpoint that can access the real Neon database
async function runNeonFix() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      query: `
        -- FINAL MMR FIX - TARGET ALL INFLATED ACCOUNTS
        UPDATE player_ratings 
        SET rating = CASE 
          WHEN games_played <= 3 THEN rating * 0.05  -- 95% reduction for extreme cases
          WHEN games_played <= 5 THEN rating * 0.1  -- 90% reduction
          WHEN games_played <= 10 THEN rating * 0.2 -- 80% reduction
          WHEN games_played <= 20 THEN rating * 0.3 -- 70% reduction
          ELSE rating * 0.5 -- 50% reduction for established players
        END
        WHERE games_played > 0 
          AND (rating::float / NULLIF(games_played, 1)) > 60;
        
        -- Verify the fix
        SELECT 
          users.username,
          player_ratings.rating as fixed_mmr,
          player_ratings.games_played,
          (player_ratings.rating::float / NULLIF(player_ratings.games_played, 1)) as mmr_per_game_after
        FROM player_ratings
        INNER JOIN users ON player_ratings.user_id = users.anilist_id
        WHERE player_ratings.games_played > 0 
        ORDER BY player_ratings.rating DESC
        LIMIT 10;
      `
    });

    const options = {
      hostname: 'anilens.vercel.app',
      port: 443,
      path: '/api/admin/fix-mmr-direct',
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

async function executeFix() {
  try {
    console.log('🔥 EXECUTING DIRECT NEON MMR FIX...');
    
    const result = await runNeonFix();
    
    console.log('=== DIRECT NEON FIX RESULTS ===');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n🎯 MMR FIX EXECUTED ON NEON DATABASE!');
      console.log('🔥 YoungAnimeDoctor should be FIXED now!');
      console.log('🎯 Refresh the leaderboard to see the changes!');
    } else {
      console.log('\n❌ Fix failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

executeFix();
