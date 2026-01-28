import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard, getGlobalLeaderboard } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameType = searchParams.get('gameType');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let leaderboard;
    if (gameType && gameType !== 'global') {
      leaderboard = await getLeaderboard(gameType, limit, offset);
    } else {
      leaderboard = await getGlobalLeaderboard(limit, offset);
    }

    return NextResponse.json({
      success: true,
      leaderboard,
      gameType: gameType || 'global',
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
