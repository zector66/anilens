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
} from 'lucide-react';
import Image from 'next/image';

interface CommunityHubProps {
  onStartDailyChallenge?: () => void;
  onStartChallenge?: (opponentId: number) => void;
  onNavigateToGames?: () => void;
}

export function CommunityHub({ onStartDailyChallenge, onStartChallenge, onNavigateToGames }: CommunityHubProps) {
  const { user, isOAuthAuthenticated, loginWithAniList } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'leaderboard' | 'history' | 'challenges'>('profile');
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

  // Log loading state for debugging if needed (to use the variable)
  useEffect(() => {
    if (_isLoadingProfile) {
      console.debug('Community profile loading...');
    }
  }, [_isLoadingProfile]);

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
            <Trophy className="w-10 h-10 text-purple-400" />
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
                Leaderboards
              </div>
              <p className="text-xs text-gray-500">Compete globally and per game type</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-blue-400 font-medium mb-1">
                <Target className="w-4 h-4" />
                MMR Rankings
              </div>
              <p className="text-xs text-gray-500">Climb from Iron to Challenger</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-green-400 font-medium mb-1">
                <Clock className="w-4 h-4" />
                Match History
              </div>
              <p className="text-xs text-gray-500">Track all your games and progress</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-yellow-400 font-medium mb-1">
                <Award className="w-4 h-4" />
                Achievements
              </div>
              <p className="text-xs text-gray-500">Unlock badges and rewards</p>
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
      {/* Quick Game Access - only show when used as standalone tab */}
      {onNavigateToGames && (
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Swords className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-white">Ready to play?</p>
              <p className="text-xs text-gray-400">8+ game modes based on your list</p>
            </div>
          </div>
          <button
            onClick={onNavigateToGames}
            className="px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-medium transition-colors flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Play Games
          </button>
        </div>
      )}

      {/* Header with Player Card */}
      <div className="p-6 rounded-2xl bg-linear-to-br from-purple-500/20 via-blue-500/20 to-pink-500/20 border border-white/20">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          {/* Avatar & Basic Info */}
          <div className="flex items-center gap-4">
            {user.avatar?.large ? (
              <Image
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

      {/* Daily Challenge Banner */}
      <div className={`p-6 rounded-2xl border ${
        dailyCompleted 
          ? 'bg-green-500/10 border-green-500/20' 
          : 'bg-linear-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
              dailyCompleted ? 'bg-green-500/20' : 'bg-yellow-500/20'
            }`}>
              {dailyCompleted ? (
                <Trophy className="w-7 h-7 text-green-400" />
              ) : (
                <Calendar className="w-7 h-7 text-yellow-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Daily Challenge</h3>
              <p className="text-sm text-gray-400">
                {dailyCompleted 
                  ? 'Completed! Come back tomorrow for a new challenge'
                  : 'Same questions for everyone. Compare your score!'}
              </p>
            </div>
          </div>
          <button
            onClick={onStartDailyChallenge}
            disabled={dailyCompleted}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              dailyCompleted
                ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                : 'bg-yellow-500 hover:bg-yellow-600 text-black'
            }`}
          >
            {dailyCompleted ? 'Completed ✓' : 'Play Now'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'profile', label: 'My Stats', icon: BarChart3 },
          { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
          { id: 'history', label: 'Match History', icon: Clock },
          { id: 'challenges', label: 'Challenges', icon: Swords },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
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
      {activeTab === 'profile' && (
        <PlayerStatsTab 
          dbRatings={dbProfile?.ratings || []} 
          dbStats={dbProfile?.stats || []} 
          overallRating={dbProfile?.overallRating}
        />
      )}
      {activeTab === 'leaderboard' && (
        <LeaderboardTab currentUserId={user.id} />
      )}
      {activeTab === 'history' && (
        <MatchHistoryTab history={matchHistory} />
      )}
      {activeTab === 'challenges' && (
        <ChallengesTab onStartChallenge={onStartChallenge || (() => {})} />
      )}
    </div>
  );
}

interface DbRating {
  game_type: string;
  rating: number;
  games_played: number;
  wins: number;
  best_streak: number;
}

interface DbStats {
  game_type: string;
  games_played: number;
  avg_accuracy: number;
}

interface OverallRating {
  total_rating: number;
  total_games: number;
  total_wins: number;
  best_streak: number;
  game_types_played: number;
}

function PlayerStatsTab({ dbRatings, dbStats, overallRating }: { dbRatings: DbRating[]; dbStats: DbStats[]; overallRating?: OverallRating }) {
  // All available game types
  const allGameTypes = [
    { key: 'op-guessing', label: 'OP/ED Guessing', icon: '🎵' },
    { key: 'quote-guessing', label: 'Quote Master', icon: '💬' },
    { key: 'score-guessing', label: 'Memory Test', icon: '🎯' },
    { key: 'character-guessing', label: 'Character', icon: '👤' },
    { key: 'season-matching', label: 'Season Nav', icon: '📅' },
    { key: 'cover-guessing', label: 'Cover Art', icon: '🖼️' },
    { key: 'chapters-guessing', label: 'Chapter Count', icon: '📚' },
    { key: 'hangman', label: 'Hangman', icon: '🎮' },
    { key: 'wordle', label: 'Wordle', icon: '⚡' },
  ];

  // Create a map of ratings by game type for quick lookup
  const ratingsMap = new Map(dbRatings.map(r => [r.game_type, r]));
  // statsMap currently unused but kept for future stats visualization
  // const statsMap = new Map(dbStats.map(s => [s.game_type, s]));

  // Calculate achievements based on real stats
  const achievements: string[] = [];
  const totalGames = dbRatings.reduce((sum, r) => sum + r.games_played, 0);
  const totalWins = dbRatings.reduce((sum, r) => sum + r.wins, 0);
  const bestStreak = dbRatings.reduce((max, r) => Math.max(max, r.best_streak), 0);
  const highestRating = dbRatings.reduce((max, r) => Math.max(max, r.rating), 0);

  if (totalGames >= 1) achievements.push('First Game');
  if (totalGames >= 10) achievements.push('Dedicated Player');
  if (totalGames >= 50) achievements.push('Veteran');
  if (totalWins >= 5) achievements.push('Winner');
  if (totalWins >= 25) achievements.push('Champion');
  if (bestStreak >= 3) achievements.push('On Fire');
  if (bestStreak >= 10) achievements.push('Unstoppable');
  if (highestRating >= 400) achievements.push('Bronze Tier');
  if (highestRating >= 800) achievements.push('Silver Tier');
  if (highestRating >= 1200) achievements.push('Gold Tier');
  if (highestRating >= 1600) achievements.push('Platinum Tier');
  if (highestRating >= 2000) achievements.push('Diamond Tier');

  // Calculate overall rank
  const totalMMR = overallRating?.total_rating || dbRatings.reduce((sum, r) => sum + r.rating, 0);
  const overallRank = RatingSystem.getRankTitle(totalMMR);

  return (
    <div className="space-y-6">
      {/* Overall MMR - Sum of all game modes */}
      <div className="p-6 rounded-2xl bg-linear-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400" />
          Overall Rating
        </h3>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-white">{totalMMR}</div>
            <div className={`text-lg font-medium ${overallRank.color}`}>{overallRank.title}</div>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-xl bg-white/5">
              <div className="text-2xl font-bold text-white">{overallRating?.total_games || totalGames}</div>
              <div className="text-xs text-gray-400">Games Played</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-white/5">
              <div className="text-2xl font-bold text-green-400">{overallRating?.total_wins || totalWins}</div>
              <div className="text-xs text-gray-400">Wins</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-white/5">
              <div className="text-2xl font-bold text-orange-400">{overallRating?.best_streak || bestStreak}</div>
              <div className="text-xs text-gray-400">Best Streak</div>
            </div>
          </div>
        </div>
      </div>

      {/* Per-Game Ratings - Shows ALL game types */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          Ratings by Game Type
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {allGameTypes.map(({ key, label, icon }) => {
            const rating = ratingsMap.get(key);
            const hasPlayed = rating && rating.games_played > 0;
            const mmr = rating?.rating || 0;
            const rankInfo = RatingSystem.getRankTitle(mmr);
            
            return (
              <div 
                key={key} 
                className={`p-4 rounded-xl border ${
                  hasPlayed 
                    ? 'bg-white/5 border-white/10' 
                    : 'bg-white/2 border-white/5 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{icon}</span>
                  <span className="text-sm text-gray-400">{label}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">{mmr}</span>
                  <span className={`text-xs ${rankInfo.color}`}>{rankInfo.title}</span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {hasPlayed 
                    ? `${rating.games_played} games • ${rating.wins} wins`
                    : 'Not played yet'
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Game Performance Stats from Database */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-400" />
          Performance by Game Type
        </h3>
        {dbStats.length === 0 ? (
          <p className="text-gray-500 text-sm">Complete games to see your performance stats!</p>
        ) : (
          <div className="space-y-4">
            {dbStats.map((stat) => {
              const gameType = allGameTypes.find(g => g.key === stat.game_type);
              const info = gameType || { key: stat.game_type, label: stat.game_type, icon: '🎮' };
              const accuracy = stat.avg_accuracy || 0;
              return (
                <div key={stat.game_type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300 flex items-center gap-2">
                      <span>{info.icon}</span> {info.label}
                    </span>
                    <span className="text-white font-medium">
                      {accuracy.toFixed(0)}% accuracy
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        accuracy >= 80 ? 'bg-green-500' : 
                        accuracy >= 60 ? 'bg-yellow-500' : 
                        accuracy >= 40 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, accuracy)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {stat.games_played} games played
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Achievements based on real stats */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-400" />
          Achievements ({achievements.length})
        </h3>
        {achievements.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {achievements.map((achievement) => (
              <span 
                key={achievement}
                className="px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-300 text-sm flex items-center gap-1"
              >
                <Star className="w-3 h-3" />
                {achievement}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Play games to unlock achievements!</p>
        )}
      </div>
    </div>
  );
}

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

  // Fetch leaderboard on mount and when type changes
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/leaderboard?gameType=${leaderboardType}&limit=50`);
        const data = await response.json();
        if (data.success) {
          setLeaderboard(data.leaderboard || []);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, [leaderboardType]);

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
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading leaderboard...</p>
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
                  key={player.anilist_id}
                  className={`p-4 flex items-center gap-4 ${isCurrentUser ? 'bg-purple-500/10' : ''}`}
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
                    <Image
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
                      {player.username}
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
