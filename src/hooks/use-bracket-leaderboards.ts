import { useQuery } from "@tanstack/react-query";

export type EntityType = "anime" | "manga" | "character" | "openings" | "endings";
export type SortBy = "wins" | "championships" | "winrate";

export interface LeaderboardEntry {
  entityType: EntityType;
  entityId: number;
  wins: number;
  losses: number;
  appearances: number;
  championships: number;
  winRate: number;
  updatedAt?: string;
  daysActive?: number;
}

interface LeaderboardResponse {
  items: LeaderboardEntry[];
  meta: {
    entityType: EntityType;
    minAppearances: number;
    sortBy?: SortBy;
    days?: number;
    count: number;
    startDate?: string;
  };
}

/**
 * Fetch all-time leaderboard for bracket entities
 */
export function useAllTimeLeaderboard(
  type: EntityType,
  options: {
    minAppearances?: number;
    limit?: number;
    sortBy?: SortBy;
    enabled?: boolean;
  } = {}
) {
  const { minAppearances = 10, limit = 50, sortBy = "wins", enabled = true } = options;

  return useQuery({
    queryKey: ["leaderboard", "alltime", type, minAppearances, limit, sortBy],
    queryFn: async (): Promise<LeaderboardResponse> => {
      const params = new URLSearchParams({
        type,
        min: String(minAppearances),
        limit: String(limit),
        sort: sortBy,
      });
      const res = await fetch(`/api/leaderboards/entities?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch leaderboard");
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled,
  });
}

/**
 * Fetch trending leaderboard for bracket entities (last N days)
 */
export function useTrendingLeaderboard(
  type: EntityType,
  options: {
    days?: number;
    minAppearances?: number;
    limit?: number;
    enabled?: boolean;
  } = {}
) {
  const { days = 7, minAppearances = 3, limit = 50, enabled = true } = options;

  return useQuery({
    queryKey: ["leaderboard", "trending", type, days, minAppearances, limit],
    queryFn: async (): Promise<LeaderboardResponse> => {
      const params = new URLSearchParams({
        type,
        days: String(days),
        min: String(minAppearances),
        limit: String(limit),
      });
      const res = await fetch(`/api/leaderboards/entities/trending?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch trending leaderboard");
      }
      return res.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled,
  });
}

/**
 * Submit completed bracket results
 */
export async function submitBracketResults(data: {
  runId: string;
  bracketType: EntityType;
  bracketSize: number;
  matches: Array<{
    entityType: EntityType;
    winnerId: number;
    loserId: number;
  }>;
  championId?: number;
  userId?: number;
}): Promise<{ ok: boolean; already_processed?: boolean; matches_processed?: number }> {
  const res = await fetch("/api/brackets/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to submit bracket results");
  }

  return res.json();
}
