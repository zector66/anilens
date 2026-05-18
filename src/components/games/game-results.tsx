'use client';

import { useEffect, useState } from 'react';
import { GameSession } from '@/types/anilist';
import { GameEngine } from '@/lib/game-engine';
import { Trophy, Clock, Target, TrendingUp, Award, RotateCcw, ArrowLeft, Zap, Star, Loader2, Heart, Check, X, Music, Image as ImageIcon, Gamepad2, User, Mic } from 'lucide-react';
import { useGameStats } from '@/hooks/use-game-stats';
import { RankBadge, MMRChange } from './rank-badge';

interface GameResultsProps {
  results: GameSession;
  onPlayAgain: () => void;
  onBackToHub: () => void;
  difficulty?: string;
  activeType?: 'ANIME' | 'MANGA';
}

export function GameResults({ results, onPlayAgain, onBackToHub, difficulty = 'mixed', activeType = 'ANIME' }: GameResultsProps) {
  const { submitGameResult, isSubmitting, canSubmitScores } = useGameStats();
  const [mmrResult, setMmrResult] = useState<{
    oldRating: number;
    newRating: number;
    ratingChange: number;
  } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Submit game results to database on mount
  useEffect(() => {
    if (submitted || !canSubmitScores) return;

    const submitResults = async () => {
      const score = GameEngine.calculateScore(results);
      const maxScore = results.questions.reduce((sum, q) => sum + q.points, 0);
      const correctCount = results.answers.filter(a => a.correct).length;
      const totalTime = Math.floor((results.endTime! - results.startTime) / 1000);
      const avgTime = totalTime / results.answers.length;

      try {
        const result = await submitGameResult(
          results.type,
          score,
          maxScore,
          correctCount,
          results.questions.length,
          avgTime,
          difficulty
        );

        if (result.success && result.oldRating !== undefined) {
          setMmrResult({
            oldRating: result.oldRating,
            newRating: result.newRating!,
            ratingChange: result.ratingChange!,
          });
        } else if (!result.success) {
          setSubmitError(result.error || 'Failed to save score');
        }
      } catch (err) {
        setSubmitError('Network error while saving score');
        console.error('Game submission exception:', err);
      }
      setSubmitted(true);
    };

    submitResults();
  }, [results, difficulty, submitGameResult, canSubmitScores, submitted]);
  const score = GameEngine.calculateScore(results);
  const accuracy = GameEngine.calculateAccuracy(results);
  const performanceLevel = GameEngine.getPerformanceLevel(score, results.questions.reduce((sum, q) => sum + q.points, 0), activeType);
  const totalTime = Math.floor((results.endTime! - results.startTime) / 1000);

  const correctAnswers = results.answers.filter(a => a.correct).length;
  const totalQuestions = results.answers.length;
  const averageTimePerQuestion = totalTime / totalQuestions;

  const getPerformanceLevelLabel = (level: string) => {
    return level;
  };

  const getPerformanceGradient = (level: string) => {
    if (level.includes('Master')) return 'from-purple-500 to-pink-500';
    switch (level) {
      case 'Expert': return 'from-blue-500 to-cyan-500';
      case 'Advanced': return 'from-green-500 to-emerald-500';
      case 'Intermediate': return 'from-yellow-500 to-orange-500';
      case 'Novice': return 'from-orange-500 to-red-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getPerformanceEmoji = (level: string) => {
    if (level.includes('Master')) return '🏆';
    switch (level) {
      case 'Expert': return '🥇';
      case 'Advanced': return '🥈';
      case 'Intermediate': return '🥉';
      case 'Novice': return '👍';
      default: return '💪';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center p-8 rounded-2xl bg-white/5 border border-white/10">
        <div className="text-7xl mb-4 animate-bounce">{getPerformanceEmoji(performanceLevel)}</div>
        <h2 className="text-3xl font-black text-white mb-2">Game Complete!</h2>
        <div className={`inline-block px-6 py-2 rounded-full bg-linear-to-r ${getPerformanceGradient(performanceLevel)} text-white font-bold text-xl`}>
          {getPerformanceLevelLabel(performanceLevel)}
        </div>
        
        {/* Score Progress Bar */}
        <div className="mt-6 max-w-md mx-auto">
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>Score</span>
            <span>{score} / {results.questions.reduce((sum, q) => sum + q.points, 0)}</span>
          </div>
          <div className="h-3 rounded-full bg-white/10 overflow-hidden">
            <div 
              className={`h-full rounded-full bg-linear-to-r ${getPerformanceGradient(performanceLevel)} transition-all duration-1000`}
              style={{ width: `${Math.min(100, (score / results.questions.reduce((sum, q) => sum + q.points, 0)) * 100)}%` }}
            />
          </div>
        </div>
        
        {/* MMR Change Display */}
        {isSubmitting && (
          <div className="mt-4 flex items-center justify-center gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Saving results...</span>
          </div>
        )}
        {mmrResult && (
          <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <MMRChange
              change={mmrResult.ratingChange}
              oldMMR={mmrResult.oldRating}
              newMMR={mmrResult.newRating}
            />
            <div className="mt-3">
              <RankBadge mmr={mmrResult.newRating} size="lg" showProgress />
            </div>
          </div>
        )}
        {submitError && (
          <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <p className="font-bold text-red-400">Score Not Saved</p>
            <p className="text-red-300 text-sm mt-1">{submitError}</p>
          </div>
        )}
        {!canSubmitScores && !isSubmitting && (
          <div className="mt-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
            <p className="font-bold text-yellow-400">Login Required</p>
            <p className="text-yellow-300 text-sm mt-1">
              Sign in with AniList OAuth to save scores and compete on the leaderboard.
            </p>
          </div>
        )}
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
            <Star className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-sm text-gray-400 mb-1">Final Score</p>
          <div className="text-4xl font-black text-blue-400">{score}</div>
          <p className="text-xs text-gray-500 mt-1">points earned</p>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
          <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6 text-green-400" />
          </div>
          <p className="text-sm text-gray-400 mb-1">Accuracy</p>
          <div className="text-4xl font-black text-green-400">{accuracy.toFixed(0)}%</div>
          <p className="text-xs text-gray-500 mt-1">{correctAnswers}/{totalQuestions} correct</p>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6 text-purple-400" />
          </div>
          <p className="text-sm text-gray-400 mb-1">Total Time</p>
          <div className="text-4xl font-black text-purple-400">{Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}</div>
          <p className="text-xs text-gray-500 mt-1">{averageTimePerQuestion.toFixed(1)}s avg</p>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
        <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
          <Target className="w-5 h-5 text-purple-400" />
          Question Breakdown
        </h3>
        <div className="space-y-3">
          {results.answers.map((answer, index) => {
            const question = results.questions.find(q => q.id === answer.questionId);
            const isCorrect = answer.correct;
            
            return (
              <div key={answer.questionId} className={`flex items-center justify-between p-3 rounded-xl border ${
                isCorrect ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {isCorrect ? <Check className="w-4 h-4" strokeWidth={3} /> : <X className="w-4 h-4" strokeWidth={3} />}
                  </div>
                  <div>
                    <p className="font-medium text-white">Question {index + 1}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {getQuestionTypeIcon(question?.type)}
                      <span className="text-xs text-gray-400">
                        {getQuestionTypeLabel(question?.type)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${isCorrect ? 'text-green-400' : 'text-gray-500'}`}>{answer.points} pts</p>
                  <p className="text-xs text-gray-500">{answer.timeTaken}s</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Insights & Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Performance Insights
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
              <span className="text-gray-400">Fastest Answer</span>
              <span className="font-bold text-cyan-400">
                {Math.min(...results.answers.map(a => a.timeTaken))}s
              </span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
              <span className="text-gray-400">Slowest Answer</span>
              <span className="font-bold text-orange-400">
                {Math.max(...results.answers.map(a => a.timeTaken))}s
              </span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
              <span className="text-gray-400">Best Streak</span>
              <span className="font-bold text-purple-400">
                {Math.max(...getCorrectStreaks(results.answers), 0)} in a row
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
            <Award className="w-5 h-5 text-yellow-400" />
            Achievements Earned
          </h3>
          <div className="space-y-2">
            {accuracy >= 90 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 text-green-400">
                <Trophy className="w-4 h-4" />
                <span className="text-sm font-medium">Perfect Performance</span>
              </div>
            )}
            {averageTimePerQuestion < 10 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">Speed Demon</span>
              </div>
            )}
            {correctAnswers === totalQuestions && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Target className="w-4 h-4" />
                <span className="text-sm font-medium">100% Accuracy</span>
              </div>
            )}
            {score > 200 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-500/10 text-orange-400">
                <Star className="w-4 h-4" />
                <span className="text-sm font-medium">High Scorer</span>
              </div>
            )}
            {accuracy < 50 && averageTimePerQuestion >= 10 && score <= 100 && (
              <p className="text-gray-500 text-sm italic">Keep playing to earn achievements!</p>
            )}
          </div>
        </div>
      </div>

      {/* Support Card */}
      <div className="p-4 rounded-xl bg-linear-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Heart className="w-5 h-5 text-pink-400" />
            <div>
              <p className="text-sm font-medium text-white">Enjoying AniLens?</p>
              <p className="text-xs text-gray-400">Support hosting costs ❤️</p>
            </div>
          </div>
          <a
            href="/support"
            className="px-4 py-2 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 text-sm font-medium transition-colors border border-pink-500/30"
          >
            Support
          </a>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <button 
          onClick={onPlayAgain} 
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          Play Again
        </button>
        <button 
          onClick={onBackToHub} 
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors border border-white/20"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Games
        </button>
      </div>
    </div>
  );
}

function getQuestionTypeLabel(type?: string): string {
  if (!type) return 'Unknown';
  const labels: Record<string, string> = {
    'OP_GUESS': 'OP/ED Theme',
    'SCREENSHOT_GUESS': 'Screenshot',
    'SCORE_GUESS': 'Score',
    'CHARACTER_GUESS': 'Character',
    'SEASON_MATCH': 'Season Match',
    'COVER_GUESS': 'Cover',
    'CHAPTER_COUNT_GUESS': 'Chapters',
    'HANGMAN': 'Hangman',
    'SEIYUU_GUESS': 'Voice Actor',
    'TAG_OR_CAP': 'Tag or Cap',
    'POPULARITY_BATTLE': 'Popularity',
    'TASTE_CONSISTENCY': 'Taste Check',
    'STUDIO_MATCH': 'Studio',
    'VA_CONNECTION': 'VA Connection',
    'RELATION_TYPE': 'Relation',
    'SCORE_LADDER': 'Score Ladder',
    'TAG_LADDER': 'Tag Ladder',
  };
  return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getQuestionTypeIcon(type?: string): React.ReactNode {
  if (!type) return null;
  const iconClass = "w-3 h-3 text-gray-500";
  switch (type) {
    case 'OP_GUESS': return <Music className={iconClass} />;
    case 'SCREENSHOT_GUESS': return <ImageIcon className={iconClass} />;
    case 'CHARACTER_GUESS': return <User className={iconClass} />;
    case 'SEIYUU_GUESS': return <Mic className={iconClass} />;
    case 'COVER_GUESS': return <ImageIcon className={iconClass} />;
    default: return <Gamepad2 className={iconClass} />;
  }
}

function getCorrectStreaks(answers: Array<{ correct: boolean }>): number[] {
  const streaks: number[] = [];
  let currentStreak = 0;
  
  answers.forEach(answer => {
    if (answer.correct) {
      currentStreak++;
    } else {
      if (currentStreak > 0) {
        streaks.push(currentStreak);
      }
      currentStreak = 0;
    }
  });
  
  if (currentStreak > 0) {
    streaks.push(currentStreak);
  }
  
  return streaks;
}
