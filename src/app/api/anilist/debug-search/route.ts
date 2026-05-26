import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const genres = searchParams.get('genres')?.split(',').filter(Boolean) || [];

    const query = `
      query($genres: [String]) {
        Page(page: 1, perPage: 5) {
          pageInfo { hasNextPage }
          media(type: ANIME, genre_in: $genres, sort: [POPULARITY_DESC]) {
            id
            title { romaji }
            genres
            meanScore
          }
        }
      }
    `;

    const variables = genres.length > 0 ? { genres } : {};

    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `AniList returned ${res.status}`, body: text.slice(0, 500) },
        { status: 502 }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      anilistStatus: res.status,
      anilistData: data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Debug search failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
