'use client';

import { useEffect, useState } from 'react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { GameSession } from '@/types/anilist';
import { GameEngine } from '@/lib/game-engine';
import { Target, Clock, Crown, Swords, Users, RotateCcw, ArrowLeft, Star, Zap, TrendingUp } from 'lucide-react';
import { MultiplayerRoom } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useGameStats } from '@/hooks/use-game-stats';
import { RankBadge, MMRChange } from './rank-badge';

interface MultiplayerResultsProps {
  results: GameSession;
  room: MultiplayerRoom;
  onPlayAgain: () => void;
  onBackToHub: () => void;
}

export function MultiplayerResults({ results, room, onPlayAgain, onBackToHub }: MultiplayerResultsProps) {
  const { user } = useAuth();
  const { submitGameResult, canSubmitScores } = useGameStats();
  const [showConfetti, setShowConfetti] = useState(false);
  const [mmrResult, setMmrResult] = useState<{
    oldRating: number;
    newRating: number;
    change: number;
    isWin: boolean;
  } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Find current player and opponent
  const currentPlayer = room.players.find(p => p.id === String(user?.id));
  const opponent = room.players.find(p => p.id !== String(user?.id));

  // Determine winner
  const myScore = currentPlayer?.score || 0;
  const opponentScore = opponent?.score || 0;
  const isWinner = myScore > opponentScore;
  const isDraw = myScore === opponentScore;

  // Calculate stats
  const score = GameEngine.calculateScore(results);
  const accuracy = GameEngine.calculateAccuracy(results);
  const correctAnswers = results.answers.filter(a => a.correct).length;
  const totalQuestions = results.questions.length;

  // Submit results on mount
  useEffect(() => {
    const submitResults = async () => {
      if (!canSubmitScores || isSubmitting || mmrResult) return;
      
      setIsSubmitting(true);
      try {
        const avgTime = results.answers.reduce((acc, a) => acc + a.timeTaken, 0) / (results.answers.length || 1) * 1000;
        
        const result = await submitGameResult(
          room.gameType,
          score,
          totalQuestions * 100, // Estimate max score
          correctAnswers,
          totalQuestions,
          avgTime,
          room.settings.difficulty
        );

        if (result.success) {
          setMmrResult({
            oldRating: result.oldRating || 0,
            newRating: result.newRating || 0,
            change: result.ratingChange || 0,
            isWin: result.isWin || false,
          });
        } else {
          setSubmitError(result.error || 'Failed to save score');
        }
      } catch (error) {
        console.error('Error submitting multiplayer results:', error);
        setSubmitError('Network error while saving score');
      } finally {
        setIsSubmitting(false);
      }
    };

    submitResults();
  }, [canSubmitScores, room.gameType, score, correctAnswers, totalQuestions, results.answers, room.settings.difficulty, submitGameResult, isSubmitting, mmrResult]);

  useEffect(() => {
    if (isWinner) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isWinner]);

  const getResultMessage = () => {
    if (isDraw) return { text: 'Draw!', emoji: '🤝', color: 'text-yellow-400' };
    if (isWinner) return { text: 'Victory!', emoji: '🏆', color: 'text-green-400' };
    return { text: 'Defeat', emoji: '😔', color: 'text-red-400' };
  };

  const resultInfo = getResultMessage();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#A855F7', '#3B82F6'][Math.floor(Math.random() * 5)],
                width: '10px',
                height: '10px',
                borderRadius: Math.random() > 0.5 ? '50%' : '0',
              }}
            />
          ))}
        </div>
      )}

      {/* Winner Announcement */}
      <div className={`text-center p-8 rounded-2xl border ${
        isWinner ? 'bg-green-500/10 border-green-500/30' : 
        isDraw ? 'bg-yellow-500/10 border-yellow-500/30' : 
        'bg-red-500/10 border-red-500/30'
      }`}>
        <div className="text-8xl mb-4 animate-bounce">{resultInfo.emoji}</div>
        <h2 className={`text-4xl font-black mb-2 ${resultInfo.color}`}>
          {resultInfo.text}
        </h2>
        <p className="text-gray-400 mb-6">
          {isDraw ? 'You both played equally well!' : 
           isWinner ? 'You outplayed your opponent!' : 
           'Better luck next time!'}
        </p>

        {/* MMR Change Display */}
        {mmrResult && (
          <div className="flex flex-col items-center gap-4 bg-white/5 p-6 rounded-xl border border-white/10 max-w-sm mx-auto">
            <div className="flex items-center gap-2 text-sm text-gray-400 uppercase tracking-widest">
              <TrendingUp className="w-4 h-4" />
              Rating Updated
            </div>
            <div className="flex items-center gap-6">
              <RankBadge mmr={mmrResult.newRating} size="lg" />
              <MMRChange change={mmrResult.change} oldMMR={mmrResult.oldRating} newMMR={mmrResult.newRating} />
            </div>
            <div className="text-xs text-gray-500">
              {mmrResult.oldRating} → {mmrResult.newRating} MMR
            </div>
          </div>
        )}
        {submitError && (
          <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 max-w-sm mx-auto">
            <p className="font-bold text-red-400">Score Not Saved</p>
            <p className="text-red-300 text-sm mt-1">{submitError}</p>
          </div>
        )}
        {!canSubmitScores && !isSubmitting && !mmrResult && (
          <div className="mt-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 max-w-sm mx-auto">
            <p className="font-bold text-yellow-400">Login Required</p>
            <p className="text-yellow-300 text-sm mt-1">
              Sign in with AniList OAuth to save scores and compete on the leaderboard.
            </p>
          </div>
        )}
      </div>

      {/* Head-to-Head Comparison */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
          <Swords className="w-5 h-5 text-purple-400" />
          Head-to-Head Results
        </h3>

        <div className="grid grid-cols-3 gap-4 items-center">
          {/* Current Player */}
          <div className={`text-center p-4 rounded-xl ${isWinner ? 'bg-green-500/10 border border-green-500/30' : 'bg-white/5'}`}>
            <div className="relative inline-block mb-3">
              {currentPlayer?.avatar ? (
                <OptimizedImage
                  src={currentPlayer.avatar}
                  alt={currentPlayer.name}
                  width={64}
                  height={64}
                  className="rounded-xl border-2 border-purple-500/50"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Users className="w-8 h-8 text-purple-400" />
                </div>
              )}
              {isWinner && (
                <div className="absolute -top-2 -right-2">
                  <Crown className="w-6 h-6 text-yellow-400" />
                </div>
              )}
            </div>
            <p className="font-bold text-white truncate">{currentPlayer?.name || 'You'}</p>
            <p className="text-xs text-purple-400">(You)</p>
          </div>

          {/* VS / Scores */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-2">
              <span className={`text-4xl font-black ${isWinner ? 'text-green-400' : isDraw ? 'text-yellow-400' : 'text-white'}`}>
                {myScore}
              </span>
              <span className="text-2xl text-gray-500">vs</span>
              <span className={`text-4xl font-black ${!isWinner && !isDraw ? 'text-red-400' : isDraw ? 'text-yellow-400' : 'text-white'}`}>
                {opponentScore}
              </span>
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Final Score</p>
          </div>

          {/* Opponent */}
          <div className={`text-center p-4 rounded-xl ${!isWinner && !isDraw ? 'bg-red-500/10 border border-red-500/30' : 'bg-white/5'}`}>
            <div className="relative inline-block mb-3">
              {opponent?.avatar ? (
                <OptimizedImage
                  src={opponent.avatar}
                  alt={opponent.name}
                  width={64}
                  height={64}
                  className="rounded-xl border-2 border-red-500/50"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <Users className="w-8 h-8 text-red-400" />
                </div>
              )}
              {!isWinner && !isDraw && (
                <div className="absolute -top-2 -right-2">
                  <Crown className="w-6 h-6 text-yellow-400" />
                </div>
              )}
            </div>
            <p className="font-bold text-white truncate">{opponent?.name || 'Opponent'}</p>
            <p className="text-xs text-red-400">Opponent</p>
          </div>
        </div>
      </div>

      {/* Your Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
            <Star className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-sm text-gray-400 mb-1">Your Score</p>
          <div className="text-3xl font-black text-blue-400">{score}</div>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
          <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6 text-green-400" />
          </div>
          <p className="text-sm text-gray-400 mb-1">Accuracy</p>
          <div className="text-3xl font-black text-green-400">{accuracy.toFixed(0)}%</div>
          <p className="text-xs text-gray-500">{correctAnswers}/{totalQuestions} correct</p>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
            <Zap className="w-6 h-6 text-purple-400" />
          </div>
          <p className="text-sm text-gray-400 mb-1">Win Margin</p>
          <div className={`text-3xl font-black ${
            myScore - opponentScore > 0 ? 'text-green-400' : 
            myScore - opponentScore < 0 ? 'text-red-400' : 
            'text-yellow-400'
          }`}>
            {myScore - opponentScore > 0 ? '+' : ''}{myScore - opponentScore}
          </div>
          <p className="text-xs text-gray-500">points</p>
        </div>
      </div>

      {/* Question-by-Question Comparison */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          Question Breakdown
        </h3>
        <div className="space-y-2">
          {results.answers.map((answer, index) => {
            const opponentAnswer = opponent?.answers[index];
            const youCorrect = answer.correct;
            const opponentCorrect = opponentAnswer === 1;
            
            return (
              <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                <span className="text-xs text-gray-500 w-6">Q{index + 1}</span>
                <div className="flex-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg ${youCorrect ? 'text-green-400' : 'text-red-400'}`}>
                      {youCorrect ? '✓' : '✗'}
                    </span>
                    <span className="text-xs text-gray-400">You</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Opponent</span>
                    <span className={`text-lg ${opponentCorrect ? 'text-green-400' : 'text-red-400'}`}>
                      {opponentCorrect ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <button
          onClick={onPlayAgain}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          Rematch
        </button>
        <button
          onClick={onBackToHub}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors border border-white/20"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Games
        </button>
      </div>

      {/* CSS for confetti animation */}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
