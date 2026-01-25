import { NextRequest, NextResponse } from 'next/server';

// Simple working MMR fix endpoint
export async function POST(request: NextRequest) {
  try {
    const { neon } = await import('@neondatabase/serverless');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not set');
    }
    
    const sql = neon(process.env.DATABASE_URL);
    
    console.log('🔧 EXECUTING MMR FIX NOW...');

    // Step 1: Find inflated accounts
    const inflated = await sql`
      SELECT 
        users.username,
        player_ratings.rating as current_mmr,
        player_ratings.games_played
      FROM player_ratings
      INNER JOIN users ON player_ratings.user_id = users.id
      WHERE player_ratings.games_played > 0 
        AND player_ratings.rating > 500
        AND (player_ratings.rating::float / NULLIF(player_ratings.games_played, 1)) > 50
      ORDER BY (player_ratings.rating::float / NULLIF(player_ratings.games_played, 1)) DESC
    `;

    console.log(`🎯 Found ${inflated.length} inflated accounts`);

    if (inflated.length > 0) {
      // Step 2: Apply the fix
      console.log('🔧 Applying MMR corrections...');
      await sql`
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

      console.log('✅ MMR corrections applied!');

      // Step 3: Show results
      const afterFix = await sql`
        SELECT 
          users.username,
          player_ratings.rating as fixed_mmr,
          player_ratings.games_played
        FROM player_ratings
        INNER JOIN users ON player_ratings.user_id = users.id
        WHERE player_ratings.games_played > 0 
        ORDER BY player_ratings.rating DESC
        LIMIT 10
      `;

      return NextResponse.json({
        success: true,
        message: 'MMR FIXED SUCCESSFULLY!',
        summary: {
          accounts_fixed: inflated.length,
          before_fix: inflated.slice(0, 5),
          after_fix: afterFix
        }
      });

    } else {
      return NextResponse.json({
        success: true,
        message: 'No inflated MMR accounts found'
      });
    }

  } catch (error) {
    console.error('❌ MMR fix error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fix MMR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
