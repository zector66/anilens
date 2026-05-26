'use client';

import { useEffect, useRef, useState } from 'react';
import { SmartHeader } from '@/components/layout/smart-header';
import { AnimeCard } from '@/components/design-system/anime-card';
import { SectionHeader } from '@/components/design-system/section-header';
import { ContentRow } from '@/components/design-system/content-row';
import { SearchBar } from '@/components/design-system/search-bar';
import { HeroBackdrop } from '@/components/design-system/hero-backdrop';
import { LiveChat } from '@/components/design-system/live-chat';
import { WeeklySchedule } from '@/components/design-system/weekly-schedule';
import { CategoryGrid } from '@/components/design-system/category-grid';
import { GenrePills } from '@/components/design-system/genre-pills';
import { CompactList } from '@/components/design-system/compact-list';
import { useAuth } from '@/hooks/use-auth';

interface SearchResult {
  id: number;
  title: string;
  image: string;
  format?: string;
  episodes?: number;
  score?: number;
  genres?: string[];
  year?: number;
  status?: string;
}

export default function DesignPreview() {
  const { user, isAuthenticated } = useAuth();
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [heroReady, setHeroReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Live data
  const [trending, setTrending] = useState<SearchResult[]>([]);
  const [popular, setPopular] = useState<SearchResult[]>([]);
  const [topRated, setTopRated] = useState<SearchResult[]>([]);
  const [topAiring, setTopAiring] = useState<SearchResult[]>([]);
  const [justFinished, setJustFinished] = useState<SearchResult[]>([]);
  const [topMovies, setTopMovies] = useState<SearchResult[]>([]);
  const [schedule, setSchedule] = useState<Array<{
    id: number;
    title: string;
    image: string;
    episode: number;
    airingAt: number;
    timeUntilAiring: number;
    format?: string;
    totalEpisodes?: number;
    score?: number;
  }>>([]);

  // Search
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchScope, setSearchScope] = useState<'anime' | 'manga' | 'users'>('anime');
  const [isSearching, setIsSearching] = useState(false);
  const searchAbortRef = useRef<AbortController | null>(null);

  // Fetch landing data (trending, top airing, schedule) + hero backdrop
  useEffect(() => {
    let cancelled = false;

    // Trending — used for both the rail and hero backdrop
    fetch('/api/anilist/trending')
      .then(async (r) => {
        if (!r.ok) throw new Error(`Trending API ${r.status}`);
        const d = await r.json();
        if (cancelled) return;
        const results = d.results || [];
        setTrending(results);
        setLoadError(null);
        const trendingImages = results.map((m: SearchResult) => m.image).filter(Boolean);
        if (trendingImages.length > 0) {
          setHeroImages(trendingImages.slice(0, 50));
          setHeroReady(true);
        }
      })
      .catch((err) => {
        console.error('[Design] Trending fetch failed:', err);
        setLoadError('Failed to load anime data. Please refresh.');
      });

    // Popular
    fetch('/api/anilist/popular')
      .then(async (r) => { if (!r.ok) throw new Error(`Popular API ${r.status}`); return r.json(); })
      .then((d) => { if (!cancelled) setPopular(d.results || []); })
      .catch((err) => console.error('[Design] Popular fetch failed:', err));

    // Top Rated
    fetch('/api/anilist/top-rated')
      .then(async (r) => { if (!r.ok) throw new Error(`Top Rated API ${r.status}`); return r.json(); })
      .then((d) => { if (!cancelled) setTopRated(d.results || []); })
      .catch((err) => console.error('[Design] Top Rated fetch failed:', err));

    // Top airing
    fetch('/api/anilist/top-airing')
      .then(async (r) => { if (!r.ok) throw new Error(`Top Airing API ${r.status}`); return r.json(); })
      .then((d) => { if (!cancelled) setTopAiring(d.results || []); })
      .catch((err) => console.error('[Design] Top Airing fetch failed:', err));

    // Just Finished
    fetch('/api/anilist/just-finished')
      .then(async (r) => { if (!r.ok) throw new Error(`Just Finished API ${r.status}`); return r.json(); })
      .then((d) => { if (!cancelled) setJustFinished(d.results || []); })
      .catch((err) => console.error('[Design] Just Finished fetch failed:', err));

    // Top Movies
    fetch('/api/anilist/top-movies')
      .then(async (r) => { if (!r.ok) throw new Error(`Top Movies API ${r.status}`); return r.json(); })
      .then((d) => { if (!cancelled) setTopMovies(d.results || []); })
      .catch((err) => console.error('[Design] Top Movies fetch failed:', err));

    // Schedule
    fetch('/api/anilist/schedule')
      .then(async (r) => { if (!r.ok) throw new Error(`Schedule API ${r.status}`); return r.json(); })
      .then((d) => { if (!cancelled) setSchedule(d.results || []); })
      .catch((err) => console.error('[Design] Schedule fetch failed:', err));

    return () => { cancelled = true; };
  }, []);

  // When logged in: build hero from favorites → top-rated → trending
  // When logged out: revert hero to trending-only (stripping any prior personalized images)
  const userId = isAuthenticated ? user?.id : null;
  useEffect(() => {
    if (!userId) {
      // Logged out — reset hero to pure trending (no personalized leftover)
      const trendingImages = trending.map((m) => m.image).filter(Boolean);
      if (trendingImages.length > 0) {
        setHeroImages(trendingImages.slice(0, 50));
        setHeroReady(true);
      }
      return;
    }

    let cancelled = false;

    async function loadPersonalizedHero() {
      try {
        // 1. Try favorites first
        const favRes = await fetch(`/api/anilist/favorites?userId=${userId}`);
        if (!favRes.ok) throw new Error(`Favorites API ${favRes.status}`);
        const favData = await favRes.json();
        if (cancelled) return;

        const sources: string[] = [];
        if (favData.anime?.length) {
          sources.push(...favData.anime.map((a: { image: string }) => a.image).filter(Boolean));
        }
        if (favData.manga?.length) {
          sources.push(...favData.manga.map((m: { image: string }) => m.image).filter(Boolean));
        }

        // 2. If not enough favorites, pull from their list (rated first, then any)
        if (sources.length < 24) {
          try {
            const listRes = await fetch(`/api/anilist/list?userId=${userId}`);
            if (!listRes.ok) throw new Error(`List API ${listRes.status}`);
            const listData = await listRes.json();
            if (!cancelled && listData.results?.length) {
              const allEntries: Array<{ score?: number; image?: string }> = listData.results;
              const rated = allEntries
                .filter((e) => (e.score ?? 0) > 0 && e.image)
                .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
                .map((e) => e.image as string);
              const unrated = allEntries
                .filter((e) => (e.score ?? 0) === 0 && e.image)
                .map((e) => e.image as string);
              sources.push(...rated, ...unrated);
            }
          } catch {
            // ignore list fetch errors
          }
        }

        if (cancelled) return;

        // 3. Build final hero: user's content first, then fill with trending if needed
        const trendingImages = trending.map((m) => m.image).filter(Boolean);
        const seen = new Set<string>();
        const unique: string[] = [];

        // Add user's content first
        for (const img of sources) {
          if (img && !seen.has(img)) {
            seen.add(img);
            unique.push(img);
          }
        }

        // Fill remaining slots with trending (deduplicated)
        if (unique.length < 50) {
          for (const img of trendingImages) {
            if (img && !seen.has(img)) {
              seen.add(img);
              unique.push(img);
              if (unique.length >= 50) break;
            }
          }
        }

        if (unique.length > 0 && !cancelled) {
          setHeroImages(unique);
          setHeroReady(true);
        }
      } catch {
        // On any error, keep trending
      }
    }

    loadPersonalizedHero();
    return () => { cancelled = true; };
  }, [userId, trending]);

  const handleSearch = async (query: string, scope: 'anime' | 'manga' | 'users') => {
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }
    const controller = new AbortController();
    searchAbortRef.current = controller;

    setSearchScope(scope);
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search/${scope}?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Search API ${res.status}`);
      const data = await res.json();
      if (scope === 'users') {
        setSearchResults(data.results?.map((u: { id: number; name: string; avatar: string }) => ({
          id: u.id,
          title: u.name,
          image: u.avatar,
        })) || []);
      } else {
        setSearchResults(data.results || []);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-deepest)' }}>
      <SmartHeader />

      <main className="max-w-[1400px] mx-auto px-4 pb-20">
        {/* Error Banner */}
        {loadError && (
          <div className="mb-4 p-3 rounded-md text-sm text-center" style={{ background: 'rgba(255,70,70,0.15)', color: '#ff7a7a' }}>
            {loadError}{' '}
            <button
              onClick={() => window.location.reload()}
              className="underline font-medium"
              style={{ color: '#ffaaaa' }}
            >
              Refresh
            </button>
          </div>
        )}

        {/* Hero — Personalized favorites backdrop when logged in */}
        <div className={`transition-opacity duration-700 ${heroReady ? 'opacity-100' : 'opacity-0'}`}>
          <HeroBackdrop images={heroImages}>
            <section className="py-20 md:py-32 flex flex-col items-center text-center">
              <h1
                className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-[-0.03em] mb-6"
                style={{ color: 'var(--text-primary)' }}
              >
                {isAuthenticated ? `Welcome, ${user?.name ?? 'back'}` : 'AniLens'}
              </h1>
              <p
                className="text-lg md:text-xl max-w-lg leading-relaxed mb-8"
                style={{ color: 'var(--text-secondary)' }}
              >
                {isAuthenticated
                  ? 'Your anime taste, fully decoded. Deep analytics, games, and personalized discovery.'
                  : 'Your anime taste, fully decoded. Deep analytics, games, and personalized discovery.'}
              </p>
            </section>
          </HeroBackdrop>
        </div>
        {!heroReady && (
          <section className="py-20 md:py-32 flex flex-col items-center text-center">
            <h1
              className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-[-0.03em] mb-6"
              style={{ color: 'var(--text-primary)' }}
            >
              {isAuthenticated ? `Welcome, ${user?.name ?? 'back'}` : 'AniLens'}
            </h1>
            <p
              className="text-lg md:text-xl max-w-lg leading-relaxed mb-8"
              style={{ color: 'var(--text-secondary)' }}
            >
              Your anime taste, fully decoded. Deep analytics, games, and personalized discovery.
            </p>
          </section>
        )}

        {/* Genre Pills */}
        <section className="mb-8 -mx-4 px-4">
          <GenrePills />
        </section>

        {/* Explore */}
        <section className="mb-16 px-4">
          <SectionHeader
            title="Explore"
            subtitle="Search anime, manga, or users — no login required"
          />
          <div className="max-w-xl mx-auto">
            <SearchBar
              showScopes
              onSearch={handleSearch}
            />
          </div>

          {/* Search Results */}
          {isSearching ? (
            <div className="mt-6 flex justify-center">
              <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Searching...</span>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="mt-6">
              <SectionHeader title={`Results — ${searchScope}`} />
              <ContentRow>
                {searchResults.map((r) => (
                  <AnimeCard
                    key={r.id}
                    id={r.id}
                    title={r.title}
                    imageUrl={r.image}
                    score={r.score}
                    format={r.format}
                    episodes={r.episodes}
                    year={r.year}
                  />
                ))}
              </ContentRow>
            </div>
          ) : null}
        </section>

        {/* Main Content + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* Main Column */}
          <div>
            {/* Category Grid: Trending / Popular / Top Rated */}
            <section className="mb-12">
              <SectionHeader title="Browse" />
              <CategoryGrid
                categories={{ trending, popular, topRated }}
                loading={trending.length === 0}
              />
            </section>

            {/* Top Airing — Grid */}
            <section className="mb-12">
              <SectionHeader title="Top Airing" subtitle="Most popular currently airing" />
              {topAiring.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {topAiring.map((anime) => (
                    <AnimeCard
                      key={anime.id}
                      id={Number(anime.id)}
                      title={anime.title}
                      imageUrl={anime.image}
                      score={anime.score}
                      format={anime.format}
                      episodes={anime.episodes}
                      year={anime.year}
                      className="group block w-full"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Loading top airing...
                </div>
              )}
            </section>

            {/* Just Finished */}
            <section className="mb-12">
              <SectionHeader title="Just Finished" subtitle="Recently completed series" />
              {justFinished.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {justFinished.map((anime) => (
                    <AnimeCard
                      key={anime.id}
                      id={anime.id}
                      title={anime.title}
                      imageUrl={anime.image}
                      score={anime.score}
                      format={anime.format}
                      episodes={anime.episodes}
                      year={anime.year}
                      className="group block w-full"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Loading...
                </div>
              )}
            </section>

            {/* Top Movies */}
            <section className="mb-12">
              <SectionHeader title="Top Movies" subtitle="Highest rated anime films" />
              {topMovies.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {topMovies.map((anime) => (
                    <AnimeCard
                      key={anime.id}
                      id={anime.id}
                      title={anime.title}
                      imageUrl={anime.image}
                      score={anime.score}
                      format={anime.format}
                      episodes={anime.episodes}
                      year={anime.year}
                      className="group block w-full"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Loading...
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            {/* Live Chat */}
            <LiveChat />

            {/* Weekly Schedule */}
            {schedule.length > 0 && (
              <section className="mt-6">
                <WeeklySchedule entries={schedule} />
              </section>
            )}

            {/* Upcoming from schedule */}
            {schedule.length > 0 && (
              <section className="mt-6">
                <CompactList
                  title="Upcoming"
                  items={schedule.slice(0, 5).map((s) => ({
                    id: s.id,
                    title: s.title,
                    image: s.image,
                    format: s.format,
                    nextEpisode: s.episode,
                    timeUntil: s.timeUntilAiring,
                  }))}
                  showUpcoming
                />
              </section>
            )}
          </aside>
        </div>

      </main>
    </div>
  );
}
