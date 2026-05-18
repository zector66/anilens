/**
 * Taste Ratings API
 *
 * GET /api/taste/ratings?userId=X&mediaType=ANIME
 * Returns all rated media for a user (used to filter out from recommendations
 * and pre-fill the rating modal with previously-saved scores).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId') || '', 10);
    const mediaType = (searchParams.get('mediaType') || 'ANIME') as 'ANIME' | 'MANGA';

    if (!userId || isNaN(userId)) {
      return NextResponse.json({ error: 'Valid userId required' }, { status: 400 });
    }

    const rows = await getDb()`
      SELECT DISTINCT ON (anilist_media_id)
        anilist_media_id, actual_score, created_at
      FROM prediction_residuals
      WHERE user_id = ${userId}
        AND media_type = ${mediaType}
        AND actual_score IS NOT NULL
      ORDER BY anilist_media_id, created_at DESC
    `;

    const ratings: Record<number, number> = {};
    for (const r of rows) {
      ratings[Number(r.anilist_media_id)] = Number(r.actual_score);
    }

    return NextResponse.json({ ratings, count: Object.keys(ratings).length });
  } catch (error) {
    console.error('[Taste Ratings] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
