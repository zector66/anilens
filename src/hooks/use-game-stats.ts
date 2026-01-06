'use client';

import { useState, useCallback } from 'react';
import { useAuth } from './use-auth';

interface GameSubmitResult {
  success: boolean;
  oldRating?: number;
  newRating?: number;
  ratingChange?: number;
  rank?: number;
  isWin?: boolean;
  error?: string;
}

interface PlayerProfile {
  user: {
    id: number;
    anilist_id: number;
    username: string;
    avatar_url: string;
  };
  ratings: Array<{
    game_type: string;
    rating: number;
    games_played: number;
    wins: number;
    best_streak: number;
    current_streak: number;
  }>;
  history: Array<{
    game_type: string;
    score: number;
    max_score: number;
    rating_change: number;
    created_at: string;
  }>;
  stats: Array<{
    game_type: string;
    games_played: number;
    avg_accuracy: number;
    total_correct: number;
    total_questions: number;
  }>;
}

export function useGameStats() {
  const { user, canSubmitScores } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Submit game results to the database
  const submitGameResult = useCallback(async (
    gameType: string,
    score: number,
    maxScore: number,
    correctCount: number,
    questionsCount: number,
    avgTime: number,
    difficulty: string
  ): Promise<GameSubmitResult> => {
    if (!user || !canSubmitScores) {
      return { 
        success: false, 
        error: 'Must be logged in with AniList to save scores' 
      };
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/game/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anilistId: user.id,
          username: user.name,
          avatarUrl: user.avatar?.large,
          gameType,
          score,
          maxScore,
          correctCount,
          questionsCount,
          avgTime,
          difficulty,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          oldRating: data.oldRating,
          newRating: data.newRating,
          ratingChange: data.ratingChange,
          rank: data.rank,
          isWin: data.isWin,
        };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Failed to submit game:', error);
      return { success: false, error: 'Failed to submit game results' };
    } finally {
      setIsSubmitting(false);
    }
  }, [user, canSubmitScores]);

  // Load user profile with stats
  const loadProfile = useCallback(async () => {
    if (!user) return null;

    setIsLoadingProfile(true);
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
        setProfile(data);
        return data as PlayerProfile;
      }
      return null;
    } catch (error) {
      console.error('Failed to load profile:', error);
      return null;
    } finally {
      setIsLoadingProfile(false);
    }
  }, [user]);

  return {
    submitGameResult,
    isSubmitting,
    loadProfile,
    profile,
    isLoadingProfile,
    canSubmitScores,
  };
}

// Hook to fetch leaderboard data
export function useLeaderboard(gameType: string = 'global') {
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
  const [isLoading, setIsLoading] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/leaderboard?gameType=${gameType}&limit=100`);
      const data = await response.json();
      
      if (data.success) {
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [gameType]);

  return {
    leaderboard,
    isLoading,
    fetchLeaderboard,
  };
}
