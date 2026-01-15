'use client';

import React, { forwardRef } from 'react';
import { StudioPosterProfile } from '@/types/studio';

interface StudioPosterProps {
  profile: StudioPosterProfile;
  className?: string;
  width?: number;
  height?: number;
}

const GlassPanel: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, className = '', style }) => (
  <div 
    className={`rounded-xl backdrop-blur-md ${className}`}
    style={{
      background: 'rgba(10, 10, 15, 0.55)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      ...style,
    }}
  >
    {children}
  </div>
);

export const StudioPoster = forwardRef<HTMLDivElement, StudioPosterProps>(
  function StudioPoster({ profile, className = '', width = 1600, height = 900 }, ref) {
    const { 
      user, mode, summaryLine, indices, topMedia, 
      topGenres, topTags, topStudiosOrAuthors, 
      activityStats, metadata, settings 
    } = profile;
    const { theme } = settings;
    
    const formatNumber = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : n.toString();
    
    return (
      <div
        ref={ref}
        className={`relative overflow-hidden ${className}`}
        style={{ 
          width: `${width}px`, 
          height: `${height}px`,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#050508',
        }}
      >
        {/* Full Background - Blurred Banner */}
        <div className="absolute inset-0">
          {user.banner ? (
            <img 
              src={user.banner} 
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'blur(60px) brightness(0.3)' }}
            />
          ) : (
            <div 
              className="absolute inset-0"
              style={{ 
                background: user.fallbackGradient || 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
                filter: 'blur(40px) brightness(0.4)'
              }}
            />
          )}
          {/* Dark overlay with gradient */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, rgba(5,5,8,0.3) 0%, rgba(5,5,8,0.85) 100%)',
            }}
          />
          {/* Subtle noise texture */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Content Grid */}
        <div className="relative h-full grid grid-cols-12 gap-4 p-6">
          
          {/* LEFT RAIL - Identity & Activity (cols 1-3) */}
          <div className="col-span-3 flex flex-col gap-4">
            
            {/* Identity Card */}
            <GlassPanel className="p-4">
              <div className="flex items-center gap-3 mb-4">
                {/* Avatar */}
                <div 
                  className="w-14 h-14 rounded-full overflow-hidden shrink-0"
                  style={{ boxShadow: `0 0 0 2px ${theme.accent}` }}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                      <span className="text-xl font-bold text-white">{user.name[0]}</span>
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg font-bold text-white truncate">{user.name}</h1>
                  <p className="text-xs text-gray-400">
                    Studio Poster • {mode === 'ANIME' ? 'Anime' : 'Manga'}
                  </p>
                </div>
              </div>
              
              {/* Summary Line */}
              <p 
                className="text-sm font-medium italic leading-snug"
                style={{ color: theme.accent }}
              >
                &ldquo;{summaryLine}&rdquo;
              </p>
            </GlassPanel>

            {/* Activity Stats */}
            <GlassPanel className="p-4 flex-1">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Activity</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Titles</span>
                  <span className="text-white font-bold text-lg">{activityStats.totalTitles}</span>
                </div>
                {activityStats.episodesWatched !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Episodes</span>
                    <span className="text-white font-bold text-lg">{formatNumber(activityStats.episodesWatched)}</span>
                  </div>
                )}
                {activityStats.chaptersRead !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Chapters</span>
                    <span className="text-white font-bold text-lg">{formatNumber(activityStats.chaptersRead)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Mean Score</span>
                  <span className="text-white font-bold text-lg">{activityStats.meanScore.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Completion</span>
                  <span className="text-white font-bold text-lg">{Math.round(activityStats.completionRate * 100)}%</span>
                </div>
              </div>
            </GlassPanel>

            {/* Taste Class Pills */}
            <GlassPanel className="p-4">
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
          </div>

          {/* CENTER - Top Titles & Studios (cols 4-9) */}
          <div className="col-span-6 flex flex-col gap-4">
            
            {/* Top 5 Covers Row */}
            <GlassPanel className="p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Top {mode === 'ANIME' ? 'Anime' : 'Manga'}
              </h3>
              <div className="flex gap-3 justify-center">
                {topMedia.slice(0, 5).map((media, i) => (
                  <div key={media.id} className="relative group">
                    <div 
                      className="w-28 h-40 rounded-lg overflow-hidden transition-transform"
                      style={{ 
                        boxShadow: i === 0 ? `0 0 0 2px ${theme.accent}` : 'none',
                        transform: i === 0 ? 'scale(1.05)' : 'scale(1)',
                      }}
                    >
                      <img 
                        src={media.cover} 
                        alt={media.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Score Badge */}
                      {media.score && (
                        <div 
                          className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-xs font-bold"
                          style={{ 
                            background: 'rgba(0,0,0,0.8)',
                            color: media.score >= 8 ? '#22c55e' : media.score >= 6 ? '#eab308' : '#ef4444'
                          }}
                        >
                          {media.score}
                        </div>
                      )}
                    </div>
                    {/* Rank Badge */}
                    <div 
                      className="absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ 
                        background: i === 0 ? theme.accent : 'rgba(255,255,255,0.1)',
                        color: i === 0 ? '#fff' : '#9ca3af'
                      }}
                    >
                      {i + 1}
                    </div>
                  </div>
                ))}
                {/* Fill empty slots */}
                {Array.from({ length: Math.max(0, 5 - topMedia.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="w-28 h-40 rounded-lg bg-white/5 border border-white/10" />
                ))}
              </div>
            </GlassPanel>

            {/* TOP STUDIOS - The Hero Block */}
            <GlassPanel className="p-5 flex-1">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Top {mode === 'ANIME' ? 'Studios' : 'Authors'}
              </h3>
              
              {/* Primary Studio Callout */}
              {topStudiosOrAuthors[0] && (
                <div className="mb-5 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold"
                      style={{ 
                        background: `${theme.accent}22`,
                        color: theme.accent,
                        border: `2px solid ${theme.accent}44`
                      }}
                    >
                      #1
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-white">{topStudiosOrAuthors[0].name}</h4>
                      <p className="text-sm text-gray-400">
                        {topStudiosOrAuthors[0].count} {mode.toLowerCase()} • {topStudiosOrAuthors[0].percentage}% of your list
                      </p>
                    </div>
                    <div 
                      className="text-3xl font-bold"
                      style={{ color: theme.accent }}
                    >
                      {Math.round(topStudiosOrAuthors[0].strength * 100)}%
                    </div>
                  </div>
                </div>
              )}

              {/* Other Studios */}
              <div className="space-y-3">
                {topStudiosOrAuthors.slice(1, 5).map((studio, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={{ 
                        background: 'rgba(255,255,255,0.05)',
                        color: '#9ca3af'
                      }}
                    >
                      {i + 2}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{studio.name}</div>
                      <div className="text-xs text-gray-500">
                        {studio.count} titles • {studio.percentage}%
                      </div>
                    </div>
                    <div className="w-24">
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${Math.min(100, studio.strength * 100)}%`,
                            background: `linear-gradient(90deg, ${theme.accent}88, ${theme.accent})`
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-400 w-12 text-right">
                      {Math.round(studio.strength * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </GlassPanel>

            {/* Tags Cloud */}
            <GlassPanel className="p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Common Themes</h3>
              <div className="flex flex-wrap gap-2">
                {topTags.slice(0, 12).map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{ 
                      background: i < 3 ? `${theme.accent}33` : 'rgba(255,255,255,0.05)',
                      color: i < 3 ? theme.accent : '#9ca3af',
                      border: `1px solid ${i < 3 ? `${theme.accent}55` : 'rgba(255,255,255,0.08)'}`
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </GlassPanel>
          </div>

          {/* RIGHT RAIL - Analytics (cols 10-12) */}
          <div className="col-span-3 flex flex-col gap-4">
            
            {/* Genre Radar / Distribution */}
            <GlassPanel className="p-4 flex-1">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Genre Distribution</h3>
              <div className="space-y-3">
                {topGenres.slice(0, 6).map((genre, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-300">{genre.name}</span>
                      <span className="text-gray-500">{Math.round(genre.strength * 100)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div 
                        className="h-full rounded-full"
                        style={{ 
                          width: `${Math.min(100, genre.strength * 100)}%`,
                          background: `linear-gradient(90deg, ${theme.accent}66, ${theme.accent})`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>

            {/* Extended Stats */}
            <GlassPanel className="p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Taste Indices</h3>
              <div className="space-y-3">
                {indices.slice(0, 6).map((stat, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">{stat.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            width: `${stat.value * 100}%`,
                            backgroundColor: stat.color
                          }}
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

            {/* Footer Info */}
            <GlassPanel className="p-4">
              <div className="text-center">
                <div 
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-2"
                  style={{ background: `${theme.accent}22` }}
                >
                  <svg className="w-4 h-4" style={{ color: theme.accent }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
                  </svg>
                  <span className="text-sm font-medium" style={{ color: theme.accent }}>AniLens</span>
                </div>
                <div className="text-xs text-gray-500 space-y-0.5">
                  <div>Generated from: {metadata.statusesIncluded.join(', ')}</div>
                  <div>{metadata.timeRange} • {metadata.totalEntries} titles</div>
                  <div className="text-gray-600">anilens.vercel.app</div>
                </div>
              </div>
            </GlassPanel>
          </div>
        </div>
      </div>
    );
  }
);

export default StudioPoster;
