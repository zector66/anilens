'use client';

import React, { useMemo, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Clock, Sparkles, 
  Calendar, ChevronRight, Zap, Activity
} from 'lucide-react';
import { useTasteDrift, useSaveGenomeSnapshot } from '@/hooks/use-genome-snapshots';
import { TasteGenome, extractGenome } from '@/lib/taste-genome';
import { TasteProfile, MediaListEntry } from '@/types/anilist';
import { DriftDimension, TasteDrift, TasteEra } from '@/lib/taste-drift';

interface TasteDriftCardProps {
  profile: TasteProfile;
  entries: MediaListEntry[];
  anilistId: number;
  type: 'ANIME' | 'MANGA';
}

export function TasteDriftCard({ profile, entries, anilistId, type }: TasteDriftCardProps) {
  const { 
    snapshots, 
    timeline, 
    latestDrift, 
    currentEra,
    overallTrends,
    isLoading, 
    hasHistory 
  } = useTasteDrift(anilistId, type);
  
  const { mutate: saveSnapshot } = useSaveGenomeSnapshot();
  
  // Extract current genome
  const genome = useMemo(() => extractGenome(profile), [profile]);
  
  // Auto-save snapshot on first load (if eligible)
  // This is WRITE-BEHIND - if it fails, we don't care, UI still works
  useEffect(() => {
    if (genome && anilistId && entries.length > 10) {
      // Create a simple list hash for cache invalidation
      const listHash = `${entries.length}-${entries.reduce((sum, e) => sum + (e.score || 0), 0)}`;
      
      // Save snapshot in background - failures are silent
      saveSnapshot(
        {
          genome,
          anilistId,
          mediaType: type,
          listHash,
          entryCount: entries.length
        },
        {
          onError: (error) => {
            // Silent failure - snapshot is optional cache only
            console.warn('[SNAPSHOT SAVE FAILED - IGNORED]', error);
          }
        }
      );
    }
  }, [genome, anilistId, type, entries.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="p-6 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Taste Drift</h3>
            <p className="text-xs text-gray-400">Loading your taste history...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasHistory) {
    return (
      <div className="p-6 rounded-xl bg-linear-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 border border-cyan-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Taste Drift
              <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full">NEW</span>
            </h3>
            <p className="text-xs text-gray-400">Track how your taste evolves over time</p>
          </div>
        </div>
        
        <div className="text-center py-6">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-500" />
          <p className="text-gray-300 mb-2">Your taste journey begins today!</p>
          <p className="text-sm text-gray-500">
            We&apos;ve saved your first genome snapshot. Come back in a few weeks to see how your taste evolves.
          </p>
        </div>
        
        {/* Current Era Preview */}
        {genome && (
          <div className="mt-4 p-4 rounded-lg bg-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-white">Current Era</span>
            </div>
            <div className="text-lg font-bold text-purple-300">
              {genome.dominantTraits[0] || 'Unknown'} Phase
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Dominant traits: {genome.dominantTraits.join(', ')}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl bg-linear-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 border border-cyan-500/20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
          <Activity className="w-5 h-5 text-cyan-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white">Taste Drift</h3>
          <p className="text-xs text-gray-400">
            {snapshots.length} snapshots • {timeline?.eras?.length || 1} era{(timeline?.eras?.length || 1) > 1 ? 's' : ''}
          </p>
        </div>
        {latestDrift && (
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            latestDrift.overallDrift > 0.25 ? 'bg-purple-500/20 text-purple-300' :
            latestDrift.overallDrift > 0.1 ? 'bg-cyan-500/20 text-cyan-300' :
            'bg-gray-500/20 text-gray-300'
          }`}>
            {latestDrift.driftLabel}
          </div>
        )}
      </div>

      {/* Narrative */}
      {latestDrift && (
        <div className="mb-4 p-4 rounded-lg bg-black/20">
          <p className="text-white font-medium">{latestDrift.narrative}</p>
          {latestDrift.eraChanged && (
            <p className="text-sm text-purple-300 mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              You entered your {latestDrift.currentEra.name}
            </p>
          )}
        </div>
      )}

      {/* Current Era */}
      {currentEra && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-white">Current Era</span>
          </div>
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <div className="text-lg font-bold text-purple-300">{currentEra.name}</div>
            <div className="text-xs text-gray-400">
              Primary: {currentEra.primaryTrait} • Secondary: {currentEra.secondaryTrait}
            </div>
          </div>
        </div>
      )}

      {/* Biggest Changes */}
      {latestDrift && (latestDrift.biggestGains.length > 0 || latestDrift.biggestDrops.length > 0) && (
        <div className="space-y-3">
          {/* Gains */}
          {latestDrift.biggestGains.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold text-white">Rising Interests</span>
              </div>
              <div className="space-y-2">
                {latestDrift.biggestGains.slice(0, 3).map((dim) => (
                  <DriftDimensionRow key={dim.name} dimension={dim} />
                ))}
              </div>
            </div>
          )}

          {/* Drops */}
          {latestDrift.biggestDrops.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-sm font-semibold text-white">Declining Interests</span>
              </div>
              <div className="space-y-2">
                {latestDrift.biggestDrops.slice(0, 3).map((dim) => (
                  <DriftDimensionRow key={dim.name} dimension={dim} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Overall Trends */}
      {overallTrends.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-semibold text-white">Long-term Trends</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {overallTrends.slice(0, 5).map((trend) => (
              <span 
                key={trend.dimension}
                className={`px-2 py-1 rounded-md text-xs font-medium ${
                  trend.trend === 'increasing' ? 'bg-green-500/20 text-green-300' :
                  trend.trend === 'decreasing' ? 'bg-red-500/20 text-red-300' :
                  trend.trend === 'volatile' ? 'bg-yellow-500/20 text-yellow-300' :
                  'bg-gray-500/20 text-gray-300'
                }`}
              >
                {trend.dimension} {
                  trend.trend === 'increasing' ? '↑' :
                  trend.trend === 'decreasing' ? '↓' :
                  trend.trend === 'volatile' ? '~' : '—'
                }
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Timeline Preview */}
      {snapshots.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-white">Snapshot Timeline</span>
            <span className="text-xs text-gray-500">
              {new Date(snapshots[snapshots.length - 1].createdAt).toLocaleDateString()} - {new Date(snapshots[0].createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex gap-1 h-8">
            {snapshots.slice(0, 12).reverse().map((snapshot, i) => (
              <div 
                key={snapshot.id}
                className="flex-1 rounded-sm bg-linear-to-t from-purple-500/50 to-cyan-500/50 relative group cursor-pointer hover:opacity-80 transition-opacity"
                style={{ 
                  height: `${30 + snapshot.uniquenessScore * 70}%`,
                  opacity: 0.4 + (i / 12) * 0.6
                }}
                title={new Date(snapshot.createdAt).toLocaleDateString()}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {new Date(snapshot.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function DriftDimensionRow({ dimension }: { dimension: DriftDimension }) {
  const isPositive = dimension.direction === 'up';
  const percentChange = Math.abs(Math.round(dimension.delta * 100));
  
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
      <div className="flex-1">
        <div className="text-sm text-white">{dimension.name}</div>
        <div className="text-xs text-gray-500 capitalize">{dimension.category}</div>
      </div>
      <div className="text-right">
        <div className={`text-sm font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? '+' : '-'}{percentChange}%
        </div>
        <div className="text-[10px] text-gray-500">
          {(dimension.oldValue * 100).toFixed(0)}% → {(dimension.newValue * 100).toFixed(0)}%
        </div>
      </div>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        isPositive ? 'bg-green-500/20' : 'bg-red-500/20'
      }`}>
        {isPositive ? (
          <TrendingUp className="w-4 h-4 text-green-400" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-400" />
        )}
      </div>
    </div>
  );
}

export default TasteDriftCard;
