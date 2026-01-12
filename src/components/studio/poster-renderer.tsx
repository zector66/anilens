"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { PosterData, StudioConfig } from "@/types/studio";
import { BarChart3, TrendingUp, Award, Flame, Palette, Trophy, Swords, Star } from "lucide-react";

interface PosterRendererProps {
  data: PosterData;
  config: StudioConfig;
  onExport: () => void;
}

export function PosterRenderer({ data, config, onExport }: PosterRendererProps) {
  const posterRef = useRef<HTMLDivElement>(null);

  const getThemeClasses = () => {
    const { mode, accent } = config.theme;
    const baseClasses = mode === "dark" 
      ? "bg-gray-900 text-white" 
      : "bg-white text-gray-900";
    
    const accentClasses = {
      "#8b5cf6": "border-purple-500 text-purple-400",
      "#3b82f6": "border-blue-500 text-blue-400", 
      "#10b981": "border-green-500 text-green-400",
      "#f59e0b": "border-amber-500 text-amber-400",
      "#ef4444": "border-red-500 text-red-400"
    };

    return `${baseClasses} ${accentClasses[accent as keyof typeof accentClasses] || accentClasses["#8b5cf6"]}`;
  };

  const getTemplateClasses = () => {
    switch (config.template) {
      case "compact":
        return "p-6 space-y-4";
      case "ultra":
        return "p-4 space-y-2";
      default: // poster
        return "p-8 space-y-6";
    }
  };

  return (
    <div className="space-y-4">
      {/* Preview Controls */}
      <div className="flex justify-center gap-4">
        <button
          onClick={onExport}
          className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition-colors flex items-center gap-2"
        >
          Export as PNG
        </button>
        <div className="px-4 py-2 rounded-lg bg-gray-800 text-gray-400 text-sm">
          {config.template} • {config.theme.mode}
        </div>
      </div>

      {/* Poster */}
      <div 
        id="poster-export"
        ref={posterRef}
        className={`aspect-video rounded-xl border-2 overflow-hidden ${getThemeClasses()} ${getTemplateClasses()}`}
        style={{ 
          backgroundColor: config.theme.mode === "dark" ? "#111827" : "#ffffff",
          borderColor: config.theme.accent 
        }}
      >
        {/* Header */}
        <div className="relative h-32 -mx-8 mb-6">
          {data.header.banner && (
            <div className="absolute inset-0">
              <Image
                src={data.header.banner}
                alt="Banner"
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            </div>
          )}
          
          <div className="relative z-10 flex items-end p-8">
            {!config.privacy.hideAvatar && data.header.avatar && (
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 mr-4" style={{ borderColor: config.theme.accent }}>
                <Image
                  src={data.header.avatar}
                  alt="Avatar"
                  width={64}
                  height={64}
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">
                {config.privacy.hideUsername ? "Anonymous" : data.header.username}
              </h1>
              <p className="text-sm opacity-75">{data.header.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Top Anime */}
          {config.modules.find(m => m.id === "topAnime")?.enabled && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Star className="w-4 h-4" />
                Top Anime
              </h3>
              <div className="space-y-2">
                {/* Primary */}
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
                  <Image
                    src={data.topAnime.primary.cover}
                    alt={data.topAnime.primary.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-sm font-medium truncate">{data.topAnime.primary.title}</p>
                    {!config.privacy.hideScores && data.topAnime.primary.score && (
                      <p className="text-xs opacity-75">★ {data.topAnime.primary.score}</p>
                    )}
                  </div>
                </div>
                
                {/* Secondary */}
                <div className="grid grid-cols-4 gap-1">
                  {data.topAnime.secondary.slice(0, 4).map((anime, i) => (
                    <div key={anime.id} className="relative aspect-[3/4] rounded overflow-hidden">
                      <Image
                        src={anime.cover}
                        alt={anime.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Top Manga */}
          {config.modules.find(m => m.id === "topManga")?.enabled && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Star className="w-4 h-4" />
                Top Manga
              </h3>
              <div className="space-y-2">
                {/* Primary */}
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
                  <Image
                    src={data.topManga.primary.cover}
                    alt={data.topManga.primary.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-sm font-medium truncate">{data.topManga.primary.title}</p>
                    {!config.privacy.hideScores && data.topManga.primary.score && (
                      <p className="text-xs opacity-75">★ {data.topManga.primary.score}</p>
                    )}
                  </div>
                </div>
                
                {/* Secondary */}
                <div className="grid grid-cols-4 gap-1">
                  {data.topManga.secondary.slice(0, 4).map((manga, i) => (
                    <div key={manga.id} className="relative aspect-[3/4] rounded overflow-hidden">
                      <Image
                        src={manga.cover}
                        alt={manga.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Stats Blocks */}
          <div className="space-y-4">
            {/* Anime Stats */}
            {config.modules.find(m => m.id === "animeStats")?.enabled && (
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Anime Stats
                </h3>
                <div className="space-y-2 text-sm">
                  {!config.privacy.hideCounts && (
                    <>
                      <div className="flex justify-between">
                        <span className="opacity-75">Episodes</span>
                        <span>{data.animeStats.episodesWatched.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-75">Completed</span>
                        <span>{data.animeStats.completed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-75">Dropped</span>
                        <span>{data.animeStats.dropped}</span>
                      </div>
                    </>
                  )}
                  {!config.privacy.hideScores && (
                    <div className="flex justify-between">
                      <span className="opacity-75">Mean Score</span>
                      <span>{data.animeStats.meanScore.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Manga Stats */}
            {config.modules.find(m => m.id === "mangaStats")?.enabled && (
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Manga Stats
                </h3>
                <div className="space-y-2 text-sm">
                  {!config.privacy.hideCounts && (
                    <>
                      <div className="flex justify-between">
                        <span className="opacity-75">Chapters</span>
                        <span>{data.mangaStats.chaptersRead.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-75">Completed</span>
                        <span>{data.mangaStats.completed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-75">Dropped</span>
                        <span>{data.mangaStats.dropped}</span>
                      </div>
                    </>
                  )}
                  {!config.privacy.hideScores && (
                    <div className="flex justify-between">
                      <span className="opacity-75">Mean Score</span>
                      <span>{data.mangaStats.meanScore.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Percentiles */}
          {config.modules.find(m => m.id === "percentiles")?.enabled && (
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Your Indices
              </h3>
              <div className="space-y-2">
                {Object.values(data.percentiles).map((percentile, i) => (
                  <div key={percentile.label} className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-xs opacity-75 mb-1">{percentile.label}</div>
                    <div className="text-lg font-bold">{percentile.value.toFixed(1)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Tags */}
          {config.modules.find(m => m.id === "topTags")?.enabled && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Top Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.topTags.slice(0, 12).map((tag, i) => (
                  <span
                    key={tag.tag}
                    className="px-2 py-1 bg-gray-800/50 rounded-full text-xs"
                    style={{ 
                      opacity: 0.5 + (tag.weight * 0.5),
                      fontSize: `${0.7 + (tag.weight * 0.3)}rem`
                    }}
                  >
                    {tag.tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Games Rank */}
          {config.modules.find(m => m.id === "gamesRank")?.enabled && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Games Rank
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="opacity-75">Rank</span>
                  <span className="font-bold">{data.gamesRank.rank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-75">MMR</span>
                  <span>{data.gamesRank.mmr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-75">Best Game</span>
                  <span className="text-sm">{data.gamesRank.bestGame}</span>
                </div>
              </div>
            </div>
          )}

          {/* Hottest Take */}
          {config.modules.find(m => m.id === "hottestTake")?.enabled && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Flame className="w-4 h-4" />
                Hottest Take
              </h3>
              <p className="text-sm italic">{data.hottestTake.content}</p>
            </div>
          )}

          {/* Taste Fingerprint */}
          {config.modules.find(m => m.id === "tasteFingerprint")?.enabled && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Swords className="w-4 h-4" />
                Taste DNA
              </h3>
              <div className="font-mono text-xs">{data.fingerprint}</div>
              <div className="text-xs opacity-75 mt-2">Confidence: {data.confidence}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-700 text-center text-xs opacity-50">
          {data.header.watermark}
        </div>
      </div>
    </div>
  );
}
