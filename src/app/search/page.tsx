'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { SmartHeader } from '@/components/layout/smart-header';
import { AnimeCard } from '@/components/design-system/anime-card';
import { Search, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useSettings } from '@/contexts/settings-context';

// Grid layout classes based on user preference
function getGridClasses(layout: 'compact' | 'comfortable' | 'spacious'): string {
  switch (layout) {
    case 'compact':
      return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3';
    case 'spacious':
      return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5';
    case 'comfortable':
    default:
      return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4';
  }
}

const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy',
  'Horror', 'Mahou Shoujo', 'Mecha', 'Music', 'Mystery',
  'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports',
  'Supernatural', 'Thriller',
];

const YEARS = Array.from({ length: 26 }, (_, i) => 2026 - i);
const STATUS = ['RELEASING', 'FINISHED', 'NOT_YET_RELEASED', 'CANCELLED', 'HIATUS'];
const FORMATS = ['TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA', 'MUSIC'];
const SORTS = [
  { key: 'POPULARITY_DESC', label: 'Popularity' },
  { key: 'SCORE_DESC', label: 'Score' },
  { key: 'TRENDING_DESC', label: 'Trending' },
  { key: 'START_DATE_DESC', label: 'Newest' },
  { key: 'START_DATE', label: 'Oldest' },
  { key: 'FAVOURITES_DESC', label: 'Favorites' },
];

const SEASONS = [
  { key: 'WINTER', label: 'Winter' },
  { key: 'SPRING', label: 'Spring' },
  { key: 'SUMMER', label: 'Summer' },
  { key: 'FALL', label: 'Fall' },
];

const SOURCES = [
  { key: 'ORIGINAL', label: 'Original' },
  { key: 'MANGA', label: 'Manga' },
  { key: 'LIGHT_NOVEL', label: 'Light Novel' },
  { key: 'NOVEL', label: 'Novel' },
  { key: 'VISUAL_NOVEL', label: 'Visual Novel' },
  { key: 'VIDEO_GAME', label: 'Video Game' },
  { key: 'ANIME', label: 'Anime' },
  { key: 'DOUJINSHI', label: 'Doujinshi' },
  { key: 'OTHER', label: 'Other' },
];

const COUNTRIES = [
  { key: 'JP', label: 'Japan' },
  { key: 'CN', label: 'China' },
  { key: 'KR', label: 'South Korea' },
  { key: 'TW', label: 'Taiwan' },
];

interface SearchResult {
  id: number;
  title: string;
  image: string;
  format?: string;
  episodes?: number;
  score?: number;
  year?: number;
  genres?: string[];
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
      style={{
        background: active ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
        color: active ? '#fff' : 'var(--text-secondary)',
        border: active ? 'none' : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {label}
    </button>
  );
}

function FilterDropdown({
  label,
  options,
  selected,
  onSelect,
  onClear,
}: {
  label: string;
  options: string[] | { key: string; label: string }[];
  selected: string | null;
  onSelect: (val: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors"
        style={{
          background: selected ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
          color: selected ? '#fff' : 'var(--text-secondary)',
        }}
      >
        {label}
        {selected && (
          <span
            className="ml-1 px-1 rounded text-[10px]"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          >
            {typeof options[0] === 'string'
              ? selected
              : (options as { key: string; label: string }[]).find((o) => o.key === selected)?.label ?? selected}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute top-full left-0 mt-1 z-50 rounded-md py-1 min-w-[160px] max-h-[260px] overflow-y-auto"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
            }}
          >
            {selected && (
              <button
                onClick={() => { onClear(); setOpen(false); }}
                className="block w-full text-left px-4 py-2 text-xs transition-colors hover:bg-white/5"
                style={{ color: 'var(--accent-color)' }}
              >
                Clear
              </button>
            )}
            {(options as (string | { key: string; label: string })[]).map((opt) => {
              const val = typeof opt === 'string' ? opt : opt.key;
              const text = typeof opt === 'string' ? opt : opt.label;
              return (
                <button
                  key={val}
                  onClick={() => { onSelect(val); setOpen(false); }}
                  className="block w-full text-left px-4 py-2 text-xs transition-colors hover:bg-white/5"
                  style={{ color: selected === val ? 'var(--accent-color)' : 'var(--text-primary)' }}
                >
                  {text}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  const rawParams = useSearchParams();
  const { defaultSort, adultContent, gridLayout } = useSettings();

  const [query, setQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [tags, setTags] = useState('');
  const [year, setYear] = useState<string | null>(null);
  const [season, setSeason] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [format, setFormat] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [isAdult, setIsAdult] = useState(adultContent);
  const [sort, setSort] = useState(defaultSort);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [showTagsPanel, setShowTagsPanel] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const initialMount = useRef(true);
  const abortRef = useRef<AbortController | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Tags from AniList
  const [availableTags, setAvailableTags] = useState<Array<{ name: string; category: string }>>([]);
  const [tagsLoading, setTagsLoading] = useState(true);

  // Fetch popular tags once on mount
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/anilist/tags', { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`Tags API returned ${r.status}`);
        return r.json();
      })
      .then((d) => {
        setAvailableTags(d.results || []);
      })
      .catch((err) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('[Search] Failed to load tags:', err);
      })
      .finally(() => { setTagsLoading(false); });
    return () => { controller.abort(); };
  }, []);

  // Initialize from URL params
  const paramsString = rawParams.toString();
  useEffect(() => {
    const q = rawParams.get('q') || '';
    const genres = rawParams.get('genres')?.split(',').filter(Boolean) || [];
    const tagStr = rawParams.get('tags') || '';
    const y = rawParams.get('year') || null;
    const se = rawParams.get('season') || null;
    const s = rawParams.get('status') || null;
    const f = rawParams.get('format') || null;
    const src = rawParams.get('source') || null;
    const co = rawParams.get('country') || null;
    const ia = rawParams.get('isAdult') === 'true';
    const soParam = rawParams.get('sort');
    const so = (soParam && ['POPULARITY_DESC', 'SCORE_DESC', 'TRENDING_DESC', 'START_DATE_DESC', 'START_DATE'].includes(soParam))
      ? soParam
      : defaultSort;

    setQuery(q);
    setSelectedGenres(genres);
    setTags(tagStr);
    setYear(y);
    setSeason(se);
    setStatus(s);
    setFormat(f);
    setSource(src);
    setCountry(co);
    setIsAdult(ia);
    setSort(so as typeof defaultSort);

    // State is set above; auto-search effect will trigger performSearch on re-render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsString]);

  const performSearch = useCallback(async (
    q: string,
    genres: string[],
    y: string | null,
    s: string | null,
    f: string | null,
    so: string,
    tagInput: string,
    se: string | null,
    src: string | null,
    co: string | null,
    adult: boolean,
    currentPage: number = 1,
    append: boolean = false,
  ) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setLoading(true);
    }
    setHasSearched(true);
    setSearchError(null);
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (genres.length) params.set('genres', genres.join(','));
      if (tagInput) params.set('tags', tagInput.split(',').map((t) => t.trim()).filter(Boolean).join(','));
      if (y) params.set('year', y);
      if (se) params.set('season', se);
      if (s) params.set('status', s);
      if (f) params.set('format', f);
      if (src) params.set('source', src);
      if (co) params.set('country', co);
      if (adult) params.set('isAdult', 'true');
      params.set('sort', so);
      params.set('page', String(currentPage));

      const res = await fetch(`/api/anilist/search?${params.toString()}`, { signal: abortRef.current.signal });
      if (!res.ok) {
        if (res.status === 429) {
          const retryAfter = res.headers.get('Retry-After') || '60';
          throw new Error(`Rate limited by AniList. Please wait ${retryAfter}s and try again.`);
        }
        const text = await res.text();
        throw new Error(`API returned ${res.status}: ${text.slice(0, 200)}`);
      }
      const data = await res.json();
      if (data.error) {
        setSearchError(data.error);
      }
      setResults((prev) => append ? [...prev, ...(data.results || [])] : (data.results || []));
      setHasNextPage(data.hasNextPage ?? false);
      setPage(currentPage);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setSearchError(err instanceof Error ? err.message : 'Search failed');
      if (!append) {
        setResults([]);
      }
      setHasNextPage(false);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  const handleSearch = () => {
    setPage(1);
    performSearch(query, selectedGenres, year, status, format, sort, tags, season, source, country, isAdult, 1, false);
  };

  const handleLoadMore = useCallback(() => {
    if (!hasNextPage || loading || isLoadingMore) return;
    performSearch(query, selectedGenres, year, status, format, sort, tags, season, source, country, isAdult, page + 1, true);
  }, [hasNextPage, loading, isLoadingMore, page, performSearch, query, selectedGenres, year, status, format, sort, tags, season, source, country, isAdult]);

  // Auto-search whenever any filter changes (debounced to avoid hammering AniList)
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }
    const timeoutId = setTimeout(() => {
      setPage(1);
      performSearch(query, selectedGenres, year, status, format, sort, tags, season, source, country, isAdult, 1, false);
    }, 350);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGenres, tags, year, season, status, format, source, country, isAdult, sort]);

  // Abort in-flight requests on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // Infinite scroll: load more when sentinel enters viewport
  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !loading) {
          handleLoadMore();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, loading, isLoadingMore, page, handleLoadMore]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);

  const toggleTag = (tagName: string) => {
    setTags((prev) => {
      const current = prev.split(',').map((t) => t.trim()).filter(Boolean);
      return current.includes(tagName)
        ? current.filter((t) => t !== tagName).join(',')
        : [...current, tagName].join(',');
    });
  };

  const activeFiltersCount =
    selectedGenres.length +
    (year ? 1 : 0) +
    (season ? 1 : 0) +
    (status ? 1 : 0) +
    (format ? 1 : 0) +
    (source ? 1 : 0) +
    (country ? 1 : 0) +
    (isAdult ? 1 : 0) +
    tagList.length;

  const handleReset = () => {
    setQuery('');
    setSelectedGenres([]);
    setTags('');
    setYear(null);
    setSeason(null);
    setStatus(null);
    setFormat(null);
    setSource(null);
    setCountry(null);
    setIsAdult(false);
    setSort('POPULARITY_DESC');
    setSearchError(null);
    setTagSearchQuery('');
    setPage(1);
    setHasNextPage(false);
  };

  // Filter tags by search query
  const filteredTags = tagSearchQuery.trim()
    ? availableTags.filter((t) =>
        t.name.toLowerCase().includes(tagSearchQuery.toLowerCase().trim())
      )
    : availableTags;

  // Group tags by category for display
  const tagsByCategory = filteredTags.reduce<Record<string, string[]>>((acc, tag) => {
    const cat = tag.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    if (tagSearchQuery.trim() || acc[cat].length < 30) acc[cat].push(tag.name);
    return acc;
  }, {});

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-deepest)' }}>
      <SmartHeader />

      <main className="max-w-[1400px] mx-auto px-4 pb-20">
        {/* Search Input */}
        <section className="py-8">
          <div
            className="flex items-center gap-3 max-w-xl mx-auto px-4 py-3 rounded-md"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
            }}
          >
            <Search size={18} style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search anime..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-60"
              style={{ color: 'var(--text-primary)' }}
            />
            <button
              onClick={handleSearch}
              className="px-4 py-1.5 rounded-md text-xs font-medium"
              style={{ background: 'var(--accent-color)', color: '#fff' }}
            >
              Search
            </button>
          </div>
        </section>

        {/* Filters */}
        <section className="mb-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {/* Tags Dropdown */}
            <FilterDropdown
              label="Tags"
              options={availableTags.map((t) => ({ key: t.name, label: t.name }))}
              selected={tagList.length > 0 ? `${tagList.length} selected` : null}
              onSelect={(val) => toggleTag(val)}
              onClear={() => setTags('')}
            />

            <FilterDropdown
              label="Genres"
              options={GENRES}
              selected={selectedGenres.length > 0 ? `${selectedGenres.length} selected` : null}
              onSelect={(val) => toggleGenre(val)}
              onClear={() => setSelectedGenres([])}
            />
            <FilterDropdown
              label="Year"
              options={YEARS.map(String)}
              selected={year}
              onSelect={setYear}
              onClear={() => setYear(null)}
            />
            <FilterDropdown
              label="Season"
              options={SEASONS}
              selected={season}
              onSelect={setSeason}
              onClear={() => setSeason(null)}
            />
            <FilterDropdown
              label="Status"
              options={STATUS.map((s) => ({ key: s, label: s.replace(/_/g, ' ') }))}
              selected={status}
              onSelect={setStatus}
              onClear={() => setStatus(null)}
            />
            <FilterDropdown
              label="Format"
              options={FORMATS.map((f) => ({ key: f, label: f.replace(/_/g, ' ') }))}
              selected={format}
              onSelect={setFormat}
              onClear={() => setFormat(null)}
            />
            <FilterDropdown
              label="Source"
              options={SOURCES}
              selected={source}
              onSelect={setSource}
              onClear={() => setSource(null)}
            />
            <FilterDropdown
              label="Country"
              options={COUNTRIES}
              selected={country}
              onSelect={setCountry}
              onClear={() => setCountry(null)}
            />
            {/* Adult Toggle */}
            <button
              onClick={() => setIsAdult((v) => !v)}
              className="px-3 py-2 rounded-md text-xs font-medium transition-colors"
              style={{
                background: isAdult ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
                color: isAdult ? '#fff' : 'var(--text-secondary)',
              }}
            >
              18+
            </button>

            {activeFiltersCount > 0 && (
              <button
                onClick={handleReset}
                className="text-xs transition-colors hover:underline"
                style={{ color: 'var(--accent-color)' }}
              >
                Reset all
              </button>
            )}
          </div>

          {/* Active filter pills — all filters */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-3 mb-2">
              {selectedGenres.map((genre) => (
                <button
                  key={`g-${genre}`}
                  onClick={() => toggleGenre(genre)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-90"
                  style={{ background: 'var(--accent-color)', color: '#fff' }}
                >
                  {genre}
                  <X size={12} strokeWidth={2.5} />
                </button>
              ))}
              {tagList.map((tag) => (
                <button
                  key={`t-${tag}`}
                  onClick={() => toggleTag(tag)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-90"
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {tag}
                  <X size={12} strokeWidth={2.5} />
                </button>
              ))}
              {year && (
                <button
                  onClick={() => setYear(null)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-90"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}
                >
                  Year: {year}
                  <X size={12} strokeWidth={2.5} />
                </button>
              )}
              {season && (
                <button
                  onClick={() => setSeason(null)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-90"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}
                >
                  {season}
                  <X size={12} strokeWidth={2.5} />
                </button>
              )}
              {status && (
                <button
                  onClick={() => setStatus(null)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-90"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}
                >
                  {status.replace(/_/g, ' ')}
                  <X size={12} strokeWidth={2.5} />
                </button>
              )}
              {format && (
                <button
                  onClick={() => setFormat(null)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-90"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}
                >
                  {format.replace(/_/g, ' ')}
                  <X size={12} strokeWidth={2.5} />
                </button>
              )}
              {source && (
                <button
                  onClick={() => setSource(null)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-90"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}
                >
                  {source}
                  <X size={12} strokeWidth={2.5} />
                </button>
              )}
              {country && (
                <button
                  onClick={() => setCountry(null)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-90"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}
                >
                  {country}
                  <X size={12} strokeWidth={2.5} />
                </button>
              )}
              {isAdult && (
                <button
                  onClick={() => setIsAdult(false)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-90"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
                >
                  18+
                  <X size={12} strokeWidth={2.5} />
                </button>
              )}
              <button
                onClick={handleReset}
                className="text-[11px] font-medium transition-colors hover:underline ml-1"
                style={{ color: 'var(--accent-color)' }}
              >
                Clear all
              </button>
            </div>
          )}

          {/* Genre quick-pick chips */}
          <div className="flex flex-wrap gap-2 mb-3">
            {GENRES.map((genre) => (
              <FilterChip
                key={genre}
                label={genre}
                active={selectedGenres.includes(genre)}
                onClick={() => toggleGenre(genre)}
              />
            ))}
          </div>

          {/* Tag panel toggle */}
          {!tagsLoading && Object.keys(tagsByCategory).length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => setShowTagsPanel((v) => !v)}
                className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider transition-colors hover:opacity-80"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {showTagsPanel ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {showTagsPanel ? 'Hide Tags' : 'Browse Tags'}
              </button>

              {showTagsPanel && (
                <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                  {/* Tag search */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md mb-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
                    <input
                      type="text"
                      value={tagSearchQuery}
                      onChange={(e) => setTagSearchQuery(e.target.value)}
                      placeholder="Search tags..."
                      className="flex-1 bg-transparent text-xs outline-none"
                      style={{ color: 'var(--text-primary)' }}
                    />
                    {tagSearchQuery && (
                      <button onClick={() => setTagSearchQuery('')} className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                        Clear
                      </button>
                    )}
                  </div>
                  {tagSearchQuery.trim() && (
                    <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                      {filteredTags.length} tag{filteredTags.length !== 1 ? 's' : ''} found
                    </p>
                  )}
                  {filteredTags.length === 0 ? (
                    <p className="text-xs py-2" style={{ color: 'var(--text-tertiary)' }}>
                      No tags match your search.
                    </p>
                  ) : (
                    Object.entries(tagsByCategory).map(([category, tagNames]) => (
                      <div key={category} className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                        <span
                          className="text-[10px] font-semibold uppercase tracking-wider shrink-0 w-20"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          {category}
                        </span>
                        <div className="flex flex-wrap gap-2 flex-1">
                          {tagNames.map((tagName) => (
                            <FilterChip
                              key={tagName}
                              label={tagName}
                              active={tagList.includes(tagName)}
                              onClick={() => toggleTag(tagName)}
                            />
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Results */}
        <section>
          {/* Results header: count + sort */}
          {hasSearched && results.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Found <span style={{ color: 'var(--text-primary)' }}>{results.length}</span> result{results.length !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Sort</span>
                <FilterDropdown
                  label="Sort"
                  options={SORTS}
                  selected={sort}
                  onSelect={(val) => setSort(val as typeof defaultSort)}
                  onClear={() => setSort(defaultSort)}
                />
              </div>
            </div>
          )}

          {loading ? (
            <div className={`grid ${getGridClasses(gridLayout)}`}>
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-2/3 rounded-md" style={{ background: 'var(--bg-surface)' }} />
                  <div className="h-4 rounded mt-2 w-3/4" style={{ background: 'var(--bg-surface)' }} />
                </div>
              ))}
            </div>
          ) : searchError ? (
            <div className="text-center py-20">
              <p className="text-base font-medium text-red-400">Search error</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {searchError}
              </p>
            </div>
          ) : hasSearched && results.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                No results found
              </p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Try adjusting your filters or search terms
              </p>
              <button
                onClick={handleReset}
                className="mt-4 px-4 py-2 rounded-md text-xs font-medium transition-colors"
                style={{ background: 'var(--accent-color)', color: '#fff' }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className={`grid ${getGridClasses(gridLayout)}`}>
              {results.map((r, i) => (
                <div
                  key={r.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${Math.min(i, 23) * 40}ms` }}
                >
                  <AnimeCard
                    id={r.id}
                    title={r.title}
                    imageUrl={r.image}
                    score={r.score}
                    format={r.format}
                    episodes={r.episodes}
                    year={r.year}
                    className="group block w-full"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Infinite scroll sentinel + loading indicator */}
          {hasSearched && (
            <div ref={sentinelRef} className="flex justify-center mt-8 py-4">
              {isLoadingMore && (
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent-color)', borderTopColor: 'transparent' }} />
                  Loading more...
                </div>
              )}
              {!hasNextPage && results.length > 0 && (
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  End of results
                </p>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
