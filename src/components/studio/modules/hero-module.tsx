'use client';

import React from 'react';
import { StudioPosterProfile } from '@/types/studio';

interface HeroModuleProps {
  profile: StudioPosterProfile;
  fingerprint: string;
  compact?: boolean;
}

export function HeroModule({ profile, fingerprint, compact = false }: HeroModuleProps) {
  const { user, activityStats, mode } = profile;
  const accentColor = profile.settings.theme.accent;
  
  if (compact) {
    return (
      <div className="relative overflow-hidden rounded-xl">
        {/* Compact Banner */}
        <div className="relative h-20">
          {user.banner ? (
            <img 
              src={user.banner} 
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'blur(8px) brightness(0.4)' }}
            />
          ) : (
            <div 
              className="absolute inset-0"
              style={{ background: user.fallbackGradient || `linear-gradient(135deg, ${accentColor}44 0%, #1a1a2e 100%)` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
          
          {/* Compact Content */}
          <div className="relative h-full flex items-center gap-3 px-4">
            <div 
              className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2"
              style={{ borderColor: accentColor }}
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">{user.name[0]}</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-white truncate">{user.name}</h1>
              <p className="text-xs text-gray-400 truncate">{fingerprint}</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-white">{activityStats.totalTitles}</div>
              <div className="text-xs text-gray-400">{mode.toLowerCase()}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Full Banner */}
      <div className="relative h-36">
        {user.banner ? (
          <img 
            src={user.banner} 
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div 
            className="absolute inset-0"
            style={{ background: user.fallbackGradient || `linear-gradient(135deg, ${accentColor}66 0%, #1a1a2e 100%)` }}
          />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/60 to-transparent" />
      </div>
      
      {/* Profile Section */}
      <div className="relative -mt-12 px-6 pb-4">
        <div className="flex items-end gap-4">
          {/* Avatar */}
          <div 
            className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-4 border-[#050508]"
            style={{ boxShadow: `0 0 0 2px ${accentColor}` }}
          >
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{user.name[0]}</span>
              </div>
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0 pb-1">
            <h1 className="text-2xl font-bold text-white truncate">{user.name}</h1>
            <p 
              className="text-sm font-medium italic truncate"
              style={{ color: accentColor }}
            >
              &ldquo;{fingerprint}&rdquo;
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="flex gap-4 pb-1">
            <div className="text-center">
              <div className="text-xl font-bold text-white">{activityStats.totalTitles}</div>
              <div className="text-xs text-gray-500">{mode === 'ANIME' ? 'Anime' : 'Manga'}</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-white">{activityStats.meanScore.toFixed(1)}</div>
              <div className="text-xs text-gray-500">Avg Score</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-white">{Math.round(activityStats.completionRate * 100)}%</div>
              <div className="text-xs text-gray-500">Completion</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
