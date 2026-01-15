'use client';

import React, { forwardRef } from 'react';
import { StudioPosterProfile } from '@/types/studio';

interface StudioPosterProps {
  profile: StudioPosterProfile;
  className?: string;
}

export const StudioPoster = forwardRef<HTMLDivElement, StudioPosterProps>(
  function StudioPoster({ profile, className = '' }, ref) {
    const { user, mode, summaryLine, indices, topGenres, topTags, topStudiosOrAuthors, metadata, settings } = profile;
    const { theme } = settings;
    
    const bgClass = theme.mode === 'dark' ? 'bg-[#0a0a0f]' : 'bg-gray-100';
    const textClass = theme.mode === 'dark' ? 'text-white' : 'text-gray-900';
    const subtextClass = theme.mode === 'dark' ? 'text-gray-400' : 'text-gray-600';
    const cardBg = theme.mode === 'dark' ? 'bg-white/5' : 'bg-white';
    const borderColor = theme.mode === 'dark' ? 'border-white/10' : 'border-gray-200';
    
    return (
      <div
        ref={ref}
        className={`${bgClass} ${className}`}
        style={{ 
          width: '600px', 
          minHeight: '800px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Header Section */}
        <div className="relative h-32 overflow-hidden">
          {/* Banner Background */}
          {user.banner ? (
            <img 
              src={user.banner} 
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div 
              className="absolute inset-0"
              style={{ background: user.fallbackGradient || 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)' }}
            />
          )}
          
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/80" />
          
          {/* Header Content */}
          <div className="relative h-full flex items-end p-4 gap-4">
            {/* Avatar */}
            <div 
              className="w-16 h-16 rounded-full border-2 overflow-hidden flex-shrink-0"
              style={{ borderColor: theme.accent }}
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{user.name[0]}</span>
                </div>
              )}
            </div>
            
            {/* Username & Subtitle */}
            <div className="flex-1 pb-1">
              <h1 className="text-xl font-bold text-white truncate">{user.name}</h1>
              <p className="text-sm text-gray-300">
                Taste Profile • {mode === 'ANIME' ? 'Anime' : 'Manga'}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Line ("Your Lane") */}
        <div className="px-4 py-4">
          <div 
            className={`${cardBg} border ${borderColor} rounded-xl p-4 text-center`}
          >
            <p 
              className="text-lg font-semibold"
              style={{ color: theme.accent }}
            >
              &ldquo;{summaryLine}&rdquo;
            </p>
          </div>
        </div>

        {/* Pill Stats Row (Indices) */}
        <div className="px-4 pb-4">
          <div className="grid grid-cols-3 gap-2">
            {indices.slice(0, 6).map((stat, i) => (
              <div 
                key={i}
                className={`${cardBg} border ${borderColor} rounded-lg p-3 text-center`}
              >
                <div 
                  className="text-xl font-bold"
                  style={{ color: stat.color }}
                >
                  {stat.displayValue}
                </div>
                <div className={`text-xs font-medium ${textClass}`}>{stat.label}</div>
                <div className={`text-[10px] ${subtextClass} mt-0.5`}>{stat.descriptor}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Studios/Authors */}
        <div className="px-4 pb-4">
          <h3 className={`text-sm font-semibold ${textClass} mb-2`}>
            Top {mode === 'ANIME' ? 'Studios' : 'Authors'}
          </h3>
          <div className={`${cardBg} border ${borderColor} rounded-xl p-3 space-y-2`}>
            {topStudiosOrAuthors.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: `${theme.accent}33`, color: theme.accent }}
                >
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${textClass}`}>{item.name}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="h-1.5 rounded-full bg-gray-700"
                    style={{ width: '60px' }}
                  >
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        width: `${Math.min(100, item.strength * 100)}%`,
                        backgroundColor: theme.accent 
                      }}
                    />
                  </div>
                  <span className={`text-xs ${subtextClass} w-8 text-right`}>
                    {Math.round(item.strength * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Genres */}
        <div className="px-4 pb-4">
          <h3 className={`text-sm font-semibold ${textClass} mb-2`}>Top Genres</h3>
          <div className={`${cardBg} border ${borderColor} rounded-xl p-3 space-y-2`}>
            {topGenres.slice(0, 5).map((genre, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`flex-1 text-sm ${textClass}`}>{genre.name}</div>
                <div className="flex items-center gap-2">
                  <div 
                    className="h-2 rounded-full bg-gray-700"
                    style={{ width: '80px' }}
                  >
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        width: `${Math.min(100, genre.strength * 100)}%`,
                        backgroundColor: theme.accent 
                      }}
                    />
                  </div>
                  <span className={`text-xs ${subtextClass} w-8 text-right`}>
                    {Math.round(genre.strength * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Tags */}
        <div className="px-4 pb-4">
          <h3 className={`text-sm font-semibold ${textClass} mb-2`}>Top Tags</h3>
          <div className={`${cardBg} border ${borderColor} rounded-xl p-3`}>
            <div className="flex flex-wrap gap-1.5">
              {topTags.slice(0, 12).map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: `${theme.accent}22`,
                    color: theme.accent,
                    border: `1px solid ${theme.accent}44`
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-4 py-4 border-t ${borderColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-5 h-5 rounded flex items-center justify-center"
                style={{ backgroundColor: theme.accent }}
              >
                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <span className={`text-xs ${subtextClass}`}>Generated on AniLens</span>
            </div>
            <div className={`text-xs ${subtextClass}`}>
              <span>{metadata.timeRange}</span>
              <span className="mx-1">•</span>
              <span>{metadata.totalEntries} titles</span>
            </div>
          </div>
          <div className={`text-[10px] ${subtextClass} mt-1 text-center`}>
            anilens.vercel.app • @{user.name}
          </div>
        </div>
      </div>
    );
  }
);

export default StudioPoster;
