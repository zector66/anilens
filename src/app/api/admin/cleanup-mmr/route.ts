import { NextRequest, NextResponse } from 'next/server';

// Temporary endpoint to run MMR cleanup
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    // Simple password check (you should use proper auth in production)
    if (password !== 'cleanup_mmr_2025') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Import and run the database cleanup
    const { neon } = await import('@neondatabase/serverless');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not set');
    }
    
    const sql = neon(process.env.DATABASE_URL);

    console.log('=== MMR CLEANUP START ===');

    // Step 1: Identify inflated accounts
    console.log('Step 1: Identifying inflated MMR accounts...');
    const inflated = await sql`
      SELECT 
        users.anilist_id,
        users.username,
        player_ratings.game_type,
        player_ratings.rating as current_mmr,
        player_ratings.games_played,
        ROUND((player_ratings.rating::float / NULLIF(player_ratings.games_played, 1)), 2) as mmr_per_game,
        CASE 
          WHEN player_ratings.games_played <= 5 THEN player_ratings.rating * 0.3
          WHEN player_ratings.games_played <= 10 THEN player_ratings.rating * 0.4
          WHEN player_ratings.games_played <= 20 THEN player_ratings.rating * 0.6
          ELSE player_ratings.rating * 0.8
        END as suggested_mmr
      FROM player_ratings
      INNER JOIN users ON player_ratings.user_id = users.anilist_id
      WHERE player_ratings.games_played > 0 
        AND player_ratings.rating > 500
        AND (player_ratings.rating::float / NULLIF(player_ratings.games_played, 1)) > 50
      ORDER BY (player_ratings.rating::float / NULLIF(player_ratings.games_played, 1)) DESC
    `;

    console.log(`Found ${inflated.length} inflated accounts`);

    if (inflated.length > 0) {
      // Step 2: Apply corrections
      console.log('Step 2: Applying MMR corrections...');
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

      console.log(`Updated records`);

      // Step 3: Verify results
      console.log('Step 3: Verifying cleanup results...');
      const topPlayers = await sql`
        SELECT 
          users.anilist_id,
          users.username,
          player_ratings.game_type,
          player_ratings.rating as fixed_mmr,
          player_ratings.games_played,
          ROUND((player_ratings.rating::float / NULLIF(player_ratings.games_played, 1)), 2) as mmr_per_game_after_fix
        FROM player_ratings
        INNER JOIN users ON player_ratings.user_id = users.anilist_id
        WHERE player_ratings.games_played > 0 
        ORDER BY player_ratings.rating DESC
        LIMIT 20
      `;

      return NextResponse.json({
        success: true,
        message: 'MMR cleanup completed successfully',
        summary: {
          inflated_accounts_found: inflated.length,
          records_updated: 'updated',
          top_players_after_fix: topPlayers
        },
        details: {
          inflated_accounts: inflated.slice(0, 10), // Show top 10 problematic accounts
          before_and_after: {
            worst_before: inflated[0],
            best_after: topPlayers[0]
          }
        }
      });

    } else {
      return NextResponse.json({
        success: true,
        message: 'No inflated MMR accounts found - rankings are already balanced',
        summary: {
          inflated_accounts_found: 0,
          records_updated: 0
        }
      });
    }

  } catch (error) {
    console.error('MMR cleanup error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to cleanup MMR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
