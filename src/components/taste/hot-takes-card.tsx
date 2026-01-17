'use client';

import React, { useMemo } from 'react';
import { Flame, Snowflake, TrendingUp, TrendingDown, Minus, AlertTriangle, Clock } from 'lucide-react';
import { HotTakesProfile, HotTake } from '@/lib/hot-takes-analyzer';
import { OptimizedImage } from '@/components/ui/optimized-image';

interface HotTakesCardProps {
  profile: HotTakesProfile;
  accentColor?: string;
}

export function HotTakesCard({ profile, accentColor = '#f97316' }: HotTakesCardProps) {
  const { contrarianIndex, contrarianLabel, hottestTakes, coldestTakes, stats, procrastination } = profile;

  const indexColor = useMemo(() => {
    if (contrarianIndex >= 65) return '#ef4444'; // Red for hot
    if (contrarianIndex >= 40) return '#f97316'; // Orange for warm
    if (contrarianIndex >= 20) return '#eab308'; // Yellow for mild
    return '#3b82f6'; // Blue for cold/conformist
  }, [contrarianIndex]);

  return (
    <div className="space-y-6">
      {/* Contrarian Index Header */}
      <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: `${indexColor}22` }}
            >
              <Flame className="w-6 h-6" style={{ color: indexColor }} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Hot Take Energy</h3>
              <p className="text-sm text-gray-400">{contrarianLabel}</p>
            </div>
          </div>
          <div 
            className="text-4xl font-bold"
            style={{ color: indexColor }}
          >
            {contrarianIndex}
          </div>
        </div>

        {/* Index Bar */}
        <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-3">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${contrarianIndex}%`,
              background: `linear-gradient(90deg, #3b82f6, #eab308, #f97316, #ef4444)`,
            }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-500">
          <span>Conformist</span>
          <span>Contrarian</span>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-green-400">
              <TrendingUp className="w-3 h-3" />
              <span className="font-bold">{stats.overraters}</span>
            </div>
            <span className="text-xs text-gray-500">Overrated</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-red-400">
              <TrendingDown className="w-3 h-3" />
              <span className="font-bold">{stats.underraters}</span>
            </div>
            <span className="text-xs text-gray-500">Underrated</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-blue-400">
              <Minus className="w-3 h-3" />
              <span className="font-bold">{stats.perfectMatches}</span>
            </div>
            <span className="text-xs text-gray-500">On Point</span>
          </div>
        </div>
      </div>

      {/* Hottest Takes */}
      {hottestTakes.length > 0 && (
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-orange-400" />
            <h3 className="text-base font-semibold text-white">Your Hottest Takes</h3>
          </div>
          <div className="space-y-3">
            {hottestTakes.map((take) => (
              <TakeRow key={take.mediaId} take={take} type="hot" />
            ))}
          </div>
        </div>
      )}

      {/* Coldest Takes */}
      {coldestTakes.length > 0 && (
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Snowflake className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-semibold text-white">Your Cold Takes</h3>
            <span className="text-xs text-gray-500">(You agree with everyone)</span>
          </div>
          <div className="space-y-3">
            {coldestTakes.slice(0, 3).map((take) => (
              <TakeRow key={take.mediaId} take={take} type="cold" />
            ))}
          </div>
        </div>
      )}

      {/* Procrastination Index */}
      {procrastination.planningCount > 0 && (
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-semibold text-white">Backlog Status</h3>
            </div>
            <span className="text-sm font-medium text-purple-400">{procrastination.label}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full bg-purple-500 transition-all"
                  style={{ width: `${procrastination.index}%` }}
                />
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-white">{procrastination.planningCount}</span>
              <span className="text-sm text-gray-500 ml-1">in queue</span>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            {Math.round(procrastination.ratio * 100)}% of your list is in Planning
          </p>
        </div>
      )}
    </div>
  );
}

function TakeRow({ take, type }: { take: HotTake; type: 'hot' | 'cold' }) {
  const isHot = type === 'hot';
  const deltaColor = take.delta > 0 ? 'text-green-400' : take.delta < 0 ? 'text-red-400' : 'text-gray-400';
  
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
      {/* Cover */}
      {take.coverImage && (
        <div className="w-10 h-14 rounded overflow-hidden shrink-0">
          <OptimizedImage
            src={take.coverImage}
            alt={take.title}
            width={40}
            height={56}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {/* Title & Scores */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{take.title}</p>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400">You:</span>
          <span className={`font-bold ${deltaColor}`}>{take.userScore}</span>
          <span className="text-gray-600">vs</span>
          <span className="text-gray-400">Global:</span>
          <span className="text-gray-300">{take.globalScore}</span>
        </div>
      </div>

      {/* Delta Badge */}
      <div 
        className={`px-2 py-1 rounded-full text-xs font-bold ${
          isHot 
            ? take.delta > 0 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-red-500/20 text-red-400'
            : 'bg-blue-500/20 text-blue-400'
        }`}
      >
        {take.delta > 0 ? '+' : ''}{take.delta}
      </div>

      {/* Intensity (for hot takes) */}
      {isHot && (
        <div className="flex items-center gap-1">
          <Flame className="w-3 h-3 text-orange-400" />
          <span className="text-xs text-orange-400 font-medium">{take.intensity}</span>
        </div>
      )}
    </div>
  );
}

export default HotTakesCard;
