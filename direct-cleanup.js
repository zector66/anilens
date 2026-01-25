// Direct database cleanup script
const { neon } = require('@neondatabase/serverless');

async function runCleanup() {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL not found in environment');
      process.exit(1);
    }

    const sql = neon(process.env.DATABASE_URL);
    
    console.log('=== MMR CLEANUP START ===');

    // Step 1: Identify inflated accounts
    console.log('\nStep 1: Identifying inflated MMR accounts...');
    const inflated = await sql`
      SELECT 
        users.anilist_id,
        users.username,
        player_ratings.game_type,
        player_ratings.rating as current_mmr,
        player_ratings.games_played
      FROM player_ratings
      INNER JOIN users ON player_ratings.user_id = users.id
      WHERE player_ratings.games_played > 0 
        AND player_ratings.rating > 500
        AND (player_ratings.rating::float / NULLIF(player_ratings.games_played, 1)) > 50
      ORDER BY (player_ratings.rating::float / NULLIF(player_ratings.games_played, 1)) DESC
    `;

    console.log(`Found ${inflated.length} inflated accounts:`);
    console.table(inflated.slice(0, 10));

    if (inflated.length > 0) {
      // Step 2: Apply corrections
      console.log('\nStep 2: Applying MMR corrections...');
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

      console.log('Applied corrections to inflated accounts');

      // Step 3: Verify results
      console.log('\nStep 3: Verifying cleanup results...');
      const topPlayers = await sql`
        SELECT 
          users.username,
          player_ratings.rating as fixed_mmr,
          player_ratings.games_played
        FROM player_ratings
        INNER JOIN users ON player_ratings.user_id = users.id
        WHERE player_ratings.games_played > 0 
        ORDER BY player_ratings.rating DESC
        LIMIT 20
      `;

      console.log('\nTop 20 players after fix:');
      console.table(topPlayers);

      console.log('\n=== MMR CLEANUP COMPLETE ===');
      console.log(`✅ Fixed ${inflated.length} inflated accounts`);
      console.log('✅ Rankings should now be balanced!');

    } else {
      console.log('✅ No inflated MMR accounts found - rankings are already balanced!');
    }

  } catch (error) {
    console.error('❌ Cleanup error:', error);
    process.exit(1);
  }
}

runCleanup();
