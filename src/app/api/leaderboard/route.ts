import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard, getGlobalLeaderboard, getStaleAvatarUsers, getOrCreateUser } from '@/lib/db';
import { anilistClient } from '@/lib/anilist-client';

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

    // Async avatar refresh: find stale users and update them in the background
    // so the leaderboard stays current without blocking the response
    const userIds = leaderboard.map((p: { anilist_id: number }) => p.anilist_id);
    if (userIds.length > 0) {
      refreshStaleAvatars(userIds).catch(err => {
        console.warn('[Leaderboard] Background avatar refresh failed:', err);
      });
    }

    return NextResponse.json({
      success: true,
      leaderboard,
      gameType: gameType || 'global',
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

/**
 * Background refresh of stale avatar URLs
 * Non-blocking: runs after the API response is sent
 */
async function refreshStaleAvatars(anilistIds: number[]) {
  try {
    const staleUsers = await getStaleAvatarUsers(anilistIds, 7, 5);
    if (staleUsers.length === 0) return;

    console.log(`[Leaderboard] Refreshing ${staleUsers.length} stale avatars`);

    // Refresh one by one to avoid rate limits
    for (const user of staleUsers) {
      try {
        const freshUser = await anilistClient.getUserByUsername(user.username);
        if (freshUser) {
          await getOrCreateUser(
            freshUser.id,
            freshUser.name,
            freshUser.avatar?.large || freshUser.avatar?.medium
          );
        }
      } catch (e) {
        console.warn(`[Leaderboard] Failed to refresh avatar for ${user.username}:`, e);
      }
      // Small delay between requests
      await new Promise(r => setTimeout(r, 200));
    }
  } catch (e) {
    console.error('[Leaderboard] Avatar refresh error:', e);
  }
}
