"use client";

import React, { useMemo } from "react";
import { StudioEditor } from "./studio-editor";
import { useAnimeList, useMangaList } from "@/hooks/use-anilist";
import { TasteAnalyzer } from "@/lib/taste-analyzer";
import { normalizeMediaList } from "@/lib/normalize-media-list";
import { buildPosterData, filterEntries } from "@/lib/studio-compute";
import { StudioConfig, PosterData } from "@/types/studio";
import { Loader2 } from "lucide-react";

interface StudioWrapperProps {
  userId: number;
  username: string;
  userAvatar?: string;
  userBanner?: string;
}

const ALL_STATUSES = ["COMPLETED", "CURRENT", "DROPPED", "PAUSED", "PLANNING", "REPEATING"];

const DEFAULT_CONFIG: StudioConfig = {
  media: "both",
  timeWindow: "all",
  statuses: ALL_STATUSES as StudioConfig["statuses"],
  template: "poster",
  tone: "neutral",
  theme: { mode: "dark", accent: "#8b5cf6" },
  privacy: {},
  modules: [
    { id: "topAnime", enabled: true, settings: { count: 5 } },
    { id: "topManga", enabled: true, settings: { count: 5 } },
    { id: "animeStats", enabled: true },
    { id: "mangaStats", enabled: true },
    { id: "percentiles", enabled: true },
    { id: "topTags", enabled: true, settings: { count: 12 } },
    { id: "genreRadar", enabled: true },
    { id: "monthlyActivity", enabled: true },
    { id: "hottestTake", enabled: true },
    { id: "gamesRank", enabled: false },
    { id: "tasteFingerprint", enabled: true },
    { id: "contradiction", enabled: true },
  ],
};

export function StudioWrapper({ userId, username, userAvatar, userBanner }: StudioWrapperProps) {
  const { data: animeList, isLoading: animeLoading } = useAnimeList(userId);
  const { data: mangaList, isLoading: mangaLoading } = useMangaList(userId);

  const posterData = useMemo<PosterData | null>(() => {
    if (!animeList && !mangaList) return null;

    try {
      // Normalize and combine lists (use statuses option, not includeStatuses)
      const allEntries = [
        ...normalizeMediaList(animeList, { statuses: ALL_STATUSES }),
        ...normalizeMediaList(mangaList, { statuses: ALL_STATUSES }),
      ];

      if (allEntries.length === 0) return null;

      // Filter entries based on config
      const filteredEntries = filterEntries(allEntries, DEFAULT_CONFIG);

      // Build taste profile for percentiles and other analytics using static method
      const animeEntries = filteredEntries.filter(e => e.media?.type === "ANIME");
      const tasteProfile = TasteAnalyzer.analyzeTaste(animeEntries, "ANIME");

      // Build poster data
      const data = buildPosterData(
        filteredEntries,
        DEFAULT_CONFIG,
        tasteProfile,
        undefined, // games data
        userAvatar,
        userBanner,
        username
      );

      return data;
    } catch (error) {
      console.error("Failed to build poster data:", error);
      return null;
    }
  }, [animeList, mangaList, username, userAvatar, userBanner]);

  const isLoading = animeLoading || mangaLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[700px] bg-linear-to-br from-gray-900 to-gray-950 rounded-2xl border border-gray-800/50 shadow-2xl">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
          <div className="absolute -inset-4 bg-purple-500/10 rounded-full blur-2xl animate-pulse" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Loading Your Data</h3>
        <p className="text-gray-400 text-sm">Fetching your anime and manga lists...</p>
        <div className="flex gap-1 mt-4">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    );
  }

  if (!posterData) {
    return (
      <div className="flex flex-col items-center justify-center h-[700px] bg-linear-to-br from-gray-900 to-gray-950 rounded-2xl border border-gray-800/50 shadow-2xl">
        <div className="w-20 h-20 rounded-2xl bg-gray-800 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No Data Available</h3>
        <p className="text-gray-400 text-sm text-center max-w-sm">
          Add some anime or manga to your AniList account to start creating beautiful posters
        </p>
      </div>
    );
  }

  return <StudioEditor posterData={posterData} />;
}
