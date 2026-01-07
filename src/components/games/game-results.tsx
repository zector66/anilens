'use client';

import { useEffect, useState } from 'react';
import { GameSession } from '@/types/anilist';
import { GameEngine } from '@/lib/game-engine';
import { Trophy, Clock, Target, TrendingUp, Award, RotateCcw, ArrowLeft, Zap, Star, Loader2 } from 'lucide-react';
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
        {!canSubmitScores && !isSubmitting && (
          <p className="mt-4 text-xs text-gray-500">
            Login with AniList to save your scores and compete in rankings!
          </p>
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
              <div key={answer.questionId} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {isCorrect ? '✓' : '✗'}
                  </div>
                  <div>
                    <p className="font-medium text-white">Question {index + 1}</p>
                    <p className="text-xs text-gray-400">
                      {question?.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
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
