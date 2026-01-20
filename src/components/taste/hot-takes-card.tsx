'use client';

import React, { useMemo, useState } from 'react';
import { Flame, TrendingUp, TrendingDown, Clock, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { HotTakesProfile, HotTake } from '@/lib/hot-takes-analyzer';
import { OptimizedImage } from '@/components/ui/optimized-image';

interface HotTakesCardProps {
  profile: HotTakesProfile;
  accentColor?: string;
}

export function HotTakesCard({ profile }: HotTakesCardProps) {
  const { hotTakeEnergy, hotTakeEnergyLabel, tendency, tendencyLabel, hotTakesByCategory, stats, procrastination } = profile;
  
  const [showAllMainstream, setShowAllMainstream] = useState(false);
  const [showAllPopular, setShowAllPopular] = useState(false);
  const [showAllKnown, setShowAllKnown] = useState(false);

  const energyColor = useMemo(() => {
    if (hotTakeEnergy >= 65) return '#ef4444'; // Red for hot
    if (hotTakeEnergy >= 40) return '#f97316'; // Orange for warm
    if (hotTakeEnergy >= 20) return '#eab308'; // Yellow for mild
    return '#3b82f6'; // Blue for cold/conformist
  }, [hotTakeEnergy]);

  return (
    <div className="space-y-6">
      {/* Hot Take Energy Header */}
      <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: `${energyColor}22` }}
            >
              <Flame className="w-6 h-6" style={{ color: energyColor }} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Hot Take Energy</h3>
              <p className="text-sm text-gray-400">{hotTakeEnergyLabel}</p>
            </div>
          </div>
          <div 
            className="text-4xl font-bold"
            style={{ color: energyColor }}
          >
            {hotTakeEnergy}
          </div>
        </div>

        {/* Energy Bar */}
        <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-3">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${hotTakeEnergy}%`,
              background: `linear-gradient(90deg, #3b82f6, #eab308, #f97316, #ef4444)`,
            }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-500">
          <span>Consensus Enjoyer</span>
          <span>Chaos Agent</span>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-blue-400">
              <Zap className="w-3 h-3" />
              <span className="font-bold">{stats.totalScored}</span>
            </div>
            <span className="text-xs text-gray-500">Rated</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-orange-400">
              <Flame className="w-3 h-3" />
              <span className="font-bold">{stats.qualifiedTakes}</span>
            </div>
            <span className="text-xs text-gray-500">Hot Takes</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1" style={{ color: tendency >= 0 ? '#22c55e' : '#ef4444' }}>
              {tendency >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span className="font-bold">{tendency >= 0 ? '+' : ''}{tendency}</span>
            </div>
            <span className="text-xs text-gray-500">{tendencyLabel}</span>
          </div>
        </div>
      </div>

      {/* Hot Takes by Crowd Category - New 3-Section Approach */}
      {(hotTakesByCategory.mainstream.length > 0 || hotTakesByCategory.popular.length > 0 || hotTakesByCategory.known.length > 0 || hotTakesByCategory.niche.length > 0) && (
        <div className="space-y-4">
          {/* Hot Takes (Mainstream) - 200k+ popularity */}
          {hotTakesByCategory.mainstream.length > 0 && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-red-400" />
                <h3 className="text-base font-semibold text-white">Hot Takes (Mainstream)</h3>
                <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">200k+ popularity</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">Your disagreements on shows everyone&apos;s watching</p>
              <div className="space-y-3">
                {(showAllMainstream ? hotTakesByCategory.mainstream : hotTakesByCategory.mainstream.slice(0, 5)).map((take) => (
                  <TakeRow key={take.mediaId} take={take} />
                ))}
              </div>
              {hotTakesByCategory.mainstream.length > 5 && (
                <button
                  onClick={() => setShowAllMainstream(!showAllMainstream)}
                  className="mt-3 w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  {showAllMainstream ? (
                    <><ChevronUp className="w-4 h-4" /> Show Less</>
                  ) : (
                    <><ChevronDown className="w-4 h-4" /> Show All {hotTakesByCategory.mainstream.length}</>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Contrarian Picks - 100k-200k popularity */}
          {hotTakesByCategory.popular.length > 0 && (
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-yellow-400" />
                <h3 className="text-base font-semibold text-white">Contrarian Picks</h3>
                <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full">100k-200k popularity</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">Meaningful disagreements on popular shows</p>
              <div className="space-y-3">
                {(showAllPopular ? hotTakesByCategory.popular : hotTakesByCategory.popular.slice(0, 5)).map((take) => (
                  <TakeRow key={take.mediaId} take={take} />
                ))}
              </div>
              {hotTakesByCategory.popular.length > 5 && (
                <button
                  onClick={() => setShowAllPopular(!showAllPopular)}
                  className="mt-3 w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  {showAllPopular ? (
                    <><ChevronUp className="w-4 h-4" /> Show Less</>
                  ) : (
                    <><ChevronDown className="w-4 h-4" /> Show All {hotTakesByCategory.popular.length}</>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Deep Cuts - <50k popularity */}
          {(hotTakesByCategory.known.length > 0 || hotTakesByCategory.niche.length > 0) && (
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-semibold text-white">Deep Cuts</h3>
                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">&lt;50k popularity</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">Fun differences on lesser-known shows</p>
              <div className="space-y-3">
                {[
                  ...hotTakesByCategory.known.slice(0, 3),
                  ...hotTakesByCategory.niche.slice(0, 2)
                ].map((take) => (
                  <TakeRow key={take.mediaId} take={take} />
                ))}
              </div>
              {(hotTakesByCategory.known.length > 3 || hotTakesByCategory.niche.length > 2) && (
                <button
                  onClick={() => setShowAllKnown(!showAllKnown)}
                  className="mt-3 w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  {showAllKnown ? (
                    <><ChevronUp className="w-4 h-4" /> Show Less</>
                  ) : (
                    <><ChevronDown className="w-4 h-4" /> Show All ({hotTakesByCategory.known.length + hotTakesByCategory.niche.length})</>
                  )}
                </button>
              )}
            </div>
          )}
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

function TakeRow({ take }: { take: HotTake }) {
  const deltaColor = take.direction === 'overrated' ? 'text-red-400' : 'text-green-400';
  const bgColor = take.direction === 'overrated' ? 'bg-red-500/20' : 'bg-green-500/20';
  
  // Heat label styling
  const heatColors: Record<string, string> = {
    nuclear: 'bg-red-500/30 text-red-300 border-red-500/50',
    spicy: 'bg-orange-500/30 text-orange-300 border-orange-500/50',
    hot: 'bg-yellow-500/30 text-yellow-300 border-yellow-500/50',
    warm: 'bg-amber-500/30 text-amber-300 border-amber-500/50',
    mild: 'bg-gray-500/30 text-gray-300 border-gray-500/50',
  };
  
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group">
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
        {/* Rating band context - shows on hover */}
        <p className="text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity truncate">
          {take.ratingBandLabel}
        </p>
      </div>

      {/* Delta Badge */}
      <div className={`px-2 py-1 rounded-full text-xs font-bold ${bgColor} ${deltaColor}`}>
        Δ {take.delta > 0 ? '+' : ''}{take.delta}
      </div>

      {/* Heat Badge with Label */}
      <div 
        className={`px-2 py-1 rounded-full text-xs font-bold border ${heatColors[take.heatLabel]}`}
        title={`Heat = disagreement × popularity confidence × quality gate`}
      >
        {take.heatLabel === 'nuclear' && '🔥 '}
        {take.heatLabel === 'spicy' && '🌶️ '}
        {take.heat}
      </div>
    </div>
  );
}

export default HotTakesCard;
