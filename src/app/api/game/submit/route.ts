import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser, updateRatingAfterGame, getUserRank } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { 
      anilistId, 
      username, 
      avatarUrl,
      gameType, 
      score, 
      maxScore, 
      correctCount, 
      questionsCount, 
      avgTime,
      difficulty,
      timeLimit
    } = await request.json();

    console.log('[Game Submit API] Received:', { anilistId, username: username?.slice(0, 10), gameType, score, maxScore, correctCount, questionsCount });

    if (!anilistId || !username || !gameType || score === undefined) {
      console.error('[Game Submit API] Missing required fields:', { anilistId, username, gameType, score });
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get or create user
    const user = await getOrCreateUser(anilistId, username, avatarUrl);
    console.log('[Game Submit API] User:', { id: user.id, anilist_id: user.anilist_id });

    // Update rating and record game
    const ratingResult = await updateRatingAfterGame(
      user.id,
      gameType,
      score,
      maxScore || score,
      correctCount || 0,
      questionsCount || 10,
      avgTime || 0,
      difficulty || 'mixed',
      timeLimit
    );
    console.log('[Game Submit API] Rating result:', ratingResult);

    // Get updated rank
    const rank = await getUserRank(user.id, gameType);

    return NextResponse.json({
      success: true,
      ratingChange: ratingResult.change,
      oldRating: ratingResult.oldRating,
      newRating: ratingResult.newRating,
      isWin: ratingResult.isWin,
      rank,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Game Submit API] Error:', message);
    return NextResponse.json(
      { success: false, error: `Failed to submit game: ${message}` },
      { status: 500 }
    );
  }
}
