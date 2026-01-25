// Direct MMR cleanup using environment variables
const fs = require('fs');
const path = require('path');

// Read environment variables from .env.local
const envPath = path.join(__dirname, '.env.local');
let envVars = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });
}

async function runMMRCleanup() {
  try {
    const { neon } = require('@neondatabase/serverless');
    
    const databaseUrl = envVars.DATABASE_URL || envVars.POSTGRES_URL;
    if (!databaseUrl) {
      console.error('❌ No database URL found in environment variables');
      process.exit(1);
    }

    console.log('🔌 Connecting to database...');
    const sql = neon(databaseUrl);

    console.log('=== MMR CLEANUP START ===');

    // Step 1: Identify inflated accounts
    console.log('\n📊 Step 1: Identifying inflated MMR accounts...');
    const inflated = await sql`
      SELECT 
        users.anilist_id,
        users.username,
        player_ratings.game_type,
        player_ratings.rating as current_mmr,
        player_ratings.games_played,
        ROUND((player_ratings.rating::float / NULLIF(player_ratings.games_played, 1)), 2) as mmr_per_game
      FROM player_ratings
      INNER JOIN users ON player_ratings.user_id = users.id
      WHERE player_ratings.games_played > 0 
        AND player_ratings.rating > 500
        AND (player_ratings.rating::float / NULLIF(player_ratings.games_played, 1)) > 50
      ORDER BY (player_ratings.rating::float / NULLIF(player_ratings.games_played, 1)) DESC
      LIMIT 20
    `;

    console.log(`🎯 Found ${inflated.length} inflated accounts (showing top 20):`);
    console.table(inflated);

    if (inflated.length > 0) {
      // Step 2: Apply corrections
      console.log('\n🔧 Step 2: Applying MMR corrections...');
      const updateResult = await sql`
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
      `;

      console.log('✅ Applied corrections to inflated accounts');

      // Step 3: Verify results
      console.log('\n🏆 Step 3: Verifying cleanup results...');
      const topPlayers = await sql`
        SELECT 
          users.username,
          player_ratings.game_type,
          player_ratings.rating as fixed_mmr,
          player_ratings.games_played,
          ROUND((player_ratings.rating::float / NULLIF(player_ratings.games_played, 1)), 2) as mmr_per_game_after_fix
        FROM player_ratings
        INNER JOIN users ON player_ratings.user_id = users.id
        WHERE player_ratings.games_played > 0 
        ORDER BY player_ratings.rating DESC
        LIMIT 20
      `;

      console.log('\n🥇 Top 20 players after MMR fix:');
      console.table(topPlayers);

      // Show before/after comparison for the worst case
      if (inflated.length > 0) {
        const worstBefore = inflated[0];
        console.log('\n📈 Before/After Comparison (Worst Case):');
        console.log(`User: ${worstBefore.username}`);
        console.log(`Before: ${worstBefore.current_mmr} MMR (${worstBefore.games_played} games = ${worstBefore.mmr_per_game} MMR/game)`);
        
        const afterMultiplier = worstBefore.games_played <= 5 ? 0.3 : 
                               worstBefore.games_played <= 10 ? 0.4 : 
                               worstBefore.games_played <= 20 ? 0.6 : 0.8;
        const expectedAfter = Math.round(worstBefore.current_mmr * afterMultiplier);
        console.log(`After: ~${expectedAfter} MMR (${(expectedAfter / worstBefore.games_played).toFixed(2)} MMR/game)`);
        console.log(`Reduction: ${Math.round((1 - afterMultiplier) * 100)}%`);
      }

      console.log('\n=== MMR CLEANUP COMPLETE ===');
      console.log(`✅ Fixed ${inflated.length} inflated accounts`);
      console.log('✅ Rankings should now be balanced and competitive!');
      console.log('✅ Refresh the leaderboard to see the changes!');

    } else {
      console.log('✅ No inflated MMR accounts found - rankings are already balanced!');
    }

  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
    process.exit(1);
  }
}

runMMRCleanup();
