'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { 
  MatchHistoryEntry,
  PlayerRating
} from '@/types/anilist';
import { 
  RatingSystem, 
  loadPlayerRating, 
  loadMatchHistory,
  isDailyChallengeCompleted 
} from '@/lib/rating-system';
import { getRankDisplayName, getRankFromMMR } from '@/lib/rank-system';
import {
  Trophy,
  Crown,
  Flame,
  Target,
  Clock,
  Calendar,
  Star,
  Zap,
  Users,
  Award,
  BarChart3,
  Swords,
  Sparkles,
  Heart,
  TrendingUp,
  Medal,
  Gamepad2,
  Shield,
  Activity,
  ChevronDown
} from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { FadeIn } from '@/components/ui/page-transition';
import { CompatibilityScore } from '@/components/social/compatibility-score';
import { WatchHistoryTimeline } from '@/components/social/watch-history-timeline';
import { BracketLeaderboard } from './bracket-leaderboard';

interface CommunityHubProps {
  onStartDailyChallenge?: () => void;
  onStartChallenge?: (opponentId: number) => void;
  onNavigateToGames?: () => void;
}

export function CommunityHubV2({ onStartDailyChallenge, onStartChallenge, onNavigateToGames }: CommunityHubProps) {
  const { user, isOAuthAuthenticated, loginWithAniList } = useAuth();
  const [activePillar, setActivePillar] = useState<'players' | 'hallOfFame'>('players');
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'history' | 'challenges' | 'compatibility' | 'timeline'>('leaderboard');
  const [dbProfile, setDbProfile] = useState<{
    ratings: Array<{ game_type: string; rating: number; games_played: number; wins: number; best_streak: number }>;
    stats: Array<{ game_type: string; games_played: number; avg_accuracy: number }>;
    overallRating?: { total_rating: number; total_games: number; total_wins: number; best_streak: number; game_types_played: number };
  } | null>(null);
  const [_isLoadingProfile, _setIsLoadingProfile] = useState(true);

  // Fetch profile from database
  useEffect(() => {
    if (!user) return;
    
    const fetchProfile = async () => {
      _setIsLoadingProfile(true);
      try {
        const response = await fetch('/api/user/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            anilistId: user.id,
            username: user.name,
            avatarUrl: user.avatar?.large,
          }),
        });
        const data = await response.json();
        if (data.success) {
          setDbProfile({ 
            ratings: data.ratings || [], 
            stats: data.stats || [],
            overallRating: data.overallRating
          });
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        _setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [user]);

  // Load data from localStorage using useMemo (sync operations) - fallback
  const playerRating = useMemo<PlayerRating | null>(() => {
    if (!user) return null;
    return loadPlayerRating(user.id, user.name, user.avatar?.large);
  }, [user]);

  const matchHistory = useMemo<MatchHistoryEntry[]>(() => {
    return loadMatchHistory();
  }, []);

  const dailyCompleted = useMemo(() => {
    return isDailyChallengeCompleted();
  }, []);

  // Calculate totals from database profile
  const totalGamesPlayed = dbProfile?.overallRating?.total_games || dbProfile?.ratings.reduce((sum, r) => sum + r.games_played, 0) || 0;
  const totalWins = dbProfile?.overallRating?.total_wins || dbProfile?.ratings.reduce((sum, r) => sum + r.wins, 0) || 0;
  const bestStreak = dbProfile?.overallRating?.best_streak || dbProfile?.ratings.reduce((max, r) => Math.max(max, r.best_streak), 0) || 0;

  if (!user || !isOAuthAuthenticated) {
    return (
      <div className="max-w-lg mx-auto py-16">
        <div className="p-8 rounded-2xl bg-linear-to-br from-purple-500/20 via-blue-500/10 to-pink-500/20 border border-white/20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Join the Community</h2>
          <p className="text-gray-400 mb-6 max-w-sm mx-auto">
            Login with AniList to access leaderboards, track your rankings, compete with others, and save your game history.
          </p>
          
          <button
            onClick={loginWithAniList}
            className="inline-flex items-center gap-3 px-8 py-4 bg-linear-to-r from-purple-500 to-blue-500 rounded-xl font-bold text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:-translate-y-0.5"
          >
            <Crown className="w-5 h-5" />
            Login with AniList
          </button>
          
          <div className="mt-8 grid grid-cols-2 gap-4 text-left">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-purple-400 font-medium mb-1">
                <Trophy className="w-4 h-4" />
                Players
              </div>
              <p className="text-xs text-gray-500">MMR rankings, match history, challenges</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-yellow-400 font-medium mb-1">
                <Medal className="w-4 h-4" />
                Hall of Fame
              </div>
              <p className="text-xs text-gray-500">Bracket legends and community culture</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Use database rating if available, otherwise fallback to localStorage
  const displayRating = dbProfile?.ratings.length ? (dbProfile.overallRating?.total_rating || 0) : (playerRating?.ratings.overall || 0);
  const detailedRank = getRankFromMMR(displayRating);
  const rankInfo = {
    title: getRankDisplayName(displayRating),
    color: detailedRank.color.replace('text-', 'text-'), // Adjust color format
    icon: detailedRank.icon
  };
  const percentile = RatingSystem.estimatePercentile(displayRating);

  return (
    <div className="space-y-8">
      {/* Header with Player Card - User feedback: profile should be first */}
      <div className="p-6 rounded-2xl bg-linear-to-br from-purple-500/20 via-blue-500/20 to-pink-500/20 border border-white/20">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          {/* Avatar & Basic Info */}
          <div className="flex items-center gap-4">
            {user.avatar?.large ? (
              <OptimizedImage
                src={user.avatar.large}
                alt={user.name}
                width={80}
                height={80}
                className="rounded-2xl border-2 border-purple-500/50"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                <Users className="w-10 h-10 text-purple-400" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-white">{user.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl">{rankInfo.icon}</span>
                <span className={`font-bold ${rankInfo.color}`}>{rankInfo.title}</span>
              </div>
            </div>
          </div>

          {/* Rating Display - Uses database values with localStorage fallback */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-xl bg-white/5">
              <p className="text-xs text-gray-400 mb-1">Overall MMR</p>
              <p className="text-2xl font-bold text-white">{displayRating}</p>
              <p className="text-xs text-purple-400">Top {percentile}%</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5">
              <p className="text-xs text-gray-400 mb-1">Games Played</p>
              <p className="text-2xl font-bold text-white">{totalGamesPlayed || playerRating?.stats.totalGamesPlayed || 0}</p>
              <p className="text-xs text-gray-500">{dbProfile?.ratings.length || 0} game types</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5">
              <p className="text-xs text-gray-400 mb-1">Win Rate</p>
              <p className="text-2xl font-bold text-white">
                {totalGamesPlayed > 0 
                  ? `${((totalWins / totalGamesPlayed) * 100).toFixed(0)}%`
                  : 'N/A'}
              </p>
              <p className="text-xs text-gray-500">{totalWins} wins</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5">
              <p className="text-xs text-gray-400 mb-1">Best Streak</p>
              <p className="text-2xl font-bold text-white">{bestStreak || playerRating?.stats.bestWinStreak || 0}</p>
              <p className="text-xs text-orange-400 flex items-center gap-1">
                <Flame className="w-3 h-3" />
                Keep playing!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Challenge Widget - Small sidebar style */}
      <div className={`p-4 rounded-xl border ${
        dailyCompleted 
          ? 'bg-green-500/10 border-green-500/20' 
          : 'bg-yellow-500/10 border-yellow-500/20'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              dailyCompleted ? 'bg-green-500/20' : 'bg-yellow-500/20'
            }`}>
              {dailyCompleted ? (
                <Trophy className="w-5 h-5 text-green-400" />
              ) : (
                <Calendar className="w-5 h-5 text-yellow-400" />
              )}
            </div>
            <div>
              <p className="font-medium text-white">Daily Challenge</p>
              <p className="text-xs text-gray-400">
                {dailyCompleted ? 'Completed today' : 'Live now →'}
              </p>
            </div>
          </div>
          {onStartDailyChallenge && (
            <button
              onClick={onStartDailyChallenge}
              disabled={dailyCompleted}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                dailyCompleted
                  ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                  : 'bg-yellow-500 hover:bg-yellow-600 text-black'
              }`}
            >
              {dailyCompleted ? '✓' : 'Play'}
            </button>
          )}
        </div>
      </div>

      {/* Pillar Navigation */}
      <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
        <button
          onClick={() => setActivePillar('players')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
            activePillar === 'players'
              ? 'bg-purple-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4" />
          Players
        </button>
        <button
          onClick={() => setActivePillar('hallOfFame')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
            activePillar === 'hallOfFame'
              ? 'bg-yellow-500 text-black'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Medal className="w-4 h-4" />
          Hall of Fame
        </button>
      </div>

      {/* Pillar Content */}
      {activePillar === 'players' && (
        <PlayersPillar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUserId={user.id}
          dbProfile={dbProfile}
          matchHistory={matchHistory}
          onStartChallenge={onStartChallenge || (() => {})}
        />
      )}
      
      {activePillar === 'hallOfFame' && (
        <HallOfFamePillar />
      )}
    </div>
  );
}

// Players Pillar Component
function PlayersPillar({ 
  activeTab, 
  setActiveTab, 
  currentUserId, 
  dbProfile, 
  matchHistory, 
  onStartChallenge 
}: {
  activeTab: 'leaderboard' | 'history' | 'challenges' | 'compatibility' | 'timeline';
  setActiveTab: (tab: 'leaderboard' | 'history' | 'challenges' | 'compatibility' | 'timeline') => void;
  currentUserId: number;
  dbProfile: {
    ratings: Array<{ game_type: string; rating: number; games_played: number; wins: number; best_streak: number }>;
    stats: Array<{ game_type: string; games_played: number; avg_accuracy: number }>;
    overallRating?: { total_rating: number; total_games: number; total_wins: number; best_streak: number; game_types_played: number };
  } | null;
  matchHistory: MatchHistoryEntry[];
  onStartChallenge: (opponentId: number) => void;
}) {
  // Tab Navigation for Players
  const playerTabs = [
    { id: 'leaderboard' as const, label: 'Leaderboard', icon: Trophy },
    { id: 'history' as const, label: 'Match History', icon: Clock },
    { id: 'challenges' as const, label: 'Challenges', icon: Swords },
    { id: 'compatibility' as const, label: 'Compatibility', icon: Heart },
    { id: 'timeline' as const, label: 'Timeline', icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {playerTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-purple-500 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'leaderboard' && (
        <LeaderboardTab currentUserId={currentUserId} />
      )}
      {activeTab === 'history' && (
        <MatchHistoryTab history={matchHistory} />
      )}
      {activeTab === 'challenges' && (
        <ChallengesTab onStartChallenge={onStartChallenge} />
      )}
      {activeTab === 'compatibility' && (
        <FadeIn>
          <CompatibilityScore />
        </FadeIn>
      )}
      {activeTab === 'timeline' && (
        <FadeIn>
          <WatchHistoryTimeline />
        </FadeIn>
      )}
    </div>
  );
}

// Hall of Fame Pillar Component
function HallOfFamePillar() {
  return (
    <div className="space-y-6">
      {/* Hall of Fame Header */}
      <div className="p-6 rounded-2xl bg-linear-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
        <div className="flex items-center gap-3 mb-4">
          <Medal className="w-6 h-6 text-yellow-400" />
          <h3 className="text-xl font-bold text-white">Bracket Legends Hall of Fame</h3>
        </div>
        <p className="text-gray-300">
          Community-driven bracket champions across anime, manga, characters, openings, and endings. 
          See who dominates the brackets and discover the all-time greats.
        </p>
      </div>

      {/* Bracket Leaderboard Component */}
      <BracketLeaderboard />
    </div>
  );
}

// Leaderboard Tab Component
function LeaderboardTab({ currentUserId }: { currentUserId: number }) {
  const [leaderboardType, setLeaderboardType] = useState<string>('global');
  const [leaderboard, setLeaderboard] = useState<Array<{
    anilist_id: number;
    username: string;
    avatar_url: string;
    rating: number;
    games_played: number;
    wins: number;
    best_streak: number;
    rank: number;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 50; // Load 50 at a time

  // Fetch leaderboard on mount and when type changes
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      setOffset(0);
      setHasMore(true);
      try {
        const response = await fetch(`/api/leaderboard?gameType=${leaderboardType}&limit=${limit}`);
        const data = await response.json();
        if (data.success) {
          setLeaderboard(data.leaderboard || []);
          setHasMore((data.leaderboard || []).length === limit);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, [leaderboardType]);

  // Load more function
  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    try {
      const newOffset = offset + limit;
      const response = await fetch(`/api/leaderboard?gameType=${leaderboardType}&limit=${limit}&offset=${newOffset}`);
      const data = await response.json();
      if (data.success) {
        const newEntries = data.leaderboard || [];
        setLeaderboard(prev => {
          // Create a map of existing entries to prevent duplicates
          const existingKeys = new Set(prev.map((p: any) => `${p.anilist_id}-${p.game_type || 'global'}`));
          
          // Filter out duplicates from new entries
          const filteredNew = newEntries.filter((p: any) => !existingKeys.has(`${p.anilist_id}-${p.game_type || 'global'}`));
          
          return [...prev, ...filteredNew];
        });
        setOffset(newOffset);
        setHasMore(newEntries.length === limit);
      }
    } catch (error) {
      console.error('Failed to load more leaderboard entries:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoadingMore, hasMore, offset, leaderboardType]);

  const leaderboardTypes = [
    { id: 'global', label: 'Overall' },
    { id: 'op-guessing', label: 'OP/ED Guessing' },
    { id: 'quote-guessing', label: 'Quote Master' },
    { id: 'character-guessing', label: 'Character' },
    { id: 'score-guessing', label: 'Memory Test' },
  ];

  return (
    <div className="space-y-6">
      {/* Leaderboard Type Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {leaderboardTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setLeaderboardType(type.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              leaderboardType === type.id 
                ? 'bg-purple-500 text-white' 
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-400" />
            {leaderboardType === 'global' ? 'Global Rankings' : leaderboardTypes.find(t => t.id === leaderboardType)?.label + ' Rankings'}
          </h3>
        </div>
        
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 animate-pulse">
                <div className="w-10 h-10 rounded-lg bg-white/10" />
                <div className="w-10 h-10 rounded-lg bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-1/3" />
                  <div className="h-3 bg-white/10 rounded w-1/4" />
                </div>
                <div className="text-right space-y-2">
                  <div className="h-5 bg-white/10 rounded w-16" />
                  <div className="h-3 bg-white/10 rounded w-12" />
                </div>
              </div>
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-yellow-400" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">No Rankings Yet</h4>
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-4">
              Be the first to climb the leaderboard! Play games to earn your rank.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {leaderboard.map((player, index) => {
              const isCurrentUser = player.anilist_id === currentUserId;
              const rankBadge = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
              
              return (
                <div 
                  key={`${player.anilist_id}-${leaderboardType}-${index}`}
                  className={`p-4 flex items-center gap-4 transition-all duration-200 hover:bg-white/5 ${isCurrentUser ? 'bg-purple-500/10' : ''}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Rank */}
                  <div className="w-10 text-center">
                    {rankBadge ? (
                      <span className="text-2xl">{rankBadge}</span>
                    ) : (
                      <span className="text-lg font-bold text-gray-400">#{player.rank}</span>
                    )}
                  </div>
                  
                  {/* Avatar */}
                  {player.avatar_url ? (
                    <OptimizedImage
                      src={player.avatar_url}
                      alt={player.username}
                      width={40}
                      height={40}
                      className="rounded-lg"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-400" />
                    </div>
                  )}
                  
                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${isCurrentUser ? 'text-purple-300' : 'text-white'}`}>
                      {player.username || `User #${player.anilist_id}`}
                      {isCurrentUser && <span className="text-xs text-purple-400 ml-2">(You)</span>}
                    </p>
                    <p className="text-xs text-gray-500">
                      {player.games_played} games • {player.wins} wins
                    </p>
                  </div>
                  
                  {/* Rating */}
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">{player.rating}</p>
                    <p className="text-xs text-gray-500">MMR</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Load More Button */}
        {hasMore && !isLoading && (
          <div className="p-4 border-t border-white/10">
            <button
              onClick={loadMore}
              disabled={isLoadingMore}
              className="w-full py-3 px-4 bg-purple-500/20 hover:bg-purple-500/30 disabled:bg-purple-500/10 disabled:opacity-50 text-purple-300 hover:text-purple-200 disabled:text-purple-400 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoadingMore ? (
                <div>
                  <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  Loading more...
                </div>
              ) : (
                <div>
                  Load More Players
                  <ChevronDown className="w-4 h-4" />
                </div>
              )}
            </button>
          </div>
        )}
        
        {/* No More Results */}
        {!hasMore && leaderboard.length > 0 && (
          <div className="p-4 text-center text-gray-400 text-sm border-t border-white/10">
            Showing all {leaderboard.length} players
          </div>
        )}
      </div>

      {/* Season Info */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <div>
            <p className="text-white font-medium">Season {RatingSystem.getCurrentSeason()}</p>
            <p className="text-sm text-gray-400">Compete to climb the rankings!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchHistoryTab({ history }: { history: MatchHistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-white font-medium mb-2">No matches yet</p>
        <p className="text-gray-400 text-sm">Play some games to build your history!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((match) => (
        <div 
          key={match.id}
          className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4"
        >
          {/* Game Type Icon */}
          <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Zap className="w-6 h-6 text-purple-400" />
          </div>

          {/* Match Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white capitalize">{match.gameType.replace('-', ' ')}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                match.mode === 'DAILY' ? 'bg-yellow-500/20 text-yellow-300' :
                match.mode === 'HEAD_TO_HEAD' ? 'bg-red-500/20 text-red-300' :
                'bg-gray-500/20 text-gray-300'
              }`}>
                {match.mode}
              </span>
            </div>
            <p className="text-sm text-gray-400">
              Score: {match.score}/{match.maxScore} ({(match.accuracy * 100).toFixed(0)}%)
            </p>
          </div>

          {/* Rating Change */}
          <div className="text-right">
            <p className={`text-lg font-bold ${
              match.ratingChange > 0 ? 'text-green-400' :
              match.ratingChange < 0 ? 'text-red-400' :
              'text-gray-400'
            }`}>
              {RatingSystem.formatRatingChange(match.ratingChange)}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(match.playedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChallengesTab({ onStartChallenge }: { onStartChallenge: (opponentId: number) => void }) {
  const [_challengeUsername, setChallengeUsername] = useState('');
  
  const _handleChallenge = (id: number) => {
    onStartChallenge(id);
  };

  return (
    <div className="space-y-6">
      {/* Challenge a Friend */}
      <div className="p-6 rounded-2xl bg-linear-to-r from-red-500/20 to-orange-500/20 border border-red-500/20">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-red-500/20 flex items-center justify-center">
            <Swords className="w-7 h-7 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Challenge a Friend</h3>
            <p className="text-sm text-gray-400">Send a head-to-head challenge to any AniList user</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={_challengeUsername}
            onChange={(e) => setChallengeUsername(e.target.value)}
            placeholder="Enter AniList username..."
            className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50"
          />
          <button 
            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors"
            onClick={() => _handleChallenge(0)} // Placeholder ID
          >
            Challenge
          </button>
        </div>
      </div>

      {/* Pending Challenges */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-400" />
          Pending Challenges
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-400">No pending challenges</p>
          <p className="text-sm text-gray-500 mt-1">Challenge someone to start a rivalry!</p>
        </div>
      </div>

      {/* Rivalries */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-400" />
          Your Rivalries
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-400">No rivalries yet</p>
          <p className="text-sm text-gray-500 mt-1">Play against the same person 5+ times to start a rivalry</p>
        </div>
      </div>

      {/* Quick Match */}
      <div className="p-6 rounded-2xl bg-linear-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Users className="w-7 h-7 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Quick Match</h3>
              <p className="text-sm text-gray-400">Get matched with a random opponent (coming soon)</p>
            </div>
          </div>
          <button 
            disabled
            className="px-6 py-3 bg-white/10 text-gray-500 font-bold rounded-xl cursor-not-allowed"
          >
            Coming Soon
          </button>
        </div>
      </div>
    </div>
  );
}
