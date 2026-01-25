import { NextRequest, NextResponse } from 'next/server';

// Specific fix for YoungAnimeDoctor and other high MMR accounts
export async function POST(request: NextRequest) {
  try {
    const { neon } = await import('@neondatabase/serverless');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not set');
    }
    
    const sql = neon(process.env.DATABASE_URL);
    
    console.log('🎯 TARGETING SPECIFIC HIGH MMR ACCOUNTS...');

    // Step 1: Find the worst offenders
    const worstOffenders = await sql`
      SELECT 
        users.username,
        player_ratings.rating as current_mmr,
        player_ratings.games_played,
        player_ratings.game_type,
        (player_ratings.rating::float / NULLIF(player_ratings.games_played, 1)) as mmr_per_game
      FROM player_ratings
      INNER JOIN users ON player_ratings.user_id = users.anilist_id
      WHERE player_ratings.games_played > 0 
        AND (player_ratings.rating::float / NULLIF(player_ratings.games_played, 1)) > 80
      ORDER BY (player_ratings.rating::float / NULLIF(player_ratings.games_played, 1)) DESC
    `;

    console.log(`🎯 Found ${worstOffenders.length} worst offenders`);

    if (worstOffenders.length > 0) {
      // Step 2: Apply EXTREME fix to worst offenders
      console.log('🔥 Applying EXTREME MMR corrections...');
      await sql`
        UPDATE player_ratings 
        SET rating = CASE 
          WHEN games_played <= 3 THEN rating * 0.05  -- 95% reduction
          WHEN games_played <= 5 THEN rating * 0.1  -- 90% reduction
          WHEN games_played <= 10 THEN rating * 0.15 -- 85% reduction
          WHEN games_played <= 20 THEN rating * 0.25 -- 75% reduction
          ELSE rating * 0.4 -- 60% reduction
        END
        WHERE games_played > 0 
          AND (rating::float / NULLIF(games_played, 1)) > 80
      `;

      console.log('✅ EXTREME MMR corrections applied!');

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
        LIMIT 10
      `;

      return NextResponse.json({
        success: true,
        message: 'EXTREME MMR FIX COMPLETED!',
        summary: {
          worst_offenders_found: worstOffenders.length,
          before_fix: worstOffenders,
          after_fix: afterFix
        }
      });

    } else {
      return NextResponse.json({
        success: true,
        message: 'No worst offenders found'
      });
    }

  } catch (error) {
    console.error('❌ Extreme MMR fix error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fix MMR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
