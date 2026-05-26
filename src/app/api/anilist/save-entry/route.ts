import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SAVE_ENTRY_MUTATION = `
  mutation(
    $mediaId: Int,
    $status: MediaListStatus,
    $score: Float,
    $progress: Int,
    $repeat: Int,
    $notes: String,
    $startedAt: FuzzyDateInput,
    $completedAt: FuzzyDateInput
  ) {
    SaveMediaListEntry(
      mediaId: $mediaId,
      status: $status,
      score: $score,
      progress: $progress,
      repeat: $repeat,
      notes: $notes,
      startedAt: $startedAt,
      completedAt: $completedAt
    ) {
      id
      status
      score
      progress
      repeat
      notes
      startedAt { year month day }
      completedAt { year month day }
      media {
        id
        title { userPreferred }
      }
    }
  }
`;

/**
 * Save or update a user's media list entry on AniList.
 * Requires OAuth Bearer token in Authorization header.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid Authorization header' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { mediaId, status, score, progress, repeat, notes, startedAt, completedAt } = body;

    if (!mediaId) {
      return NextResponse.json(
        { success: false, error: 'mediaId is required' },
        { status: 400 }
      );
    }

    function parseFuzzyDate(dateStr: string | undefined) {
      if (!dateStr) return undefined;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return undefined;
      return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
    }

    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      body: JSON.stringify({
        query: SAVE_ENTRY_MUTATION,
        variables: {
          mediaId,
          status: status || undefined,
          score: score !== undefined ? score : undefined,
          progress: progress !== undefined ? progress : undefined,
          repeat: repeat !== undefined ? repeat : undefined,
          notes: notes !== undefined ? notes : undefined,
          startedAt: parseFuzzyDate(startedAt),
          completedAt: parseFuzzyDate(completedAt),
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || data.errors) {
      return NextResponse.json(
        { success: false, error: data.errors?.[0]?.message || 'Failed to save entry' },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json({ success: true, entry: data.data.SaveMediaListEntry });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save entry';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
