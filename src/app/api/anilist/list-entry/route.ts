import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const LIST_ENTRY_QUERY = `
  query($userId: Int, $mediaId: Int) {
    MediaList(userId: $userId, mediaId: $mediaId) {
      id
      status
      score
      progress
      repeat
      notes
      startedAt { year month day }
      completedAt { year month day }
    }
  }
`;

/**
 * Get a user's list entry for a specific media.
 * Query params: mediaId (required), userId (required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get('mediaId');
    const userId = searchParams.get('userId');

    if (!mediaId || !userId) {
      return NextResponse.json(
        { success: false, error: 'mediaId and userId are required' },
        { status: 400 }
      );
    }

    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: LIST_ENTRY_QUERY,
        variables: {
          mediaId: parseInt(mediaId),
          userId: parseInt(userId),
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || data.errors) {
      return NextResponse.json(
        { success: false, error: data.errors?.[0]?.message || 'Failed to fetch list entry' },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      entry: data.data?.MediaList || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch list entry';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
