import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const VIEWER_QUERY = `
  query {
    Viewer {
      id
      name
      avatar {
        large
        medium
      }
      bannerImage
      statistics {
        anime {
          count
          meanScore
          minutesWatched
          episodesWatched
        }
        manga {
          count
          meanScore
          chaptersRead
          volumesRead
        }
      }
    }
  }
`;

/**
 * Server-side proxy for AniList authenticated Viewer lookup.
 * AniList's GraphQL endpoint blocks direct browser calls via CORS,
 * so the browser sends its OAuth token to us, and we forward it.
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

    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      body: JSON.stringify({ query: VIEWER_QUERY }),
    });

    const data = await response.json();

    if (!response.ok || !data.data?.Viewer) {
      return NextResponse.json(
        { success: false, error: data.errors?.[0]?.message || 'Failed to fetch viewer' },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json({ success: true, user: data.data.Viewer });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load viewer';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
