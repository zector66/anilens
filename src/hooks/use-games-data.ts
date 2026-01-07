import { useMemo } from "react";
import { useAuth } from "./use-auth";
import { useGameStats } from "./use-game-stats";

export function useGamesData() {
  const { user } = useAuth();
  const { profile, isLoadingProfile } = useGameStats();

  const gamesData = useMemo(() => {
    if (!profile || !user) return null;

    // Find the overall rating from the ratings array
    const overallRating = profile.ratings.find(r => r.game_type === 'overall')?.rating || 1000;
    
    // Find the rank from the ratings
    const rankData = profile.ratings.find(r => r.game_type === 'overall');
    const rank = rankData?.rating || 1000;
    
    // Find best game based on highest rating
    const bestGameRating = profile.ratings.reduce((best, current) => 
      current.rating > best.rating ? current : best
    );
    const bestGame = bestGameRating?.game_type || "Quote Guessing";
    
    // Simple rank icon based on rating
    const getRankIcon = (rating: number) => {
      if (rating >= 2500) return "🏆";
      if (rating >= 2000) return "💎";
      if (rating >= 1500) return "🥇";
      if (rating >= 1000) return "🎯";
      return "🎮";
    };

    return {
      overallRating,
      rank: rankData?.rating || 1000,
      bestGame,
      rankIcon: getRankIcon(rank),
      // Add other game data as needed
    };
  }, [profile, user]);

  return { gamesData, loading: isLoadingProfile };
}
