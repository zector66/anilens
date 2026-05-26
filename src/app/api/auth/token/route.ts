import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Exchange AniList authorization code for an access token.
 * This must be server-side because it requires the client secret.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, redirectUri } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Missing authorization code' },
        { status: 400 }
      );
    }

    const clientId = process.env.NEXT_PUBLIC_ANILIST_CLIENT_ID;
    const clientSecret = process.env.ANILIST_CLIENT_SECRET;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Server misconfiguration: missing NEXT_PUBLIC_ANILIST_CLIENT_ID' },
        { status: 500 }
      );
    }

    if (!clientSecret) {
      return NextResponse.json(
        { error: 'Server misconfiguration: missing ANILIST_CLIENT_SECRET' },
        { status: 500 }
      );
    }

    const response = await fetch('https://anilist.co/api/v2/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data.error || 'Token exchange failed',
          message: data.error_description || data.message || 'Unknown error',
          hint: data.hint,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      accessToken: data.access_token,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token exchange failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
