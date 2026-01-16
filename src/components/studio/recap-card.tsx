'use client';

import React, { forwardRef } from 'react';
import { TrendingUp, TrendingDown, Minus, Trophy, Star, Clock, Film } from 'lucide-react';

export interface RecapData {
  period: {
    type: 'month' | 'season' | 'year';
    label: string; // e.g., "January 2024", "Winter 2024", "2024"
    startDate: string;
    endDate: string;
  };
  stats: {
    titlesCompleted: number;
    episodesWatched?: number;
    chaptersRead?: number;
    hoursSpent: number;
    avgScore: number;
  };
  highlights: {
    topTitle?: { name: string; cover?: string; score: number };
    mostWatched?: { name: string; episodes: number };
    discoveryOfPeriod?: { name: string; cover?: string };
  };
  genres: Array<{ name: string; count: number; trend: 'up' | 'down' | 'stable' }>;
  tags: Array<{ name: string; count: number }>;
  studios: Array<{ name: string; count: number }>;
  comparisons?: {
    vsPrevious: {
      titlesChange: number;
      scoreChange: number;
      hoursChange: number;
    };
  };
}

interface RecapCardProps {
  data: RecapData;
  userName: string;
  userAvatar?: string;
  accentColor?: string;
  mode: 'ANIME' | 'MANGA';
  width?: number;
  height?: number;
}

export const RecapCard = forwardRef<HTMLDivElement, RecapCardProps>(
  function RecapCard({ 
    data, 
    userName,
    userAvatar,
    accentColor = '#8b5cf6',
    mode,
    width = 1080, 
    height = 1920 
  }, ref) {
    const { period, stats, highlights, genres, tags, studios, comparisons } = data;

    const getPeriodEmoji = () => {
      if (period.type === 'season') {
        if (period.label.includes('Winter')) return '❄️';
        if (period.label.includes('Spring')) return '🌸';
        if (period.label.includes('Summer')) return '☀️';
        if (period.label.includes('Fall')) return '🍂';
      }
      return '📅';
    };

    const getTrendIcon = (trend: string) => {
      if (trend === 'up') return <TrendingUp className="w-3 h-3 text-green-400" />;
      if (trend === 'down') return <TrendingDown className="w-3 h-3 text-red-400" />;
      return <Minus className="w-3 h-3 text-gray-500" />;
    };

    const formatChange = (value: number) => {
      if (value > 0) return `+${value}`;
      return value.toString();
    };

    return (
      <div 
        ref={ref}
        className="relative overflow-hidden"
        style={{ 
          width, 
          height, 
          background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 30%, #0a0a0f 100%)',
        }}
      >
        {/* Background Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Gradient Accent */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at top, ${accentColor}15 0%, transparent 50%)`,
          }}
        />

        {/* Main Content */}
        <div className="relative h-full flex flex-col p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-4xl mb-2">{getPeriodEmoji()}</div>
            <h1 className="text-4xl font-bold text-white mb-2">{period.label}</h1>
            <p className="text-lg text-gray-400">{mode} Recap</p>
          </div>

          {/* User Badge */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {userAvatar ? (
              <img 
                src={userAvatar} 
                alt={userName}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
                style={{ background: `${accentColor}22`, color: accentColor }}
              >
                {userName[0]}
              </div>
            )}
            <span className="text-xl font-medium text-white">{userName}</span>
          </div>

          {/* Big Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <StatCard 
              icon={<Film className="w-6 h-6" />}
              value={stats.titlesCompleted}
              label="Titles Completed"
              accentColor={accentColor}
              change={comparisons?.vsPrevious.titlesChange}
            />
            <StatCard 
              icon={<Clock className="w-6 h-6" />}
              value={Math.round(stats.hoursSpent)}
              label="Hours Spent"
              accentColor={accentColor}
              change={comparisons?.vsPrevious.hoursChange}
            />
            <StatCard 
              icon={<Star className="w-6 h-6" />}
              value={stats.avgScore.toFixed(1)}
              label="Avg Score"
              accentColor={accentColor}
              change={comparisons?.vsPrevious.scoreChange}
              isDecimal
            />
            <StatCard 
              icon={<Trophy className="w-6 h-6" />}
              value={mode === 'ANIME' ? stats.episodesWatched || 0 : stats.chaptersRead || 0}
              label={mode === 'ANIME' ? 'Episodes' : 'Chapters'}
              accentColor={accentColor}
            />
          </div>

          {/* Highlight of the Period */}
          {highlights.topTitle && (
            <div className="mb-8 p-5 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 text-center">
                🏆 Top Pick of {period.label}
              </h3>
              <div className="flex items-center gap-4">
                {highlights.topTitle.cover && (
                  <img 
                    src={highlights.topTitle.cover}
                    alt={highlights.topTitle.name}
                    className="w-20 h-28 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-white mb-2">{highlights.topTitle.name}</h4>
                  <div 
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                    style={{ background: `${accentColor}22`, color: accentColor }}
                  >
                    <Star className="w-4 h-4" />
                    {highlights.topTitle.score}/10
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Genre Breakdown */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Top Genres
            </h3>
            <div className="space-y-2">
              {genres.slice(0, 5).map((genre, i) => (
                <div key={genre.name} className="flex items-center gap-3">
                  <span className="text-sm text-gray-300 w-24 truncate">{genre.name}</span>
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${Math.min(100, (genre.count / genres[0].count) * 100)}%`,
                        background: i === 0 ? accentColor : 'rgba(255,255,255,0.3)',
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-1 w-12 justify-end">
                    {getTrendIcon(genre.trend)}
                    <span className="text-xs text-gray-500">{genre.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags Cloud */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Favorite Themes
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 8).map((tag, i) => (
                <span 
                  key={tag.name}
                  className="px-3 py-1.5 rounded-full text-sm"
                  style={{ 
                    background: i === 0 ? `${accentColor}22` : 'rgba(255,255,255,0.05)',
                    color: i === 0 ? accentColor : '#9ca3af',
                    border: i === 0 ? `1px solid ${accentColor}44` : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>

          {/* Studios */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {mode === 'ANIME' ? 'Favorite Studios' : 'Favorite Authors'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {studios.slice(0, 5).map((studio, i) => (
                <span 
                  key={studio.name}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium"
                  style={{ 
                    background: i === 0 ? `${accentColor}22` : 'rgba(255,255,255,0.05)',
                    color: i === 0 ? accentColor : '#e5e5e5',
                  }}
                >
                  {studio.name} ({studio.count})
                </span>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto text-center">
            <p className="text-xs text-gray-600">Generated by AniLens • anilens.vercel.app</p>
          </div>
        </div>
      </div>
    );
  }
);

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  accentColor: string;
  change?: number;
  isDecimal?: boolean;
}

function StatCard({ icon, value, label, accentColor, change, isDecimal }: StatCardProps) {
  return (
    <div 
      className="p-4 rounded-xl text-center"
      style={{ 
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex justify-center mb-2" style={{ color: accentColor }}>
        {icon}
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-gray-500 uppercase">{label}</div>
      {change !== undefined && change !== 0 && (
        <div className={`text-xs mt-1 ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
          {change > 0 ? '+' : ''}{isDecimal ? change.toFixed(1) : change} vs prev
        </div>
      )}
    </div>
  );
}

export default RecapCard;
