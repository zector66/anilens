import { NextRequest, NextResponse } from 'next/server';
import { upsertUserOnLogin } from '@/lib/anilens-profile';

export async function POST(request: NextRequest) {
  try {
    const { anilistId, username, avatarUrl, bannerUrl, totalAnime, totalManga } = await request.json();

    if (!anilistId || !username) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: anilistId and username' },
        { status: 400 }
      );
    }

    const user = await upsertUserOnLogin(
      anilistId,
      username,
      avatarUrl,
      bannerUrl,
      totalAnime,
      totalManga
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Failed to sync profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
      og_unlocked: !!user.og_unlocked_at,
      og_unlocked_at: user.og_unlocked_at ?? null,
      chat_message_count: user.chat_message_count ?? 0,
    });
  } catch (error) {
    console.error('[API /user/sync] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
