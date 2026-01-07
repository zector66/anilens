"use client";

import React, { useState, useEffect, useMemo } from "react";
import { StudioConfig, PosterData, STUDIO_MODULES, StudioModuleId } from "@/types/studio";
import { filterEntries, buildPosterData } from "@/lib/studio-compute";
import { PosterRenderer } from "@/components/studio/poster-renderer";
import { StudioControls } from "@/components/studio/studio-controls";
import { useAniListData } from "@/hooks/use-anilist-data";
import { useTasteProfile } from "@/hooks/use-taste-profile";
import { useGamesData } from "@/hooks/use-games-data";
import { AuthManager } from "@/lib/auth";

// Default configuration
const DEFAULT_CONFIG: StudioConfig = {
  media: "both",
  timeWindow: "all",
  statuses: ["COMPLETED", "CURRENT", "REPEATING"],
  template: "poster",
  tone: "neutral",
  theme: { mode: "dark", accent: "#8b5cf6" },
  privacy: { hideUsername: false, hideCounts: false, hideScores: false },
  modules: Object.values(STUDIO_MODULES).map(module => ({
    id: module.id,
    enabled: true,
    settings: module.id === "topAnime" || module.id === "topManga" || module.id === "topTags"
      ? { count: module.defaultCount || 20 }
      : undefined
  }))
};

export default function StudioPage() {
  const { entries, loading: entriesLoading, user } = useAniListData();
  const { tasteProfile, loading: tasteLoading } = useTasteProfile();
  const { gamesData, loading: gamesLoading } = useGamesData();
  
  const [config, setConfig] = useState<StudioConfig>(DEFAULT_CONFIG);
  const [posterData, setPosterData] = useState<PosterData | null>(null);

  // Load config from URL on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const configParam = urlParams.get("config");
        if (configParam) {
          const loadedConfig = JSON.parse(atob(configParam));
          setConfig({ ...DEFAULT_CONFIG, ...loadedConfig });
        }
      } catch (error) {
        console.error("Failed to load config from URL:", error);
      }
    }
  }, []);

  // Update URL when config changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const configString = btoa(JSON.stringify(config));
      const newUrl = `${window.location.pathname}?config=${configString}`;
      window.history.replaceState({}, "", newUrl);
    }
  }, [config]);

  // Compute poster data whenever dependencies change
  const posterDataMemo = useMemo(() => {
    if (!entries.length || tasteLoading || entriesLoading || !tasteProfile) return null;

    try {
      const filtered = filterEntries(entries, config);
      const data = buildPosterData(
        filtered,
        config,
        tasteProfile,
        gamesData || undefined,
        user?.avatarImage?.large,
        undefined,
        user?.name
      );
      return data;
    } catch (error) {
      console.error("Failed to build poster data:", error);
      return null;
    }
  }, [entries, config, tasteProfile, gamesData, user, tasteLoading, entriesLoading]);

  useEffect(() => {
    setPosterData(posterDataMemo);
  }, [posterDataMemo]);

  const handleConfigChange = (newConfig: Partial<StudioConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const handleModuleToggle = (moduleId: StudioModuleId, enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      modules: prev.modules.map(m => 
        m.id === moduleId ? { ...m, enabled } : m
      )
    }));
  };

  const handleModuleSettings = (moduleId: StudioModuleId, settings: Record<string, string | number | boolean>) => {
    setConfig(prev => ({
      ...prev,
      modules: prev.modules.map(m => 
        m.id === moduleId ? { ...m, settings } : m
      )
    }));
  };

  const handleExport = async () => {
    if (!posterData) return;

    try {
      // This will be implemented in the PosterRenderer component
      const exportElement = document.getElementById("poster-export");
      if (exportElement) {
        // Use html2canvas or similar library
        console.log("Exporting poster...");
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleShare = () => {
    const shareText = `Made this on AniLens Studio — here's my taste poster (${config.timeWindow === "all" ? "All-time" : config.timeWindow}). Check it out: anilens.vercel.app/studio${config.timeWindow !== "all" ? `?config=${btoa(JSON.stringify(config))}` : ""}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      // Show success message
    }
  };

  if (entriesLoading || tasteLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your AniList data...</p>
        </div>
      </div>
    );
  }

  if (!entries.length) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-white mb-4">No Data Found</h1>
          <p className="text-gray-400 mb-6">
            Please connect your AniList account to use AniLens Studio.
          </p>
          <button
            onClick={() => AuthManager.getInstance().startOAuthLogin()}
            className="px-6 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-medium transition-colors"
          >
            Connect AniList
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Left Panel - Studio Controls */}
      <div className="w-96 bg-gray-900 border-r border-gray-800 overflow-y-auto">
        <StudioControls
          config={config}
          onConfigChange={handleConfigChange}
          onModuleToggle={handleModuleToggle}
          onModuleSettings={handleModuleSettings}
          onExport={handleExport}
          onShare={handleShare}
        />
      </div>

      {/* Right Panel - Live Preview */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-950">
        <div className="w-full max-w-4xl">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">AniLens Studio</h1>
            <p className="text-gray-400">Live poster preview • Updates instantly</p>
          </div>

          {posterData ? (
            <PosterRenderer
              data={posterData}
              config={config}
              onExport={handleExport}
            />
          ) : (
            <div className="aspect-video bg-gray-800 rounded-xl border border-gray-700 flex items-center justify-center">
              <p className="text-gray-500">Building your poster...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
