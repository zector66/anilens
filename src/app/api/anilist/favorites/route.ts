import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const FAVORITES_QUERY = `
  query($userId: Int) {
    User(id: $userId) {
      favourites {
        anime(perPage: 50) {
          nodes {
            id
            coverImage {
              large
              medium
            }
          }
        }
        manga(perPage: 50) {
          nodes {
            id
            coverImage {
              large
              medium
            }
          }
        }
      }
    }
  }
`;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query: FAVORITES_QUERY,
        variables: { userId: parseInt(userId) },
      }),
    });

    const data = await response.json();

    if (!response.ok || data.errors) {
      return NextResponse.json(
        { error: data.errors?.[0]?.message || 'Failed to fetch favorites' },
        { status: 500 }
      );
    }

    const anime = data.data?.User?.favourites?.anime?.nodes || [];
    const manga = data.data?.User?.favourites?.manga?.nodes || [];

    return NextResponse.json({
      anime: anime.map((m: { id: number; coverImage: { large?: string; medium?: string } }) => ({
        id: m.id,
        image: m.coverImage?.large || m.coverImage?.medium || '',
      })),
      manga: manga.map((m: { id: number; coverImage: { large?: string; medium?: string } }) => ({
        id: m.id,
        image: m.coverImage?.large || m.coverImage?.medium || '',
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch favorites';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
