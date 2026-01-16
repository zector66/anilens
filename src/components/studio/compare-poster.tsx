'use client';

import React, { forwardRef } from 'react';
import { FriendComparison } from '@/types/snapshot';

interface ComparePosterProps {
  comparison: FriendComparison;
  accentColor?: string;
  width?: number;
  height?: number;
}

export const ComparePoster = forwardRef<HTMLDivElement, ComparePosterProps>(
  function ComparePoster({ 
    comparison, 
    accentColor = '#8b5cf6',
    width = 1600, 
    height = 900 
  }, ref) {
    const { user, friend, similarity, sharedGenres, sharedTags, uniqueToUser, uniqueToFriend } = comparison;

    const getSimilarityColor = (score: number) => {
      if (score >= 80) return '#22c55e';
      if (score >= 60) return '#f59e0b';
      if (score >= 40) return '#3b82f6';
      return '#ef4444';
    };

    const getSimilarityLabel = (score: number) => {
      if (score >= 80) return 'Taste Twins';
      if (score >= 60) return 'Compatible';
      if (score >= 40) return 'Some Overlap';
      return 'Opposites';
    };

    return (
      <div 
        ref={ref}
        className="relative overflow-hidden"
        style={{ 
          width, 
          height, 
          background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
        }}
      >
        {/* Background Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Gradient Overlays */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, ${accentColor}15 0%, transparent 30%, transparent 70%, ${accentColor}15 100%)`,
          }}
        />

        {/* Main Content */}
        <div className="relative h-full p-8 flex flex-col">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Taste Comparison</h1>
            <div className="flex items-center justify-center gap-4">
              <div 
                className="px-4 py-2 rounded-full text-lg font-bold"
                style={{ 
                  background: `${getSimilarityColor(similarity.overall)}22`,
                  color: getSimilarityColor(similarity.overall),
                  border: `1px solid ${getSimilarityColor(similarity.overall)}44`,
                }}
              >
                {similarity.overall}% Match • {getSimilarityLabel(similarity.overall)}
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="flex-1 grid grid-cols-2 gap-8">
            {/* User Side */}
            <div className="flex flex-col">
              <UserCard 
                name={user.name}
                avatar={user.avatar}
                snapshot={user.snapshot}
                accentColor={accentColor}
                side="left"
              />
              
              {/* Unique to User */}
              <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Only {user.name.split(' ')[0]} Loves
                </h3>
                <div className="flex flex-wrap gap-2">
                  {uniqueToUser.genres.slice(0, 4).map(g => (
                    <span 
                      key={g}
                      className="px-2 py-1 rounded-full text-xs"
                      style={{ background: `${accentColor}22`, color: accentColor }}
                    >
                      {g}
                    </span>
                  ))}
                  {uniqueToUser.tags.slice(0, 4).map(t => (
                    <span 
                      key={t}
                      className="px-2 py-1 rounded-full text-xs bg-white/10 text-gray-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Friend Side */}
            <div className="flex flex-col">
              <UserCard 
                name={friend.name}
                avatar={friend.avatar}
                snapshot={friend.snapshot}
                accentColor="#3b82f6"
                side="right"
              />
              
              {/* Unique to Friend */}
              <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Only {friend.name.split(' ')[0]} Loves
                </h3>
                <div className="flex flex-wrap gap-2">
                  {uniqueToFriend.genres.slice(0, 4).map(g => (
                    <span 
                      key={g}
                      className="px-2 py-1 rounded-full text-xs"
                      style={{ background: '#3b82f622', color: '#3b82f6' }}
                    >
                      {g}
                    </span>
                  ))}
                  {uniqueToFriend.tags.slice(0, 4).map(t => (
                    <span 
                      key={t}
                      className="px-2 py-1 rounded-full text-xs bg-white/10 text-gray-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Shared Section (Bottom) */}
          <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-sm font-semibold text-white text-center mb-4">
              🤝 What You Both Love
            </h3>
            <div className="flex justify-center gap-8">
              <div>
                <span className="text-xs text-gray-400 uppercase">Genres</span>
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {sharedGenres.slice(0, 5).map(g => (
                    <span 
                      key={g}
                      className="px-3 py-1.5 rounded-full text-sm font-medium"
                      style={{ 
                        background: 'linear-gradient(90deg, #8b5cf622, #3b82f622)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white'
                      }}
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-400 uppercase">Tags</span>
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {sharedTags.slice(0, 5).map(t => (
                    <span 
                      key={t}
                      className="px-3 py-1.5 rounded-full text-sm"
                      style={{ 
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#9ca3af'
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Similarity Breakdown */}
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-white">{similarity.genreMatch}%</div>
                <div className="text-[10px] text-gray-500 uppercase">Genre Match</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">{similarity.tagMatch}%</div>
                <div className="text-[10px] text-gray-500 uppercase">Tag Match</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">{similarity.studioMatch}%</div>
                <div className="text-[10px] text-gray-500 uppercase">Studio Match</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">{similarity.scoreCorrelation}%</div>
                <div className="text-[10px] text-gray-500 uppercase">Score Correlation</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 text-center">
            <span className="text-[10px] text-gray-600">Generated by AniLens • anilens.vercel.app</span>
          </div>
        </div>
      </div>
    );
  }
);

// User Card Component
interface UserCardProps {
  name: string;
  avatar?: string;
  snapshot: FriendComparison['user']['snapshot'];
  accentColor: string;
  side: 'left' | 'right';
}

function UserCard({ name, avatar, snapshot, accentColor, side }: UserCardProps) {
  return (
    <div 
      className="flex-1 p-5 rounded-xl"
      style={{ 
        background: 'rgba(10, 10, 15, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* User Header */}
      <div className={`flex items-center gap-4 mb-4 ${side === 'right' ? 'flex-row-reverse' : ''}`}>
        {avatar ? (
          <img 
            src={avatar} 
            alt={name}
            className="w-16 h-16 rounded-full"
            style={{ outline: `2px solid ${accentColor}`, outlineOffset: '2px' }}
          />
        ) : (
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{ background: `${accentColor}22`, color: accentColor }}
          >
            {name[0]}
          </div>
        )}
        <div className={side === 'right' ? 'text-right' : ''}>
          <h2 className="text-xl font-bold text-white">{name}</h2>
          <p className="text-sm text-gray-400">{snapshot.stats.totalTitles} titles • {snapshot.stats.meanScore.toFixed(1)} avg</p>
        </div>
      </div>

      {/* Archetype */}
      <div 
        className="text-center py-2 px-4 rounded-lg mb-4"
        style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}33` }}
      >
        <span className="text-sm font-medium" style={{ color: accentColor }}>
          {snapshot.archetype.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Top Genres */}
      <div className="mb-3">
        <h4 className="text-xs text-gray-500 uppercase mb-2">Top Genres</h4>
        <div className="flex flex-wrap gap-1.5">
          {snapshot.topGenres.slice(0, 5).map((g, i) => (
            <span 
              key={g.name}
              className="px-2 py-1 rounded text-xs"
              style={{ 
                background: i === 0 ? `${accentColor}22` : 'rgba(255,255,255,0.05)',
                color: i === 0 ? accentColor : '#9ca3af',
              }}
            >
              {g.name}
            </span>
          ))}
        </div>
      </div>

      {/* Top Studios */}
      <div>
        <h4 className="text-xs text-gray-500 uppercase mb-2">Top Studios</h4>
        <div className="flex flex-wrap gap-1.5">
          {snapshot.topStudios.slice(0, 3).map((s, i) => (
            <span 
              key={s.name}
              className="px-2 py-1 rounded text-xs"
              style={{ 
                background: i === 0 ? `${accentColor}22` : 'rgba(255,255,255,0.05)',
                color: i === 0 ? accentColor : '#9ca3af',
              }}
            >
              {s.name}
            </span>
          ))}
        </div>
      </div>

      {/* Fingerprint */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <p 
          className="text-xs italic text-center"
          style={{ color: accentColor }}
        >
          &ldquo;{snapshot.fingerprint}&rdquo;
        </p>
      </div>
    </div>
  );
}

export default ComparePoster;
