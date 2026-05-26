'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { AnimeCard } from './anime-card';

interface CategoryItem {
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

interface CategoryGridProps {
  categories: {
    trending: CategoryItem[];
    popular: CategoryItem[];
    topRated: CategoryItem[];
  };
  loading?: boolean;
}

const TABS = [
  { key: 'trending' as const, label: 'Trending', sort: 'TRENDING_DESC' },
  { key: 'popular' as const, label: 'Popular', sort: 'POPULARITY_DESC' },
  { key: 'topRated' as const, label: 'Top Rated', sort: 'SCORE_DESC' },
];

const MORE_LINKS = [
  { label: 'Upcoming', href: '/search?status=NOT_YET_RELEASED&sort=POPULARITY_DESC' },
  { label: 'This Season', href: '/search?sort=POPULARITY_DESC' },
  { label: 'Movies', href: '/search?format=MOVIE&sort=SCORE_DESC' },
];

export function CategoryGrid({ categories, loading }: CategoryGridProps) {
  const [activeTab, setActiveTab] = useState<'trending' | 'popular' | 'topRated'>('trending');
  const [showDropdown, setShowDropdown] = useState(false);

  const items = categories[activeTab];
  const activeSort = TABS.find((t) => t.key === activeTab)?.sort || 'POPULARITY_DESC';
  const seeAllHref = `/search?sort=${activeSort}`;

  return (
    <div>
      {/* Tabs + Dropdown */}
      <div className="flex items-center gap-2 mb-5">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={{
              background: activeTab === tab.key ? 'var(--accent-color)' : 'rgba(255,255,255,0.04)',
              color: activeTab === tab.key ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {tab.label}
          </button>
        ))}

        {/* More dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown((v) => !v)}
            className="flex items-center gap-1 px-3 py-2 rounded-md text-sm transition-colors"
            style={{
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--text-secondary)',
            }}
          >
            More <ChevronDown size={14} />
          </button>
          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowDropdown(false)}
              />
              <div
                className="absolute top-full left-0 mt-1 z-50 rounded-md py-1 min-w-[140px]"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-color)',
                }}
              >
                {MORE_LINKS.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setShowDropdown(false)}
                    className="block w-full text-left px-4 py-2 text-sm transition-colors hover:bg-white/5"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-2/3 rounded-md" style={{ background: 'var(--bg-surface)' }} />
              <div className="h-4 rounded mt-2 w-3/4" style={{ background: 'var(--bg-surface)' }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.slice(0, -1).map((item) => (
            <AnimeCard
              key={item.id}
              id={item.id}
              title={item.title}
              imageUrl={item.image}
              score={item.score}
              format={item.format}
              episodes={item.episodes}
              year={item.year}
              className="group block w-full"
            />
          ))}

          {/* See All card replaces last slot */}
          <Link
            href={seeAllHref}
            className="group block w-full"
          >
            <div
              className="relative w-full aspect-2/3 flex flex-col items-center justify-center gap-3 transition-all duration-300"
              style={{
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = 'var(--accent-color)';
                el.style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = 'rgba(255,255,255,0.08)';
                el.style.background = 'rgba(255,255,255,0.03)';
              }}
            >
              <ArrowRight
                size={28}
                style={{ color: 'var(--accent-color)' }}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
              <span
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: 'var(--text-secondary)' }}
              >
                See All
              </span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
