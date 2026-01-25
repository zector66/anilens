import { NextRequest, NextResponse } from 'next/server';

// Aggressive MMR fix - target ALL inflated accounts
export async function POST(request: NextRequest) {
  try {
    const { neon } = await import('@neondatabase/serverless');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not set');
    }
    
    const sql = neon(process.env.DATABASE_URL);
    
    console.log('🔥 EXECUTING AGGRESSIVE MMR FIX...');

    // Step 1: Find ALL accounts with high MMR per game
    const inflated = await sql`
      SELECT 
        users.username,
        player_ratings.rating as current_mmr,
        player_ratings.games_played,
        player_ratings.game_type,
        (player_ratings.rating::float / NULLIF(player_ratings.games_played, 1)) as mmr_per_game
      FROM player_ratings
      INNER JOIN users ON player_ratings.user_id = users.anilist_id
      WHERE player_ratings.games_played > 0 
        AND player_ratings.rating > 300
      ORDER BY (player_ratings.rating::float / NULLIF(player_ratings.games_played, 1)) DESC
    `;

    console.log(`🎯 Found ${inflated.length} accounts to check`);

    if (inflated.length > 0) {
      // Step 2: Apply AGGRESSIVE fix to ALL high MMR accounts
      console.log('🔥 Applying aggressive MMR corrections...');
      const updateResult = await sql`
        UPDATE player_ratings 
        SET rating = CASE 
          WHEN games_played <= 3 THEN rating * 0.1  -- 90% reduction for very few games
          WHEN games_played <= 5 THEN rating * 0.2  -- 80% reduction for few games
          WHEN games_played <= 10 THEN rating * 0.3 -- 70% reduction for moderate games
          WHEN games_played <= 20 THEN rating * 0.5 -- 50% reduction for many games
          ELSE rating * 0.7 -- 30% reduction for established players
        END
        WHERE rating > 300 
          AND games_played > 0
      `;

      console.log('✅ Aggressive MMR corrections applied!');

      // Step 3: Show results
      const afterFix = await sql`
        SELECT 
          users.username,
          player_ratings.rating as fixed_mmr,
          player_ratings.games_played,
          player_ratings.game_type,
          (player_ratings.rating::float / NULLIF(player_ratings.games_played, 1)) as mmr_per_game_after
        FROM player_ratings
        INNER JOIN users ON player_ratings.user_id = users.anilist_id
        WHERE player_ratings.games_played > 0 
        ORDER BY player_ratings.rating DESC
        LIMIT 15
      `;

      return NextResponse.json({
        success: true,
        message: 'AGGRESSIVE MMR FIX COMPLETED!',
        summary: {
          accounts_checked: inflated.length,
          before_fix: inflated.slice(0, 10),
          after_fix: afterFix
        }
      });

    } else {
      return NextResponse.json({
        success: true,
        message: 'No accounts found to fix'
      });
    }

  } catch (error) {
    console.error('❌ Aggressive MMR fix error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fix MMR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
