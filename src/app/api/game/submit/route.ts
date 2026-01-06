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
      difficulty 
    } = await request.json();

    if (!anilistId || !username || !gameType || score === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get or create user
    const user = await getOrCreateUser(anilistId, username, avatarUrl);

    // Update rating and record game
    const ratingResult = await updateRatingAfterGame(
      user.id,
      gameType,
      score,
      maxScore || score,
      correctCount || 0,
      questionsCount || 10,
      avgTime || 0,
      difficulty || 'mixed'
    );

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
    console.error('Game submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit game' },
      { status: 500 }
    );
  }
}
