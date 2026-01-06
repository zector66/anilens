import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser, getAllPlayerRatings, getGameHistory, getGameStats } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { anilistId, username, avatarUrl } = await request.json();

    if (!anilistId || !username) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const user = await getOrCreateUser(anilistId, username, avatarUrl);
    const ratings = await getAllPlayerRatings(user.id);
    const history = await getGameHistory(user.id, 10);
    const stats = await getGameStats(user.id);

    return NextResponse.json({
      success: true,
      user,
      ratings,
      history,
      stats,
    });
  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get/create profile' },
      { status: 500 }
    );
  }
}
