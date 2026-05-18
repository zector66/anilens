/**
 * Taste Feedback API
 * 
 * POST /api/taste/feedback
 * Updates a prediction residual with the user's actual score.
 * Called when a user rates an anime that was previously recommended.
 * 
 * Body: {
 *   userId: number,
 *   anilistMediaId: number,
 *   actualScore: number (1-10)
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateResidualActualScore } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, anilistMediaId, actualScore, mediaType } = body;

    if (!userId || !anilistMediaId || actualScore == null) {
      return NextResponse.json(
        { error: 'userId, anilistMediaId, and actualScore required' },
        { status: 400 }
      );
    }

    if (actualScore < 1 || actualScore > 10) {
      return NextResponse.json(
        { error: 'actualScore must be between 1 and 10' },
        { status: 400 }
      );
    }

    await updateResidualActualScore(
      userId,
      anilistMediaId,
      actualScore,
      (mediaType || 'ANIME') as 'ANIME' | 'MANGA'
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Taste Feedback] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
