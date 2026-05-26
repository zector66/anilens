import { NextResponse } from 'next/server';
import { anilistClient } from '@/lib/anilist-client';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // cache for 1 hour

export async function GET() {
  try {
    const tags = await anilistClient.getAllTags();
    return NextResponse.json({
      results: tags.map((t) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        rank: t.rank,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch tags';
    console.error('[Tags API]', message);
    return NextResponse.json({ error: message, results: [] }, { status: 200 });
  }
}
