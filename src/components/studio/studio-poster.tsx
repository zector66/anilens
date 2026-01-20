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
    
    // Calculate estimated percentiles for demo
    const estimatedPercentiles = {
      completion: Math.min(95, Math.round((activityStats.completionRate / 0.8) * 100)),
      listSize: Math.min(99, Math.round((activityStats.totalTitles / 500) * 100)),
      meanScore: Math.min(98, Math.round((activityStats.meanScore / 9) * 100)),
      diversity: Math.min(92, Math.round((indices.find(i => i.label === 'Diversity')?.value || 0.5) * 100)),
    };
    
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

        {/* Content Grid - AniWrapped Style */}
        <div className="relative h-full flex flex-col">
          
          {/* ROW 1: HERO BANNER (20% height) */}
          <div className="relative h-[20%] flex items-center justify-between px-8 py-4">
            {/* Left: Avatar + Username */}
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div 
                className="w-20 h-20 rounded-full overflow-hidden shrink-0"
                style={{ boxShadow: `0 0 0 3px ${theme.accent}, 0 0 20px ${theme.accent}44` }}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{user.name[0]}</span>
                  </div>
                )}
              </div>
              
              {/* Username + Summary */}
              <div>
                <h1 className="text-4xl font-bold text-white mb-1">{user.name}</h1>
                <p 
                  className="text-lg font-medium italic"
                  style={{ color: theme.accent }}
                >
                  &ldquo;{summaryLine}&rdquo;
                </p>
              </div>
            </div>
            
            {/* Right: Branding + Time Window */}
            <div className="text-right">
              <div className="text-sm text-gray-400 mb-1">AniLens Studio</div>
              <div className="text-xl font-bold text-white">
                {metadata.timeRange} {mode === 'ANIME' ? 'Anime' : 'Manga'}
              </div>
              <div className="text-xs text-gray-500 mt-1">anilens.gg/studio</div>
            </div>
          </div>
          
          {/* ROW 2: 3x2 STAT GRID + PERCENTILES (15% height) */}
          <div className="h-[15%] grid grid-cols-12 gap-4 px-8">
            {/* 3x2 Stat Grid (cols 1-8) */}
            <div className="col-span-8 grid grid-cols-3 gap-3">
              {indices.slice(0, 6).map((stat, i) => (
                <div key={i} className="text-center">
                  <div 
                    className="text-3xl font-bold mb-1"
                    style={{ color: stat.color }}
                  >
                    {stat.displayValue}
                  </div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">{stat.label}</div>
                </div>
              ))}
            </div>
            
            {/* Percentile Cards (cols 9-12) */}
            <div className="col-span-4 grid grid-cols-2 gap-2">
              <div className="text-center p-2 rounded-lg" style={{ background: `${theme.accent}15` }}>
                <div className="text-xl font-bold" style={{ color: theme.accent }}>
                  Top {estimatedPercentiles.completion}%
                </div>
                <div className="text-xs text-gray-400">Completion</div>
              </div>
              <div className="text-center p-2 rounded-lg" style={{ background: `${theme.accent}15` }}>
                <div className="text-xl font-bold" style={{ color: theme.accent }}>
                  Top {estimatedPercentiles.listSize}%
                </div>
                <div className="text-xs text-gray-400">List Size</div>
              </div>
              <div className="text-center p-2 rounded-lg" style={{ background: `${theme.accent}15` }}>
                <div className="text-xl font-bold" style={{ color: theme.accent }}>
                  Top {estimatedPercentiles.meanScore}%
                </div>
                <div className="text-xs text-gray-400">Mean Score</div>
              </div>
              <div className="text-center p-2 rounded-lg" style={{ background: `${theme.accent}15` }}>
                <div className="text-xl font-bold" style={{ color: theme.accent }}>
                  Top {estimatedPercentiles.diversity}%
                </div>
                <div className="text-xs text-gray-400">Diversity</div>
              </div>
            </div>
          </div>
          
          {/* ROW 3: TOP MEDIA + STUDIOS (35% height) */}
          <div className="h-[35%] grid grid-cols-12 gap-4 px-8">
            {/* Top 5 Media Strip (cols 1-7) */}
            <div className="col-span-7">
              <GlassPanel className="h-full p-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Top {mode === 'ANIME' ? 'Anime' : 'Manga'}
                </h3>
                <div className="flex gap-3 justify-center items-end h-full">
                  {topMedia.slice(0, 5).map((media, i) => (
                    <div key={media.id} className="relative group">
                      <div 
                        className="rounded-lg overflow-hidden transition-transform"
                        style={{ 
                          width: i === 0 ? '120px' : '80px',
                          height: i === 0 ? '180px' : '120px',
                          boxShadow: i === 0 ? `0 0 0 3px ${theme.accent}` : '0 0 0 1px rgba(255,255,255,0.1)',
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
                            className="absolute bottom-2 right-2 px-2 py-1 rounded text-xs font-bold"
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
                        className="absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ 
                          background: i === 0 ? theme.accent : 'rgba(255,255,255,0.1)',
                          color: i === 0 ? '#fff' : '#9ca3af'
                        }}
                      >
                        #{i + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassPanel>
            </div>
            
            {/* Top Studios (cols 8-12) */}
            <div className="col-span-5">
              <GlassPanel className="h-full p-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Top {mode === 'ANIME' ? 'Studios' : 'Authors'}
                </h3>
                <div className="space-y-3">
                  {topStudiosOrAuthors.slice(0, 4).map((studio, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                        style={{ 
                          background: i === 0 ? `${theme.accent}22` : 'rgba(255,255,255,0.05)',
                          color: i === 0 ? theme.accent : '#9ca3af',
                          border: i === 0 ? `2px solid ${theme.accent}44` : '1px solid rgba(255,255,255,0.08)'
                        }}
                      >
                        #{i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{studio.name}</div>
                        <div className="text-xs text-gray-500">
                          {studio.count} titles • {studio.percentage}%
                        </div>
                      </div>
                      <div 
                        className="text-sm font-bold"
                        style={{ color: i === 0 ? theme.accent : '#9ca3af' }}
                      >
                        {Math.round(studio.strength * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              </GlassPanel>
            </div>
          </div>
          
          {/* ROW 4: GENRE RADAR + TAGS (30% height) */}
          <div className="h-[30%] grid grid-cols-12 gap-4 px-8 pb-6">
            {/* Genre Distribution (cols 1-6) */}
            <div className="col-span-6">
              <GlassPanel className="h-full p-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Genre Signature</h3>
                <div className="space-y-2">
                  {topGenres.slice(0, 6).map((genre, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-300">{genre.name}</span>
                        <span className="text-gray-500">{Math.round(genre.strength * 100)}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${Math.min(100, genre.strength * 100)}%`,
                            background: `linear-gradient(90deg, ${theme.accent}88, ${theme.accent})`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassPanel>
            </div>
            
            {/* Tags Cloud (cols 7-12) */}
            <div className="col-span-6">
              <GlassPanel className="h-full p-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Common Themes</h3>
                <div className="flex flex-wrap gap-2">
                  {topTags.slice(0, 15).map((tag, i) => (
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
          </div>
        </div>
      </div>
    );
  }
);

export default StudioPoster;
