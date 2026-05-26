'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { SmartHeader } from '@/components/layout/smart-header';
import { AnimeCard, EditPanel } from '@/components/design-system/anime-card';
import { SectionHeader } from '@/components/design-system/section-header';
import { useSettings } from '@/contexts/settings-context';
import { useProxyImage } from '@/hooks/use-proxy-image';
import {
  getAnimeThemes,
  getThemeTitle,
  filterOpenings,
  filterEndings,
  type AnimeTheme,
} from '@/lib/animethemes';
import { Plus, ExternalLink, Star, Heart, TrendingUp, Calendar, Music, Award, Flame, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

type TabKey = 'overview' | 'characters' | 'related';

interface Character {
  id: number;
  name: string;
  image: string;
  role?: string;
  voiceActor: { id: number; name: string; image: string } | null;
}

interface Relation {
  id: number;
  title: string;
  type?: string;
  format?: string;
  image: string;
  relationType?: string;
}

interface Ranking {
  id: number;
  rank: number;
  type: string; // RATED | POPULAR
  format?: string;
  year?: number;
  season?: string;
  allTime: boolean;
  context?: string;
}

interface MediaDetail {
  id: number;
  title: { romaji?: string; english?: string; native?: string; userPreferred?: string };
  description: string;
  type?: string;
  format?: string;
  status?: string;
  episodes?: number;
  duration?: number;
  chapters?: number;
  volumes?: number;
  coverImage: string;
  bannerImage: string;
  genres: string[];
  tags: { name: string; rank?: number; isSpoiler?: boolean }[];
  meanScore?: number;
  popularity?: number;
  trending?: number;
  favourites?: number;
  season?: string;
  seasonYear?: number;
  startDate?: { year?: number; month?: number; day?: number };
  endDate?: { year?: number; month?: number; day?: number };
  studios: { id: number; name: string }[];
  relations: Relation[];
  characters: Character[];
  externalLinks: { site: string; url: string }[];
  recommendations: Relation[];
  trailer: { id: string; site: string; thumbnail: string } | null;
  staff: Character[];
  rankings: Ranking[];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
}

function formatDate(d?: { year?: number; month?: number; day?: number }): string {
  if (!d?.year) return 'Unknown';
  const parts = [String(d.year)];
  if (d.month) parts.push(String(d.month).padStart(2, '0'));
  if (d.day) parts.push(String(d.day).padStart(2, '0'));
  return parts.join('-');
}

export default function AnimeDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { isOAuthAuthenticated } = useAuth();
  const { getPreferredTitle, showSpoilers } = useSettings();
  const proxyImage = useProxyImage();
  const [media, setMedia] = useState<MediaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [showEdit, setShowEdit] = useState(false);
  const [themes, setThemes] = useState<AnimeTheme[]>([]);
  const [themeSlug, setThemeSlug] = useState<string | null>(null);
  // One-off reveal of spoiler tags on this page (does not change global setting)
  const [revealSpoilers, setRevealSpoilers] = useState(false);

  // Fetch AnimeThemes openings/endings
  useEffect(() => {
    if (!media?.id) return;
    let cancelled = false;
    getAnimeThemes(media.id)
      .then((result) => {
        if (!cancelled) {
          setThemes(result.themes);
          setThemeSlug(result.slug);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [media?.id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    fetch(`/api/anilist/media/${id}`)
      .then((r) => { if (!r.ok) throw new Error(`Media API ${r.status}`); return r.json(); })
      .then((d) => {
        if (!cancelled) {
          setMedia(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-deepest)' }}>
        <SmartHeader />
        <main className="max-w-[1200px] mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-64 rounded-md w-full" style={{ background: 'var(--bg-surface)' }} />
            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
              <div className="h-80 rounded-md" style={{ background: 'var(--bg-surface)' }} />
              <div className="space-y-3">
                <div className="h-8 rounded w-1/2" style={{ background: 'var(--bg-surface)' }} />
                <div className="h-4 rounded w-full" style={{ background: 'var(--bg-surface)' }} />
                <div className="h-4 rounded w-3/4" style={{ background: 'var(--bg-surface)' }} />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!media) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-deepest)' }}>
        <SmartHeader />
        <main className="max-w-[1200px] mx-auto px-4 py-20 text-center">
          <p style={{ color: 'var(--text-tertiary)' }}>Anime not found.</p>
        </main>
      </div>
    );
  }

  const malLink = media.externalLinks.find((l) => l.site === 'MyAnimeList');

  const related = media.relations.filter((r) =>
    ['PREQUEL', 'SEQUEL', 'SIDE_STORY', 'SPIN_OFF', 'ALTERNATIVE', 'OTHER'].includes(
      r.relationType || ''
    )
  );

  const seasons = media.relations.filter((r) =>
    ['PREQUEL', 'SEQUEL', 'ALTERNATIVE'].includes(r.relationType || '')
  );

  // Separate spoiler vs. non-spoiler tags. Spoilers are hidden unless either
  // the user has enabled the global "Show Spoilers" setting, or they've used
  // the one-off reveal button on this page.
  const nonSpoilerTags = media.tags
    .filter((t) => !t.isSpoiler && (t.rank ?? 0) >= 60)
    .slice(0, 8);
  const spoilerTags = media.tags
    .filter((t) => t.isSpoiler && (t.rank ?? 0) >= 60)
    .slice(0, 8);
  const spoilersVisible = showSpoilers || revealSpoilers;

  // Rankings: pick the most notable to display (similar to AniList's style).
  // Prefer "Highest Rated All Time" and "Most Popular All Time", then current
  // season equivalents if present.
  const ratedAllTime = media.rankings.find((r) => r.type === 'RATED' && r.allTime);
  const popularAllTime = media.rankings.find((r) => r.type === 'POPULAR' && r.allTime);
  const ratedSeason = media.rankings.find((r) => r.type === 'RATED' && !r.allTime && !!r.season);
  const popularSeason = media.rankings.find((r) => r.type === 'POPULAR' && !r.allTime && !!r.season);
  const displayRankings: Ranking[] = [ratedAllTime, popularAllTime, ratedSeason, popularSeason]
    .filter((r): r is Ranking => !!r)
    .slice(0, 4);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-deepest)' }}>
      <SmartHeader />

      {/* Banner */}
      {media.bannerImage && (
        <div className="relative h-56 md:h-72 w-full overflow-hidden">
          <Image
            src={proxyImage(media.bannerImage)}
            alt={getPreferredTitle(media.title)}
            fill
            className="object-cover"
            priority
            unoptimized
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, transparent 40%, var(--bg-deepest) 100%)',
            }}
          />
        </div>
      )}

      <main className="max-w-[1200px] mx-auto px-4 pb-20 -mt-16 md:-mt-24 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
          {/* Left Sidebar */}
          <aside>
            {/* Cover */}
            <div
              className="relative w-full aspect-2/3 overflow-hidden mb-4"
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              <Image
                src={proxyImage(media.coverImage)}
                alt={getPreferredTitle(media.title)}
                fill
                className="object-cover"
                priority
                unoptimized
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 mb-4">
              {isOAuthAuthenticated && (
                <button
                  onClick={() => setShowEdit(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors hover:opacity-90"
                  style={{ background: 'var(--accent-color)', color: '#fff' }}
                >
                  <Plus size={16} /> Add to List
                </button>
              )}
              <div className="flex gap-2">
                <a
                  href={`https://anilist.co/anime/${media.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors hover:bg-white/10"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <ExternalLink size={12} /> AniList
                </a>
                {malLink && (
                  <a
                    href={malLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors hover:bg-white/10"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <ExternalLink size={12} /> MAL
                  </a>
                )}
              </div>
            </div>

            {/* Rankings */}
            {displayRankings.length > 0 && (
              <div className="flex flex-col gap-2 mb-4">
                {displayRankings.map((r) => (
                  <RankingBadge key={r.id} ranking={r} format={media.format} />
                ))}
              </div>
            )}

            {/* Metadata */}
            <div
              className="rounded-md p-4 space-y-2.5 text-xs"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <MetaRow label="Episodes" value={media.episodes?.toString() || 'Unknown'} />
              <MetaRow label="Duration" value={media.duration ? `${media.duration} min` : 'Unknown'} />
              <MetaRow
                label="Status"
                value={media.status?.replace(/_/g, ' ') || 'Unknown'}
                href={media.status ? `/search?status=${encodeURIComponent(media.status)}` : undefined}
              />
              <MetaRow
                label="Season"
                value={media.season ? `${media.season} ${media.seasonYear}` : 'Unknown'}
                href={
                  media.season && media.seasonYear
                    ? `/search?season=${encodeURIComponent(media.season)}&year=${media.seasonYear}`
                    : undefined
                }
              />
              <MetaRow label="Start" value={formatDate(media.startDate)} />
              <MetaRow label="End" value={formatDate(media.endDate)} />
              <MetaRow
                label="Format"
                value={media.format?.replace(/_/g, ' ') || 'Unknown'}
                href={media.format ? `/search?format=${encodeURIComponent(media.format)}` : undefined}
              />
              {media.chapters && (
                <MetaRow label="Chapters" value={String(media.chapters)} />
              )}
            </div>

            {/* Studios */}
            {media.studios.length > 0 && (
              <div className="mt-4">
                <h4
                  className="text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Studios
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {media.studios.map((s) => (
                    <span
                      key={s.id}
                      className="px-2 py-1 rounded text-[11px]"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Main Content */}
          <div>
            {/* Title & Stats */}
            <h1
              className="text-2xl md:text-3xl font-bold tracking-tight mb-3"
              style={{ color: 'var(--text-primary)' }}
            >
              {getPreferredTitle(media.title)}
            </h1>

            {/* Stats Row */}
            <div className="flex flex-wrap items-center gap-4 mb-4 text-xs">
              {media.meanScore !== undefined && media.meanScore > 0 && (
                <span
                  className="flex items-center gap-1"
                  style={{ color: 'var(--accent-color)' }}
                  title="Mean score (community rating)"
                >
                  <Star size={14} fill="currentColor" /> {media.meanScore}%
                </span>
              )}
              {media.popularity !== undefined && (
                <span
                  className="flex items-center gap-1"
                  style={{ color: 'var(--text-secondary)' }}
                  title="Popularity (users with this on their list)"
                >
                  <Heart size={14} /> {media.popularity.toLocaleString()}
                </span>
              )}
              {media.favourites !== undefined && (
                <span
                  className="flex items-center gap-1"
                  style={{ color: 'var(--text-secondary)' }}
                  title="Favorites (users who favorited this)"
                >
                  <TrendingUp size={14} /> {media.favourites.toLocaleString()}
                </span>
              )}
              {media.seasonYear && (
                <Link
                  href={`/search?year=${media.seasonYear}`}
                  className="flex items-center gap-1 transition-colors hover:opacity-80"
                  style={{ color: 'var(--text-secondary)' }}
                  title={`Browse anime from ${media.seasonYear}`}
                >
                  <Calendar size={14} /> {media.seasonYear}
                </Link>
              )}
            </div>

            {/* Genres */}
            {media.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {media.genres.map((genre) => (
                  <Link
                    key={genre}
                    href={`/search?genres=${encodeURIComponent(genre)}`}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors hover:bg-white/10"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {genre}
                  </Link>
                ))}
              </div>
            )}

            {/* Tags */}
            {(nonSpoilerTags.length > 0 || spoilerTags.length > 0) && (
              <div className="flex flex-wrap items-center gap-1.5 mb-6">
                {nonSpoilerTags.map((tag) => (
                  <Link
                    key={tag.name}
                    href={`/search?tags=${encodeURIComponent(tag.name)}`}
                    className="px-2 py-0.5 rounded text-[11px] transition-colors hover:bg-white/10"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      color: 'var(--text-tertiary)',
                    }}
                    title={`Browse anime tagged "${tag.name}"`}
                  >
                    {tag.name}
                  </Link>
                ))}
                {spoilersVisible &&
                  spoilerTags.map((tag) => (
                    <Link
                      key={tag.name}
                      href={`/search?tags=${encodeURIComponent(tag.name)}`}
                      className="px-2 py-0.5 rounded text-[11px] transition-colors hover:bg-white/10 flex items-center gap-1"
                      style={{
                        background: 'rgba(239, 68, 68, 0.12)',
                        color: 'rgb(252, 165, 165)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                      }}
                      title={`Spoiler tag — browse anime tagged "${tag.name}"`}
                    >
                      <EyeOff size={10} /> {tag.name}
                    </Link>
                  ))}
                {spoilerTags.length > 0 && !spoilersVisible && (
                  <button
                    onClick={() => setRevealSpoilers(true)}
                    className="px-2 py-0.5 rounded text-[11px] transition-colors hover:bg-white/10"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      color: 'var(--text-tertiary)',
                      border: '1px dashed rgba(255,255,255,0.15)',
                    }}
                    title="Reveal spoiler tags on this page only. Enable 'Show Spoilers' in settings to always show them."
                  >
                    + Show {spoilerTags.length} spoiler tag{spoilerTags.length === 1 ? '' : 's'}
                  </button>
                )}
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              {([
                { key: 'overview' as const, label: 'Overview' },
                { key: 'characters' as const, label: 'Characters' },
                { key: 'related' as const, label: 'Related' },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="px-4 py-2.5 text-sm font-medium transition-colors relative"
                  style={{
                    color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  }}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{ background: 'var(--accent-color)' }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Description */}
                {media.description && (
                  <section>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {stripHtml(media.description)}
                    </p>
                  </section>
                )}

                {/* Trailer */}
                {media.trailer && media.trailer.site === 'youtube' && (
                  <section>
                    <SectionHeader title="Trailer" />
                    <div
                      className="relative w-full overflow-hidden rounded-md"
                      style={{ aspectRatio: '16/9' }}
                    >
                      <iframe
                        src={`https://www.youtube.com/embed/${media.trailer.id}`}
                        title="Trailer"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                        style={{ border: 0 }}
                      />
                    </div>
                  </section>
                )}

                {/* Seasons / Related entries */}
                {seasons.length > 0 && (
                  <section>
                    <SectionHeader title="Seasons" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {seasons.map((s) => (
                        <AnimeCard
                          key={s.id}
                          id={s.id}
                          title={s.title}
                          imageUrl={s.image}
                          format={s.format}
                          className="group block w-full"
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Recommendations */}
                {media.recommendations.length > 0 && (
                  <section>
                    <SectionHeader title="Recommendations" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {media.recommendations.map((r) => (
                        <AnimeCard
                          key={r.id}
                          id={r.id}
                          title={r.title}
                          imageUrl={r.image}
                          format={r.format}
                          className="group block w-full"
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Staff */}
                {media.staff.length > 0 && (
                  <section>
                    <SectionHeader title="Staff" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {media.staff.map((person) => (
                        <div key={person.id} className="text-center">
                          <div
                            className="relative w-full aspect-square overflow-hidden mx-auto mb-2"
                            style={{ borderRadius: 'var(--radius-sm)' }}
                          >
                            <Image
                              src={proxyImage(person.image)}
                              alt={person.name}
                              fill
                              className="object-cover"
                              loading="lazy"
                              unoptimized
                            />
                          </div>
                          <h4
                            className="text-xs font-medium truncate"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {person.name}
                          </h4>
                          {person.role && (
                            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                              {person.role}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Openings & Endings */}
                {themes.length > 0 && (
                  <section>
                    <SectionHeader title="Openings & Endings" />
                    <div className="space-y-4">
                      {filterOpenings(themes).length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>
                            Openings
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {filterOpenings(themes).map((t) => (
                              <a
                                key={t.id}
                                href={themeSlug ? `https://animethemes.moe/anime/${themeSlug}` : '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors hover:bg-white/10"
                                style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}
                              >
                                <Music size={12} />
                                {getThemeTitle(t)}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {filterEndings(themes).length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>
                            Endings
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {filterEndings(themes).map((t) => (
                              <a
                                key={t.id}
                                href={themeSlug ? `https://animethemes.moe/anime/${themeSlug}` : '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors hover:bg-white/10"
                                style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}
                              >
                                <Music size={12} />
                                {getThemeTitle(t)}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </div>
            )}

            {activeTab === 'characters' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {media.characters.map((char) => (
                  <div key={char.id}>
                    <div className="flex items-start gap-2 mb-1.5">
                      <div
                        className="relative w-14 h-14 shrink-0 overflow-hidden"
                        style={{ borderRadius: 'var(--radius-sm)' }}
                      >
                        <Image
                          src={proxyImage(char.image)}
                          alt={char.name}
                          fill
                          className="object-cover"
                          loading="lazy"
                          unoptimized
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4
                          className="text-xs font-medium truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {char.name}
                        </h4>
                        {char.role && (
                          <span className="text-[10px] block" style={{ color: 'var(--text-tertiary)' }}>
                            {char.role}
                          </span>
                        )}
                      </div>
                    </div>
                    {char.voiceActor && (
                      <div className="flex items-center gap-2 mt-1.5 pl-1">
                        <div
                          className="relative w-8 h-8 shrink-0 overflow-hidden rounded-full"
                        >
                          <Image
                            src={proxyImage(char.voiceActor.image)}
                            alt={char.voiceActor.name}
                            fill
                            className="object-cover"
                            loading="lazy"
                            unoptimized
                          />
                        </div>
                        <span className="text-[10px] truncate" style={{ color: 'var(--text-secondary)' }}>
                          {char.voiceActor.name}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'related' && (
              <div className="space-y-6">
                {related.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {related.map((r) => (
                      <div key={r.id} className="group block w-full">
                        <AnimeCard
                          id={r.id}
                          title={r.title}
                          imageUrl={r.image}
                          format={r.format}
                          className="group block w-full"
                        />
                        {r.relationType && (
                          <div className="mt-2 text-xs font-medium text-center" style={{ color: 'var(--accent-color)' }}>
                            {formatRelationType(r.relationType)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    No related entries found.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Panel Modal */}
      {isOAuthAuthenticated && showEdit && media && (
        <EditPanel
          mediaId={media.id}
          title={getPreferredTitle(media.title)}
          totalEps={media.episodes}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  );
}

function MetaRow({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      {href ? (
        <Link
          href={href}
          className="font-medium transition-colors hover:opacity-80 hover:underline"
          style={{ color: 'var(--text-secondary)' }}
          title={`Browse anime with ${label.toLowerCase()}: ${value}`}
        >
          {value}
        </Link>
      ) : (
        <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
          {value}
        </span>
      )}
    </div>
  );
}

function formatRelationType(relationType?: string): string {
  if (!relationType) return '';
  
  switch (relationType) {
    case 'PREQUEL':
      return 'Prequel';
    case 'SEQUEL':
      return 'Sequel';
    case 'SIDE_STORY':
      return 'Side Story';
    case 'SPIN_OFF':
      return 'Spin-off';
    case 'ALTERNATIVE':
      return 'Alternative';
    case 'OTHER':
      return 'Other';
    default:
      return relationType.charAt(0) + relationType.slice(1).toLowerCase().replace(/_/g, ' ');
  }
}

function formatRankingLabel(r: Ranking): string {
  // Examples:
  // RATED + allTime -> "#4 Highest Rated All Time"
  // POPULAR + allTime -> "#9 Most Popular All Time"
  // RATED + season -> "#4 Highest Rated Spring 2026"
  // POPULAR + season -> "#9 Most Popular Spring 2026"
  const kind = r.type === 'RATED' ? 'Highest Rated' : r.type === 'POPULAR' ? 'Most Popular' : 'Trending';
  if (r.allTime) return `#${r.rank} ${kind} All Time`;
  if (r.season && r.year) {
    const season = r.season.charAt(0) + r.season.slice(1).toLowerCase();
    return `#${r.rank} ${kind} ${season} ${r.year}`;
  }
  if (r.year) return `#${r.rank} ${kind} ${r.year}`;
  // Fallback to AniList's own context if we don't recognize the shape
  return `#${r.rank} ${r.context || kind}`;
}

function RankingBadge({ ranking, format }: { ranking: Ranking; format?: string }) {
  const isRated = ranking.type === 'RATED';
  const Icon = isRated ? Award : Flame;
  const color = isRated ? 'var(--accent-color)' : 'rgb(236, 72, 153)'; // pink for popularity
  // Link to appropriate search page with format, season, and year filters
  const baseUrl = isRated ? '/search?sort=SCORE_DESC' : '/search?sort=POPULARITY_DESC';
  const params = new URLSearchParams();
  
  if (format) {
    params.set('format', format);
  }
  if (ranking.season) {
    params.set('season', ranking.season);
  }
  if (ranking.year) {
    params.set('year', ranking.year.toString());
  }
  
  const queryString = params.toString();
  const href = queryString ? `${baseUrl}&${queryString}` : baseUrl;
  const content = (
    <>
      <Icon size={14} style={{ color }} fill={isRated ? color : 'none'} />
      <span style={{ color: 'var(--text-secondary)' }}>{formatRankingLabel(ranking)}</span>
    </>
  );
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors hover:bg-white/10"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
      title={ranking.context || formatRankingLabel(ranking)}
    >
      {content}
    </Link>
  );
}
