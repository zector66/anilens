import { NextResponse } from 'next/server';
import { anilistClient } from '@/lib/anilist-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const mediaId = parseInt(id, 10);
    if (isNaN(mediaId)) {
      return NextResponse.json({ error: 'Invalid media ID' }, { status: 400 });
    }

    const media = await anilistClient.getMediaDetails(mediaId);

    return NextResponse.json({
      id: media.id,
      title: {
        romaji: media.title?.romaji || '',
        english: media.title?.english || '',
        native: media.title?.native || '',
        userPreferred: media.title?.userPreferred || media.title?.romaji || media.title?.english || 'Unknown',
      },
      description: media.description || '',
      type: media.type,
      format: media.format,
      status: media.status,
      episodes: media.episodes,
      duration: media.duration,
      chapters: media.chapters,
      volumes: media.volumes,
      coverImage: media.coverImage?.extraLarge || media.coverImage?.large || media.coverImage?.medium || '',
      bannerImage: media.bannerImage || '',
      genres: media.genres || [],
      tags: media.tags?.map((t: { name: string; rank?: number; isGeneralSpoiler?: boolean; isMediaSpoiler?: boolean }) => ({
        name: t.name,
        rank: t.rank,
        isSpoiler: !!(t.isGeneralSpoiler || t.isMediaSpoiler),
      })) || [],
      meanScore: media.meanScore,
      popularity: media.popularity,
      trending: media.trending,
      favourites: media.favourites,
      season: media.season,
      seasonYear: media.seasonYear,
      startDate: media.startDate,
      endDate: media.endDate,
      studios: media.studios?.edges
        ?.filter((e: { isMain?: boolean }) => e.isMain)
        .map((e: { node?: { id: number; name: string } }) => e.node)
        .filter(Boolean) || [],
      relations: media.relations?.edges
        ?.filter((e: { node?: { id: number } }) => e.node?.id)
        .map((e: { relationType?: string; node?: { id: number; title?: { romaji?: string; english?: string }; type?: string; format?: string; coverImage?: { extraLarge?: string; large?: string; medium?: string } } }) => ({
          id: e.node!.id,
          title: e.node!.title?.romaji || e.node!.title?.english || 'Unknown',
          type: e.node!.type,
          format: e.node!.format,
          image: e.node!.coverImage?.extraLarge || e.node!.coverImage?.large || e.node!.coverImage?.medium || '',
          relationType: e.relationType,
        })) || [],
      trailer: media.trailer
        ? { id: media.trailer.id, site: media.trailer.site, thumbnail: media.trailer.thumbnail }
        : null,
      characters: media.characters?.edges
        ?.slice(0, 12)
        .map((e: {
          role?: string;
          node?: { id: number; name?: { full?: string }; image?: { medium?: string } };
          voiceActors?: Array<{ id: number; name?: { full?: string }; image?: { medium?: string }; language?: string }>;
        }) => ({
          id: e.node!.id,
          name: e.node!.name?.full || 'Unknown',
          image: e.node!.image?.medium || '',
          role: e.role,
          voiceActor: e.voiceActors?.[0]
            ? {
                id: e.voiceActors[0].id,
                name: e.voiceActors[0].name?.full || 'Unknown',
                image: e.voiceActors[0].image?.medium || '',
              }
            : null,
        })) || [],
      staff: media.staff?.edges
        ?.map((e: { role?: string; node?: { id: number; name?: { full?: string }; image?: { large?: string; medium?: string } } }) => ({
          id: e.node!.id,
          name: e.node!.name?.full || 'Unknown',
          image: e.node!.image?.large || e.node!.image?.medium || '',
          role: e.role,
        })) || [],
      externalLinks: media.externalLinks
        ?.filter((l: { site?: string; url?: string }) => l.site && l.url)
        .map((l: { site: string; url: string }) => ({ site: l.site, url: l.url })) || [],
      rankings: (media as unknown as { rankings?: Array<{ id: number; rank: number; type: string; format?: string; year?: number; season?: string; allTime?: boolean; context?: string }> }).rankings
        ?.filter((r) => typeof r?.rank === 'number')
        .map((r) => ({
          id: r.id,
          rank: r.rank,
          type: r.type,
          format: r.format,
          year: r.year,
          season: r.season,
          allTime: !!r.allTime,
          context: r.context,
        })) || [],
      recommendations: media.recommendations?.edges
        ?.filter((e: { node?: { mediaRecommendation?: { id?: number } } }) => e.node?.mediaRecommendation?.id)
        .map((e: { node?: { mediaRecommendation?: { id: number; title?: { romaji?: string; english?: string }; type?: string; format?: string; coverImage?: { extraLarge?: string; large?: string; medium?: string } } } }) => ({
          id: e.node!.mediaRecommendation!.id,
          title: e.node!.mediaRecommendation!.title?.romaji || e.node!.mediaRecommendation!.title?.english || 'Unknown',
          type: e.node!.mediaRecommendation!.type,
          format: e.node!.mediaRecommendation!.format,
          image: e.node!.mediaRecommendation!.coverImage?.extraLarge || e.node!.mediaRecommendation!.coverImage?.large || e.node!.mediaRecommendation!.coverImage?.medium || '',
        })) || [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch media details';
    console.error('[Media API]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
