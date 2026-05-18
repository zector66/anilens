/**
 * Batch Prediction Logging API
 * 
 * POST /api/taste/log-batch
 * Logs multiple predictions at once for a user.
 * Called from recommendations after predictions are computed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logPredictionResidual } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, mediaType, predictions } = body as {
      userId: number;
      mediaType: 'ANIME' | 'MANGA';
      predictions: Array<{
        anilistMediaId: number;
        predictedScore: number;
        features: Record<string, number>;
      }>;
    };

    if (!userId || !Array.isArray(predictions)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const results = await Promise.allSettled(
      predictions.map(p =>
        logPredictionResidual(
          userId,
          p.anilistMediaId,
          mediaType,
          p.predictedScore,
          null,
          p.features,
          'v3'
        )
      )
    );

    const logged = results.filter(r => r.status === 'fulfilled').length;

    return NextResponse.json({ success: true, logged });
  } catch (error) {
    console.error('[Log Batch] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
