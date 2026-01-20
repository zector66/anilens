'use client';

import React, { forwardRef } from 'react';
import { StudioPosterProfile } from '@/types/studio';

interface StudioPosterProps {
  profile: StudioPosterProfile;
  className?: string;
  width?: number;
  height?: number;
}

const PosterBlock: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, className = '', style }) => (
  <div 
    className={`${className}`}
    style={{
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
              style={{ filter: 'blur(80px) brightness(0.25)' }}
            />
          ) : (
            <div 
              className="absolute inset-0"
              style={{ 
                background: user.fallbackGradient || 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
                filter: 'blur(60px) brightness(0.3)'
              }}
            />
          )}
          {/* Dark overlay with gradient */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, rgba(5,5,8,0.4) 0%, rgba(5,5,8,0.95) 30%, rgba(5,5,8,0.98) 100%)',
            }}
          />
          {/* Subtle noise texture */}
          <div 
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* POSTER LAYOUT - Full Width Hero Banner */}
        <div className="relative h-full flex flex-col">
          
          {/* ROW 1: FULL-WIDTH HERO BANNER (25% height) */}
          <div className="relative h-[25%]">
            {/* Banner Background */}
            <div className="absolute inset-0">
              {user.banner ? (
                <img 
                  src={user.banner} 
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ filter: 'blur(2px) brightness(0.4)' }}
                />
              ) : (
                <div 
                  className="absolute inset-0"
                  style={{ 
                    background: user.fallbackGradient || 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
                  }}
                />
              )}
              {/* Heavy Gradient Overlay */}
              <div 
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%)',
                }}
              />
            </div>
            
            {/* Hero Content */}
            <div className="relative h-full flex items-center justify-between px-10">
              {/* Left: Avatar + Username */}
              <div className="flex items-center gap-6">
                {/* Avatar */}
                <div 
                  className="w-24 h-24 rounded-full overflow-hidden shrink-0"
                  style={{ 
                    boxShadow: `0 0 0 4px ${theme.accent}, 0 0 30px ${theme.accent}66`,
                    border: '4px solid rgba(255,255,255,0.1)'
                  }}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">{user.name[0]}</span>
                    </div>
                  )}
                </div>
                
                {/* Username + Summary */}
                <div>
                  <h1 className="text-6xl font-black text-white mb-2 leading-tight">{user.name}</h1>
                  <p 
                    className="text-2xl font-bold italic"
                    style={{ color: theme.accent }}
                  >
                    &ldquo;{summaryLine}&rdquo;
                  </p>
                </div>
              </div>
              
              {/* Right: Branding + Time Window */}
              <div className="text-right">
                <div className="text-lg font-bold text-white mb-1">AniLens Studio</div>
                <div className="text-3xl font-black text-white mb-1">
                  {metadata.timeRange} {mode === 'ANIME' ? 'Anime' : 'Manga'}
                </div>
                <div className="text-sm text-gray-300">anilens.gg/studio</div>
              </div>
            </div>
            
            {/* Bottom Stats Pills */}
            <div className="absolute bottom-4 left-10 right-10">
              <div className="flex gap-10 overflow-hidden">
                <PosterBlock className="text-center min-w-0">
                  <div className="text-4xl font-black text-white leading-none tabular-nums truncate">{activityStats.totalTitles}</div>
                  <div className="text-sm text-gray-200 uppercase tracking-wider leading-tight">Titles</div>
                </PosterBlock>
                {activityStats.episodesWatched !== undefined && (
                  <PosterBlock className="text-center min-w-0">
                    <div className="text-4xl font-black text-white leading-none tabular-nums truncate">{formatNumber(activityStats.episodesWatched)}</div>
                    <div className="text-sm text-gray-200 uppercase tracking-wider leading-tight">Episodes</div>
                  </PosterBlock>
                )}
                {activityStats.chaptersRead !== undefined && (
                  <PosterBlock className="text-center min-w-0">
                    <div className="text-4xl font-black text-white leading-none tabular-nums truncate">{formatNumber(activityStats.chaptersRead)}</div>
                    <div className="text-sm text-gray-200 uppercase tracking-wider leading-tight">Chapters</div>
                  </PosterBlock>
                )}
                <PosterBlock className="text-center min-w-0">
                  <div className="text-4xl font-black text-white leading-none tabular-nums truncate">{activityStats.meanScore.toFixed(1)}</div>
                  <div className="text-sm text-gray-200 uppercase tracking-wider leading-tight">Mean Score</div>
                </PosterBlock>
                <PosterBlock className="text-center min-w-0">
                  <div className="text-4xl font-black text-white leading-none tabular-nums truncate">{Math.round(activityStats.completionRate * 100)}%</div>
                  <div className="text-sm text-gray-200 uppercase tracking-wider leading-tight">Completion</div>
                </PosterBlock>
              </div>
            </div>
          </div>
          
          {/* ROW 2: TOP RATED STRIP (20% height) */}
          <div className="h-[20%] px-10 py-6">
            <PosterBlock className="h-full">
              <div className="flex items-end justify-center gap-4 h-full">
                {topMedia.slice(0, 5).map((media, i) => (
                  <div key={media.id} className="relative">
                    <div 
                      className="rounded-lg overflow-hidden"
                      style={{ 
                        width: i === 0 ? '180px' : '120px',
                        height: i === 0 ? '240px' : '160px',
                        boxShadow: i === 0 ? `0 0 0 4px ${theme.accent}, 0 10px 40px ${theme.accent}44` : '0 4px 20px rgba(0,0,0,0.4)',
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
                          className="absolute bottom-3 right-3 px-3 py-1.5 rounded text-sm font-black"
                          style={{ 
                            background: 'rgba(0,0,0,0.9)',
                            color: media.score >= 8 ? '#22c55e' : media.score >= 6 ? '#eab308' : '#ef4444'
                          }}
                        >
                          {media.score}
                        </div>
                      )}
                    </div>
                    {/* Rank Badge */}
                    <div 
                      className="absolute -top-3 -left-3 w-12 h-12 rounded-full flex items-center justify-center text-lg font-black"
                      style={{ 
                        background: i === 0 ? theme.accent : 'rgba(255,255,255,0.9)',
                        color: i === 0 ? '#fff' : '#000',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                      }}
                    >
                      #{i + 1}
                    </div>
                  </div>
                ))}
              </div>
            </PosterBlock>
          </div>
          
          {/* ROW 3: 3x2 STAT GRID + GENRE (25% height) */}
          <div className="h-[25%] grid grid-cols-12 gap-6 px-10">
            {/* 3x2 Stat Grid (cols 1-7) */}
            <div className="col-span-7">
              <PosterBlock className="h-full">
                <div className="grid grid-cols-3 gap-6 h-full">
                  {indices.slice(0, 6).map((stat, i) => (
                    <div key={i} className="text-center">
                      <div 
                        className="text-5xl font-black mb-2"
                        style={{ color: stat.color }}
                      >
                        {stat.displayValue}
                      </div>
                      <div className="text-sm text-gray-300 uppercase tracking-wider">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </PosterBlock>
            </div>
            
            {/* Genre Bars (cols 8-12) */}
            <div className="col-span-5">
              <PosterBlock className="h-full p-4">
                <h3 className="text-lg font-black text-white mb-4">Genre Signature</h3>
                <div className="space-y-3">
                  {topGenres.slice(0, 5).map((genre, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-white font-medium">{genre.name}</span>
                        <span className="text-gray-400">{Math.round(genre.strength * 100)}%</span>
                      </div>
                      <div className="h-4 rounded-full bg-white/15 overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            width: `${Math.min(100, genre.strength * 100)}%`,
                            background: `linear-gradient(90deg, ${theme.accent}CC, ${theme.accent})`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </PosterBlock>
            </div>
          </div>
          
          {/* ROW 4: THEMES + STUDIOS (30% height) */}
          <div className="h-[30%] grid grid-cols-12 gap-6 px-10 pb-10">
            {/* Themes Cloud (cols 1-7) */}
            <div className="col-span-7">
              <PosterBlock className="h-full p-6">
                <h3 className="text-lg font-black text-white mb-4">Common Themes</h3>
                <div className="flex flex-wrap gap-3">
                  {topTags.slice(0, 20).map((tag, i) => (
                    <span
                      key={i}
                      className="px-4 py-2 rounded-full text-sm font-bold"
                      style={{ 
                        background: i < 4 ? `${theme.accent}33` : 'rgba(255,255,255,0.1)',
                        color: i < 4 ? theme.accent : '#fff',
                        border: `2px solid ${i < 4 ? `${theme.accent}66` : 'rgba(255,255,255,0.2)'}`,
                        boxShadow: i < 4 ? `0 4px 20px ${theme.accent}44` : '0 2px 10px rgba(0,0,0,0.3)'
                      }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </PosterBlock>
            </div>
            
            {/* Top Studios (cols 8-12) */}
            <div className="col-span-5">
              <PosterBlock className="h-full p-6">
                <h3 className="text-lg font-black text-white mb-4">
                  Top {mode === 'ANIME' ? 'Studios' : 'Authors'}
                </h3>
                <div className="space-y-4">
                  {topStudiosOrAuthors.slice(0, 3).map((studio, i) => (
                    <div key={i} className="flex items-center gap-4 min-w-0">
                      <div 
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-black"
                        style={{ 
                          background: i === 0 ? `${theme.accent}33` : 'rgba(255,255,255,0.1)',
                          color: i === 0 ? theme.accent : '#fff',
                          border: i === 0 ? `3px solid ${theme.accent}` : '2px solid rgba(255,255,255,0.2)',
                          boxShadow: i === 0 ? `0 4px 20px ${theme.accent}44` : '0 2px 10px rgba(0,0,0,0.3)'
                        }}
                      >
                        #{i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-lg font-bold text-white truncate">{studio.name}</div>
                        <div className="text-sm text-gray-300 truncate">
                          {studio.count} titles • {studio.percentage}%
                        </div>
                      </div>
                      <div 
                        className="text-2xl font-black shrink-0"
                        style={{ color: i === 0 ? theme.accent : '#fff' }}
                      >
                        {Math.round(studio.strength * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              </PosterBlock>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default StudioPoster;
