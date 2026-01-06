'use client';

import { getRankFromMMR, getRankDisplayName, getRankProgress, getMMRToNextRank } from '@/lib/rank-system';

interface RankBadgeProps {
  mmr: number;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  showMMR?: boolean;
}

export function RankBadge({ mmr, size = 'md', showProgress = false, showMMR = false }: RankBadgeProps) {
  const rank = getRankFromMMR(mmr);
  const rankName = getRankDisplayName(mmr);
  const progress = getRankProgress(mmr);
  const toNext = getMMRToNextRank(mmr);

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div 
        className={`inline-flex items-center gap-2 rounded-lg bg-linear-to-r ${rank.bgColor} ${sizeClasses[size]} font-bold text-white shadow-lg`}
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
      >
        <span className={iconSizes[size]}>{rank.icon}</span>
        <span>{rankName}</span>
      </div>
      
      {showMMR && (
        <span className="text-xs text-gray-400">{mmr} MMR</span>
      )}
      
      {showProgress && rank.name !== 'Challenger' && (
        <div className="w-full max-w-[120px]">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-linear-to-r ${rank.bgColor} rounded-full transition-all duration-500`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-500 text-center mt-0.5">
            {toNext} to next rank
          </p>
        </div>
      )}
    </div>
  );
}

// Compact inline rank display
export function RankInline({ mmr }: { mmr: number }) {
  const rank = getRankFromMMR(mmr);
  const rankName = getRankDisplayName(mmr);

  return (
    <span 
      className="inline-flex items-center gap-1 text-sm font-medium"
      style={{ color: rank.color }}
    >
      <span>{rank.icon}</span>
      <span>{rankName}</span>
    </span>
  );
}

// MMR change indicator
export function MMRChange({ change, oldMMR, newMMR }: { change: number; oldMMR: number; newMMR: number }) {
  const isPositive = change > 0;
  const oldRank = getRankFromMMR(oldMMR);
  const newRank = getRankFromMMR(newMMR);
  const rankChanged = getRankDisplayName(oldMMR) !== getRankDisplayName(newMMR);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`text-2xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? '+' : ''}{change} MMR
      </div>
      
      {rankChanged && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">Rank:</span>
          <span style={{ color: oldRank.color }}>{getRankDisplayName(oldMMR)}</span>
          <span className="text-gray-500">→</span>
          <span style={{ color: newRank.color }} className="font-bold">{getRankDisplayName(newMMR)}</span>
          {newMMR > oldMMR && <span className="text-yellow-400">🎉</span>}
        </div>
      )}
      
      <div className="text-xs text-gray-500">
        {oldMMR} → {newMMR} MMR
      </div>
    </div>
  );
}
