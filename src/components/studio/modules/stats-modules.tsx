'use client';

import React from 'react';
import { StudioPosterProfile, IndexStat } from '@/types/studio';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
}

const GlassPanel: React.FC<GlassPanelProps> = ({ children, className = '' }) => (
  <div 
    className={`rounded-xl ${className}`}
    style={{
      background: 'rgba(10, 10, 15, 0.55)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
    }}
  >
    {children}
  </div>
);

// Stats Row - Compact horizontal stats
export function StatsRowModule({ 
  profile,
  layout = 'row'
}: { 
  profile: StudioPosterProfile;
  layout?: 'row' | 'grid';
}) {
  const { activityStats, mode } = profile;
  const formatNumber = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : n.toString();
  
  const stats = [
    { label: 'Titles', value: activityStats.totalTitles.toString() },
    ...(mode === 'ANIME' && activityStats.episodesWatched 
      ? [{ label: 'Episodes', value: formatNumber(activityStats.episodesWatched) }]
      : []),
    ...(mode === 'MANGA' && activityStats.chaptersRead 
      ? [{ label: 'Chapters', value: formatNumber(activityStats.chaptersRead) }]
      : []),
    { label: 'Mean Score', value: activityStats.meanScore.toFixed(1) },
    { label: 'Completion', value: `${Math.round(activityStats.completionRate * 100)}%` },
  ];
  
  if (layout === 'grid') {
    return (
      <GlassPanel className="p-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Activity</h3>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-sm text-gray-400">{stat.label}</span>
              <span className="text-lg font-bold text-white">{stat.value}</span>
            </div>
          ))}
        </div>
      </GlassPanel>
    );
  }
  
  return (
    <GlassPanel className="p-3">
      <div className="flex items-center justify-around">
        {stats.map((stat, i) => (
          <div key={i} className="text-center px-3">
            <div className="text-xl font-bold text-white">{stat.value}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wide">{stat.label}</div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

// Genre Distribution Bars
export function GenreBarsModule({ 
  genres,
  accentColor,
  count = 6
}: { 
  genres: Array<{ name: string; strength: number }>;
  accentColor: string;
  count?: number;
}) {
  return (
    <GlassPanel className="p-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Genre Distribution</h3>
      <div className="space-y-2">
        {genres.slice(0, count).map((genre, i) => (
          <div key={i}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-300">{genre.name}</span>
              <span className="text-gray-500">{Math.round(genre.strength * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all"
                style={{ 
                  width: `${Math.min(100, genre.strength * 100)}%`,
                  background: `linear-gradient(90deg, ${accentColor}66, ${accentColor})`
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

// Tag Chips
export function TagChipsModule({ 
  tags,
  accentColor,
  count = 12
}: { 
  tags: Array<{ name: string; strength: number }>;
  accentColor: string;
  count?: number;
}) {
  return (
    <GlassPanel className="p-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Common Themes</h3>
      <div className="flex flex-wrap gap-2">
        {tags.slice(0, count).map((tag, i) => (
          <span
            key={i}
            className="px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ 
              background: i < 3 ? `${accentColor}33` : 'rgba(255,255,255,0.05)',
              color: i < 3 ? accentColor : '#9ca3af',
              border: `1px solid ${i < 3 ? `${accentColor}55` : 'rgba(255,255,255,0.08)'}`
            }}
          >
            {tag.name}
          </span>
        ))}
      </div>
    </GlassPanel>
  );
}

// Studios Centerpiece
export function StudiosModule({ 
  studios,
  accentColor,
  mode,
  count = 5
}: { 
  studios: Array<{ name: string; strength: number; count?: number; percentage?: number }>;
  accentColor: string;
  mode: 'ANIME' | 'MANGA';
  count?: number;
}) {
  const label = mode === 'ANIME' ? 'Studios' : 'Authors';
  
  return (
    <GlassPanel className="p-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Top {label}</h3>
      
      {/* Primary Callout */}
      {studios[0] && (
        <div className="mb-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold"
              style={{ 
                background: `${accentColor}22`,
                color: accentColor,
                border: `2px solid ${accentColor}44`
              }}
            >
              #1
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-bold text-white truncate">{studios[0].name}</h4>
              <p className="text-xs text-gray-400">
                {studios[0].count} {mode.toLowerCase()} • {studios[0].percentage}% of list
              </p>
            </div>
            <div 
              className="text-2xl font-bold"
              style={{ color: accentColor }}
            >
              {Math.round(studios[0].strength * 100)}%
            </div>
          </div>
        </div>
      )}

      {/* Remaining Studios */}
      <div className="space-y-2">
        {studios.slice(1, count).map((studio, i) => (
          <div key={i} className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#9ca3af' }}
            >
              {i + 2}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{studio.name}</div>
              <div className="text-xs text-gray-500">
                {studio.count} titles • {studio.percentage}%
              </div>
            </div>
            <div className="w-20">
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${Math.min(100, studio.strength * 100)}%`,
                    background: `linear-gradient(90deg, ${accentColor}88, ${accentColor})`
                  }}
                />
              </div>
            </div>
            <span className="text-sm font-medium text-gray-400 w-10 text-right">
              {Math.round(studio.strength * 100)}%
            </span>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

// Taste Indices / Percentiles
export function IndicesModule({ 
  indices,
  layout = 'pills'
}: { 
  indices: IndexStat[];
  layout?: 'pills' | 'bars' | 'grid';
}) {
  if (layout === 'pills') {
    return (
      <GlassPanel className="p-3">
        <div className="grid grid-cols-2 gap-2">
          {indices.slice(0, 4).map((stat, i) => (
            <div key={i} className="text-center py-2">
              <div 
                className="text-xl font-bold"
                style={{ color: stat.color }}
              >
                {stat.displayValue}
              </div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">{stat.label}</div>
            </div>
          ))}
        </div>
      </GlassPanel>
    );
  }
  
  if (layout === 'bars') {
    return (
      <GlassPanel className="p-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Taste Indices</h3>
        <div className="space-y-2">
          {indices.slice(0, 6).map((stat, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{stat.label}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div 
                    className="h-full rounded-full"
                    style={{ width: `${stat.value * 100}%`, backgroundColor: stat.color }}
                  />
                </div>
                <span 
                  className="text-sm font-bold w-10 text-right"
                  style={{ color: stat.color }}
                >
                  {stat.displayValue}
                </span>
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>
    );
  }
  
  // Grid layout
  return (
    <GlassPanel className="p-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Taste Profile</h3>
      <div className="grid grid-cols-3 gap-3">
        {indices.slice(0, 6).map((stat, i) => (
          <div key={i} className="text-center p-2 rounded-lg bg-white/5">
            <div 
              className="text-lg font-bold"
              style={{ color: stat.color }}
            >
              {stat.displayValue}
            </div>
            <div className="text-[10px] text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

// Archetype Card
export function ArchetypeModule({ 
  archetype,
  traits,
  accentColor
}: { 
  archetype: string;
  traits: string[];
  accentColor: string;
}) {
  return (
    <GlassPanel className="p-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">You Are...</h3>
      <div 
        className="text-xl font-bold mb-2"
        style={{ color: accentColor }}
      >
        {archetype}
      </div>
      <div className="flex flex-wrap gap-1">
        {traits.map((trait, i) => (
          <span 
            key={i}
            className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-gray-400"
          >
            {trait}
          </span>
        ))}
      </div>
    </GlassPanel>
  );
}

// Percentile Flex Stats
export function PercentilesModule({ 
  stats,
  accentColor
}: { 
  stats: Array<{ label: string; percentile: number; displayText: string }>;
  accentColor: string;
}) {
  return (
    <GlassPanel className="p-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">How You Compare</h3>
      <div className="space-y-3">
        {stats.slice(0, 3).map((stat, i) => (
          <div key={i}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-300">{stat.label}</span>
              <span 
                className="text-sm font-bold"
                style={{ color: accentColor }}
              >
                Top {Math.round(100 - stat.percentile)}%
              </span>
            </div>
            <p className="text-xs text-gray-500">{stat.displayText}</p>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}
