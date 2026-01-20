'use client';

import { useState, useEffect } from 'react';
import { Trophy, Crown, Medal, Star, TrendingUp, Users, Award } from 'lucide-react';

interface HallOfFameEntry {
  id: number;
  title: string;
  coverImage: string;
  globalWins: number;
  allTimeRank: number;
  thisWeekRank: number;
  lastWeekRank: number;
  winRate: number;
  averageSeed: number;
  biggestUpset: number; // Seed difference when winning as underdog
}

interface HallOfFameProps {
  winnerId?: number;
  showUserResult?: boolean;
}

export function HallOfFame({ winnerId, showUserResult = true }: HallOfFameProps) {
  const [entries, setEntries] = useState<HallOfFameEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userResult, setUserResult] = useState<{
    globalWins: number;
    allTimeRank: number;
    percentile: string;
  } | null>(null);

  useEffect(() => {
    const fetchHallOfFame = async () => {
      try {
        // Mock data for now - replace with actual API call
        const mockData: HallOfFameEntry[] = [
          {
            id: 1,
            title: "Attack on Titan",
            coverImage: "/api/placeholder/120/180",
            globalWins: 143,
            allTimeRank: 7,
            thisWeekRank: 5,
            lastWeekRank: 8,
            winRate: 78.5,
            averageSeed: 2.3,
            biggestUpset: 8,
          },
          {
            id: 2,
            title: "Steins;Gate",
            coverImage: "/api/placeholder/120/180",
            globalWins: 128,
            allTimeRank: 12,
            thisWeekRank: 11,
            lastWeekRank: 15,
            winRate: 82.1,
            averageSeed: 3.1,
            biggestUpset: 11,
          },
          {
            id: 3,
            title: "Fullmetal Alchemist: Brotherhood",
            coverImage: "/api/placeholder/120/180",
            globalWins: 156,
            allTimeRank: 3,
            thisWeekRank: 2,
            lastWeekRank: 3,
            winRate: 85.7,
            averageSeed: 1.8,
            biggestUpset: 6,
          },
        ];

        setEntries(mockData);

        // Mock user result if winner is provided
        if (winnerId && showUserResult) {
          const winnerEntry = mockData.find(e => e.id === winnerId);
          if (winnerEntry) {
            setUserResult({
              globalWins: winnerEntry.globalWins,
              allTimeRank: winnerEntry.allTimeRank,
              percentile: "Top 2%",
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch Hall of Fame:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHallOfFame();
  }, [winnerId, showUserResult]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-lg font-bold text-gray-400">#{rank}</span>;
  };

  const getRankChange = (current: number, previous: number) => {
    const change = previous - current;
    if (change > 0) {
      return (
        <span className="flex items-center gap-1 text-green-400 text-sm">
          <TrendingUp className="w-3 h-3" />
          +{change}
        </span>
      );
    } else if (change < 0) {
      return (
        <span className="flex items-center gap-1 text-red-400 text-sm">
          <TrendingUp className="w-3 h-3 rotate-180" />
          {change}
        </span>
      );
    }
    return <span className="text-gray-400 text-sm">—</span>;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                <div className="w-10 h-10 bg-white/10 rounded" />
                <div className="w-20 h-20 bg-white/10 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-2/3" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Result */}
      {showUserResult && userResult && (
        <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg p-4 border border-purple-500/30">
          <div className="flex items-center gap-3 mb-3">
            <Trophy className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Your Winner's Legacy</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-400">{userResult.globalWins}</div>
              <div className="text-xs text-gray-400">Global Wins</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">#{userResult.allTimeRank}</div>
              <div className="text-xs text-gray-400">All-Time Rank</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{userResult.percentile}</div>
              <div className="text-xs text-gray-400">Percentile</div>
            </div>
          </div>
        </div>
      )}

      {/* Hall of Fame Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Hall of Fame</h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Users className="w-4 h-4" />
          <span>Community Rankings</span>
        </div>
      </div>

      {/* Top Entries */}
      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
              winnerId === entry.id
                ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30'
                : 'bg-white/5 border border-white/10 hover:bg-white/10'
            }`}
          >
            {/* Rank */}
            <div className="flex flex-col items-center gap-1">
              {getRankIcon(entry.allTimeRank)}
              {getRankChange(entry.thisWeekRank, entry.lastWeekRank)}
            </div>

            {/* Cover */}
            <div className="relative">
              <img
                src={entry.coverImage}
                alt={entry.title}
                className="w-16 h-24 rounded-lg object-cover"
              />
              {winnerId === entry.id && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                  <Star className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-white truncate mb-1">{entry.title}</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-yellow-400" />
                  <span className="text-gray-300">{entry.globalWins} wins</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-green-400" />
                  <span className="text-gray-300">{entry.winRate.toFixed(1)}% win rate</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-purple-400" />
                  <span className="text-gray-300">Avg seed: {entry.averageSeed}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Award className="w-3 h-3 text-red-400" />
                  <span className="text-gray-300">Biggest upset: #{entry.biggestUpset}</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="text-right">
              <div className="text-lg font-bold text-white">#{entry.allTimeRank}</div>
              <div className="text-xs text-gray-400">All-time</div>
            </div>
          </div>
        ))}
      </div>

      {/* View More */}
      <div className="text-center">
        <button className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-sm font-medium transition-colors">
          View Full Hall of Fame
        </button>
      </div>
    </div>
  );
}
