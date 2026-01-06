'use client';

import { useState, useMemo } from 'react';
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
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
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
  Medal,
  Sparkles,
} from 'lucide-react';
import Image from 'next/image';

interface CommunityHubProps {
  onStartDailyChallenge: () => void;
  onStartChallenge: (opponentId: number) => void;
}

export function CommunityHub({ onStartDailyChallenge, onStartChallenge }: CommunityHubProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'leaderboard' | 'history' | 'challenges'>('profile');

  // Load data from localStorage using useMemo (sync operations)
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

  if (!user || !playerRating) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-purple-400" />
        </div>
        <p className="text-white font-medium mb-2">Login Required</p>
        <p className="text-gray-400 text-sm">Connect your AniList account to access community features</p>
      </div>
    );
  }

  const rankInfo = RatingSystem.getRankTitle(playerRating.ratings.overall);
  const percentile = RatingSystem.estimatePercentile(playerRating.ratings.overall);

  return (
    <div className="space-y-8">
      {/* Header with Player Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-pink-500/20 border border-white/20">
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

          {/* Rating Display */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-xl bg-white/5">
              <p className="text-xs text-gray-400 mb-1">Overall Rating</p>
              <p className="text-2xl font-bold text-white">{playerRating.ratings.overall}</p>
              <p className="text-xs text-purple-400">Top {percentile}%</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5">
              <p className="text-xs text-gray-400 mb-1">Games Played</p>
              <p className="text-2xl font-bold text-white">{playerRating.stats.totalGamesPlayed}</p>
              <p className="text-xs text-gray-500">{playerRating.stats.perfectGames} perfect</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5">
              <p className="text-xs text-gray-400 mb-1">Win Rate</p>
              <p className="text-2xl font-bold text-white">
                {playerRating.stats.totalGamesPlayed > 0 
                  ? `${((playerRating.stats.totalWins / playerRating.stats.totalGamesPlayed) * 100).toFixed(0)}%`
                  : 'N/A'}
              </p>
              <p className="text-xs text-gray-500">{playerRating.stats.totalWins} wins</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5">
              <p className="text-xs text-gray-400 mb-1">Best Streak</p>
              <p className="text-2xl font-bold text-white">{playerRating.stats.bestWinStreak}</p>
              <p className="text-xs text-orange-400 flex items-center gap-1">
                <Flame className="w-3 h-3" />
                Current: {playerRating.stats.winStreak}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Challenge Banner */}
      <div className={`p-6 rounded-2xl border ${
        dailyCompleted 
          ? 'bg-green-500/10 border-green-500/20' 
          : 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30'
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
        <PlayerStatsTab playerRating={playerRating} />
      )}
      {activeTab === 'leaderboard' && (
        <LeaderboardTab currentUserId={user.id} />
      )}
      {activeTab === 'history' && (
        <MatchHistoryTab history={matchHistory} />
      )}
      {activeTab === 'challenges' && (
        <ChallengesTab onStartChallenge={onStartChallenge} />
      )}
    </div>
  );
}

function PlayerStatsTab({ playerRating }: { playerRating: PlayerRating }) {
  const gameTypes = [
    { key: 'opGuessing', label: 'OP/ED Guessing', icon: '🎵' },
    { key: 'screenshotGuessing', label: 'Screenshot', icon: '📸' },
    { key: 'quoteGuessing', label: 'Quote Master', icon: '💬' },
    { key: 'scoreGuessing', label: 'Memory Test', icon: '🎯' },
    { key: 'characterGuessing', label: 'Character', icon: '👤' },
    { key: 'seasonMatching', label: 'Season Nav', icon: '📅' },
  ];

  const topGenres = Object.entries(playerRating.knowledgeAxes.genreExpertise)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Per-Game Ratings */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          Ratings by Game Type
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {gameTypes.map(({ key, label, icon }) => {
            const rating = playerRating.ratings[key as keyof typeof playerRating.ratings];
            const rankInfo = RatingSystem.getRankTitle(rating as number);
            return (
              <div key={key} className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{icon}</span>
                  <span className="text-sm text-gray-400">{label}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">{rating}</span>
                  <span className={`text-xs ${rankInfo.color}`}>{rankInfo.title}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Knowledge Axes */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-400" />
          Knowledge Expertise
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Era Expertise */}
          <div>
            <p className="text-sm text-gray-400 mb-3">Era Expertise</p>
            <div className="space-y-3">
              {[
                { key: 'modernEra', label: 'Modern (2015+)', color: 'bg-cyan-500' },
                { key: 'goldenEra', label: 'Golden (2010-2015)', color: 'bg-purple-500' },
                { key: 'classicEra', label: 'Classic (Pre-2010)', color: 'bg-amber-500' },
              ].map(({ key, label, color }) => (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{label}</span>
                    <span className="text-white font-medium">
                      {playerRating.knowledgeAxes[key as keyof typeof playerRating.knowledgeAxes] as number}%
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${color} rounded-full transition-all`}
                      style={{ width: `${playerRating.knowledgeAxes[key as keyof typeof playerRating.knowledgeAxes]}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popularity Expertise */}
          <div>
            <p className="text-sm text-gray-400 mb-3">Popularity Range</p>
            <div className="space-y-3">
              {[
                { key: 'mainstream', label: 'Mainstream (100k+)', color: 'bg-green-500' },
                { key: 'obscurity', label: 'Obscure (<20k)', color: 'bg-pink-500' },
              ].map(({ key, label, color }) => (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{label}</span>
                    <span className="text-white font-medium">
                      {playerRating.knowledgeAxes[key as keyof typeof playerRating.knowledgeAxes] as number}%
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${color} rounded-full transition-all`}
                      style={{ width: `${playerRating.knowledgeAxes[key as keyof typeof playerRating.knowledgeAxes]}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Genres */}
        {topGenres.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-sm text-gray-400 mb-3">Top Genre Expertise</p>
            <div className="flex flex-wrap gap-2">
              {topGenres.map(([genre, expertise]) => (
                <span 
                  key={genre}
                  className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 text-sm"
                >
                  {genre}: {expertise}%
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Achievements */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-400" />
          Achievements ({playerRating.achievements.length})
        </h3>
        {playerRating.achievements.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {playerRating.achievements.map((achievement) => (
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

function LeaderboardTab({ currentUserId: _currentUserId }: { currentUserId: number }) {
  return (
    <div className="space-y-6">
      {/* Leaderboard Type Selector */}
      <div className="flex gap-2 overflow-x-auto">
        {['Overall', 'OP/ED Guessing', 'Screenshot', 'Daily Challenge'].map((type) => (
          <button
            key={type}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              type === 'Overall' 
                ? 'bg-purple-500 text-white' 
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Leaderboard - Backend Required */}
      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-400" />
            Global Rankings
          </h3>
        </div>
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-yellow-400" />
          </div>
          <h4 className="text-lg font-semibold text-white mb-2">Leaderboard Coming Soon</h4>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-4">
            Global rankings require a backend service to track scores across all players. 
            For now, your local game stats are saved and displayed in the Stats tab.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm">
            <span>💡</span>
            <span>Play games to build your local stats!</span>
          </div>
        </div>
      </div>

      {/* Season Info */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <div>
            <p className="text-white font-medium">Season {RatingSystem.getCurrentSeason()}</p>
            <p className="text-sm text-gray-400">Rankings reset at the end of each quarter</p>
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

function ChallengesTab({ onStartChallenge: _onStartChallenge }: { onStartChallenge: (opponentId: number) => void }) {
  return (
    <div className="space-y-6">
      {/* Challenge a Friend */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/20">
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
            placeholder="Enter AniList username..."
            className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50"
          />
          <button className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors">
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
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/20">
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
