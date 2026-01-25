import { NextRequest, NextResponse } from 'next/server';

// NUKE option - fix ALL high MMR accounts
export async function POST(request: NextRequest) {
  try {
    const { neon } = await import('@neondatabase/serverless');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not set');
    }
    
    const sql = neon(process.env.DATABASE_URL);
    
    console.log('💥 NUKE ALL HIGH MMR ACCOUNTS...');

    // Step 1: Nuke ALL accounts with high MMR
    console.log('💥 Applying NUKE...');
    const updateResult = await sql`
      UPDATE player_ratings 
      SET rating = CASE 
        WHEN games_played <= 3 THEN FLOOR(rating * 0.02)  -- 98% reduction
        WHEN games_played <= 5 THEN FLOOR(rating * 0.05)  -- 95% reduction
        WHEN games_played <= 10 THEN FLOOR(rating * 0.1) -- 90% reduction
        WHEN games_played <= 20 THEN FLOOR(rating * 0.2) -- 80% reduction
        ELSE FLOOR(rating * 0.3) -- 70% reduction
      END
      WHERE games_played > 0 
        AND rating > 400
    `;

    console.log('💥 NUKE APPLIED!');

    // Step 2: Show results
    const afterNuke = await sql`
      SELECT 
        users.username,
        player_ratings.rating as nuked_mmr,
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
      message: '💥 MMR NUKE COMPLETED!',
      summary: {
        accounts_nuked: 'ALL HIGH MMR ACCOUNTS',
        after_nuke: afterNuke
      }
    });

  } catch (error) {
    console.error('❌ Nuke error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to nuke MMR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
