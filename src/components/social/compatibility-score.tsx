'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Heart, Users, Search, Loader2, Sparkles, TrendingUp, Film, BookOpen, Star, ChevronDown, ChevronUp, Tag, Trophy, Flame, Target } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { useAuth } from '@/hooks/use-auth';
import { useAnimeList, useMangaList } from '@/hooks/use-anilist';
import { AniListClient } from '@/lib/anilist-client';
import { MediaList, Media } from '@/types/anilist';
import { AnimatedCounter } from '@/components/ui/animated-counter';

interface SharedMedia {
  media: Media;
  yourScore: number;
  theirScore: number;
  scoreDiff: number;
  avgScore: number;
}

interface GenreStats {
  name: string;
  yourAvgScore: number;
  theirAvgScore: number;
  yourCount: number;
  theirCount: number;
  sharedCount: number;
}

interface TagStats {
  name: string;
  yourAvgScore: number;
  theirAvgScore: number;
  yourCount: number;
  theirCount: number;
}

interface CompatibilityResult {
  score: number;
  scoreBreakdown: {
    sharedTitles: number;
    scoreAlignment: number;
    genreMatch: number;
    tagMatch: number;
  };
  sharedAnime: SharedMedia[];
  sharedManga: SharedMedia[];
  topGenres: GenreStats[];
  topTags: TagStats[];
  perfectMatches: SharedMedia[]; // Same score
  controversialPicks: SharedMedia[]; // Big score difference
  uniqueToYou: Array<{ media: Media; score: number }>;
  uniqueToThem: Array<{ media: Media; score: number }>;
  theirStats: {
    animeCount: number;
    mangaCount: number;
    meanScore: number;
    username: string;
  };
  yourStats: {
    animeCount: number;
    mangaCount: number;
    meanScore: number;
  };
}

export function CompatibilityScore() {
  const { user } = useAuth();
  const { data: myAnimeList } = useAnimeList(user?.id || 0);
  const { data: myMangaList } = useMangaList(user?.id || 0);
  
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [comparedUser, setComparedUser] = useState<{ name: string; avatar?: string } | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('shared');
  const [showAllShared, setShowAllShared] = useState(false);

  const calculateCompatibility = async () => {
    if (!username.trim() || !user) return;
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    setShowAllShared(false);

    try {
      const client = new AniListClient();
      
      // Fetch the other user's data
      const otherUser = await client.getUserByUsername(username.trim());
      if (!otherUser) {
        setError('User not found. Make sure the username is correct.');
        setIsLoading(false);
        return;
      }

      setComparedUser({ name: otherUser.name, avatar: otherUser.avatar?.large });

      // Fetch their lists
      const theirAnimeList = await client.getAnimeList(otherUser.id);
      const theirMangaList = await client.getMangaList(otherUser.id);

      // Calculate compatibility
      const compatResult = computeCompatibility(
        myAnimeList,
        myMangaList,
        theirAnimeList,
        theirMangaList,
        otherUser,
        user
      );

      setResult(compatResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user data');
    } finally {
      setIsLoading(false);
    }
  };

  const computeCompatibility = (
    myAnime: MediaList | undefined,
    myManga: MediaList | undefined,
    theirAnime: MediaList | undefined,
    theirManga: MediaList | undefined,
    theirUser: { name: string; statistics?: { anime?: { count: number; meanScore: number }; manga?: { count: number; meanScore: number } } },
    myUser: { statistics?: { anime?: { count: number; meanScore: number }; manga?: { count: number; meanScore: number } } }
  ): CompatibilityResult => {
    // Build maps of media ID -> {media, score} for both users
    const myAnimeMap = new Map<number, { media: Media; score: number }>();
    const theirAnimeMap = new Map<number, { media: Media; score: number }>();
    const myMangaMap = new Map<number, { media: Media; score: number }>();
    const theirMangaMap = new Map<number, { media: Media; score: number }>();

    // Genre tracking with weighted scores
    const myGenreScores = new Map<string, { total: number; count: number }>();
    const theirGenreScores = new Map<string, { total: number; count: number }>();
    
    // Tag tracking with weighted scores
    const myTagScores = new Map<string, { total: number; count: number }>();
    const theirTagScores = new Map<string, { total: number; count: number }>();

    const processEntry = (
      entry: { media?: Media; score?: number },
      mediaMap: Map<number, { media: Media; score: number }>,
      genreMap: Map<string, { total: number; count: number }>,
      tagMap: Map<string, { total: number; count: number }>
    ) => {
      if (!entry.media || !entry.score || entry.score === 0) return;
      
      mediaMap.set(entry.media.id, { media: entry.media, score: entry.score });
      
      // Track genre scores
      entry.media.genres?.forEach(genre => {
        const existing = genreMap.get(genre) || { total: 0, count: 0 };
        genreMap.set(genre, { total: existing.total + entry.score!, count: existing.count + 1 });
      });
      
      // Track tag scores (use top tags only)
      entry.media.tags?.slice(0, 5).forEach(tag => {
        const existing = tagMap.get(tag.name) || { total: 0, count: 0 };
        tagMap.set(tag.name, { total: existing.total + entry.score!, count: existing.count + 1 });
      });
    };

    myAnime?.lists?.forEach(list => list.entries?.forEach(e => processEntry(e, myAnimeMap, myGenreScores, myTagScores)));
    theirAnime?.lists?.forEach(list => list.entries?.forEach(e => processEntry(e, theirAnimeMap, theirGenreScores, theirTagScores)));
    myManga?.lists?.forEach(list => list.entries?.forEach(e => processEntry(e, myMangaMap, myGenreScores, myTagScores)));
    theirManga?.lists?.forEach(list => list.entries?.forEach(e => processEntry(e, theirMangaMap, theirGenreScores, theirTagScores)));

    // Find ALL shared anime (no limit)
    const sharedAnime: SharedMedia[] = [];
    myAnimeMap.forEach((myEntry, id) => {
      const theirEntry = theirAnimeMap.get(id);
      if (theirEntry) {
        sharedAnime.push({
          media: myEntry.media,
          yourScore: myEntry.score,
          theirScore: theirEntry.score,
          scoreDiff: Math.abs(myEntry.score - theirEntry.score),
          avgScore: (myEntry.score + theirEntry.score) / 2,
        });
      }
    });

    // Find ALL shared manga (no limit)
    const sharedManga: SharedMedia[] = [];
    myMangaMap.forEach((myEntry, id) => {
      const theirEntry = theirMangaMap.get(id);
      if (theirEntry) {
        sharedManga.push({
          media: myEntry.media,
          yourScore: myEntry.score,
          theirScore: theirEntry.score,
          scoreDiff: Math.abs(myEntry.score - theirEntry.score),
          avgScore: (myEntry.score + theirEntry.score) / 2,
        });
      }
    });

    // Calculate top genres by weighted average score comparison
    const allGenres = new Set([...myGenreScores.keys(), ...theirGenreScores.keys()]);
    const topGenres: GenreStats[] = Array.from(allGenres)
      .map(name => {
        const my = myGenreScores.get(name);
        const their = theirGenreScores.get(name);
        return {
          name,
          yourAvgScore: my ? Math.round(my.total / my.count * 10) / 10 : 0,
          theirAvgScore: their ? Math.round(their.total / their.count * 10) / 10 : 0,
          yourCount: my?.count || 0,
          theirCount: their?.count || 0,
          sharedCount: (my?.count || 0) + (their?.count || 0),
        };
      })
      .filter(g => g.yourCount >= 3 && g.theirCount >= 3) // Both must have at least 3 titles
      .sort((a, b) => {
        // Sort by how close their average scores are (smaller diff = more compatible)
        const aDiff = Math.abs(a.yourAvgScore - a.theirAvgScore);
        const bDiff = Math.abs(b.yourAvgScore - b.theirAvgScore);
        if (aDiff !== bDiff) return aDiff - bDiff;
        return b.sharedCount - a.sharedCount;
      })
      .slice(0, 8);

    // Calculate top tags by weighted average score comparison  
    const allTags = new Set([...myTagScores.keys(), ...theirTagScores.keys()]);
    const topTags: TagStats[] = Array.from(allTags)
      .map(name => {
        const my = myTagScores.get(name);
        const their = theirTagScores.get(name);
        return {
          name,
          yourAvgScore: my ? Math.round(my.total / my.count * 10) / 10 : 0,
          theirAvgScore: their ? Math.round(their.total / their.count * 10) / 10 : 0,
          yourCount: my?.count || 0,
          theirCount: their?.count || 0,
        };
      })
      .filter(t => t.yourCount >= 2 && t.theirCount >= 2)
      .sort((a, b) => {
        const aDiff = Math.abs(a.yourAvgScore - a.theirAvgScore);
        const bDiff = Math.abs(b.yourAvgScore - b.theirAvgScore);
        return aDiff - bDiff;
      })
      .slice(0, 10);

    // Perfect matches (same score, both high)
    const allShared = [...sharedAnime, ...sharedManga];
    const perfectMatches = allShared
      .filter(s => s.scoreDiff === 0 && s.avgScore >= 7)
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 10);

    // Controversial picks (big score difference)
    const controversialPicks = allShared
      .filter(s => s.scoreDiff >= 3)
      .sort((a, b) => b.scoreDiff - a.scoreDiff)
      .slice(0, 10);

    // Unique recommendations (high score, they don't have it)
    const uniqueToYou: Array<{ media: Media; score: number }> = [];
    const uniqueToThem: Array<{ media: Media; score: number }> = [];

    myAnimeMap.forEach((entry, id) => {
      if (!theirAnimeMap.has(id) && entry.score >= 8) {
        uniqueToYou.push({ media: entry.media, score: entry.score });
      }
    });
    myMangaMap.forEach((entry, id) => {
      if (!theirMangaMap.has(id) && entry.score >= 8) {
        uniqueToYou.push({ media: entry.media, score: entry.score });
      }
    });

    theirAnimeMap.forEach((entry, id) => {
      if (!myAnimeMap.has(id) && entry.score >= 8) {
        uniqueToThem.push({ media: entry.media, score: entry.score });
      }
    });
    theirMangaMap.forEach((entry, id) => {
      if (!myMangaMap.has(id) && entry.score >= 8) {
        uniqueToThem.push({ media: entry.media, score: entry.score });
      }
    });

    // Sort by score and limit
    uniqueToYou.sort((a, b) => b.score - a.score);
    uniqueToThem.sort((a, b) => b.score - a.score);

    // Calculate compatibility score with detailed breakdown
    let sharedTitlesScore = 0;
    let scoreAlignmentScore = 0;
    let genreMatchScore = 0;
    let tagMatchScore = 0;

    const totalShared = sharedAnime.length + sharedManga.length;
    
    // Shared titles component (up to 25 points)
    sharedTitlesScore = Math.min(25, totalShared * 0.5);

    // Score alignment component (up to 35 points)
    if (totalShared > 0) {
      const avgScoreDiff = allShared.reduce((sum, s) => sum + s.scoreDiff, 0) / totalShared;
      scoreAlignmentScore = Math.max(0, 35 - avgScoreDiff * 5);
    }

    // Genre match component (up to 25 points)
    if (topGenres.length > 0) {
      const avgGenreDiff = topGenres.reduce((sum, g) => sum + Math.abs(g.yourAvgScore - g.theirAvgScore), 0) / topGenres.length;
      genreMatchScore = Math.max(0, 25 - avgGenreDiff * 3);
    }

    // Tag match component (up to 15 points)
    if (topTags.length > 0) {
      const avgTagDiff = topTags.reduce((sum, t) => sum + Math.abs(t.yourAvgScore - t.theirAvgScore), 0) / topTags.length;
      tagMatchScore = Math.max(0, 15 - avgTagDiff * 2);
    }

    const totalScore = Math.min(100, Math.round(sharedTitlesScore + scoreAlignmentScore + genreMatchScore + tagMatchScore));

    return {
      score: totalScore,
      scoreBreakdown: {
        sharedTitles: Math.round(sharedTitlesScore),
        scoreAlignment: Math.round(scoreAlignmentScore),
        genreMatch: Math.round(genreMatchScore),
        tagMatch: Math.round(tagMatchScore),
      },
      sharedAnime: sharedAnime.sort((a, b) => b.avgScore - a.avgScore),
      sharedManga: sharedManga.sort((a, b) => b.avgScore - a.avgScore),
      topGenres,
      topTags,
      perfectMatches,
      controversialPicks,
      uniqueToYou: uniqueToYou.slice(0, 15),
      uniqueToThem: uniqueToThem.slice(0, 15),
      theirStats: {
        animeCount: theirUser.statistics?.anime?.count || theirAnimeMap.size,
        mangaCount: theirUser.statistics?.manga?.count || theirMangaMap.size,
        meanScore: theirUser.statistics?.anime?.meanScore || 0,
        username: theirUser.name,
      },
      yourStats: {
        animeCount: myUser.statistics?.anime?.count || myAnimeMap.size,
        mangaCount: myUser.statistics?.manga?.count || myMangaMap.size,
        meanScore: myUser.statistics?.anime?.meanScore || 0,
      },
    };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30';
    if (score >= 60) return 'from-amber-500/20 to-yellow-500/20 border-amber-500/30';
    if (score >= 40) return 'from-orange-500/20 to-red-500/20 border-orange-500/30';
    return 'from-red-500/20 to-pink-500/20 border-red-500/30';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return { text: 'Soulmates!', emoji: '💕', desc: 'Your taste is incredibly aligned' };
    if (score >= 80) return { text: 'Great Match', emoji: '✨', desc: 'You share a lot in common' };
    if (score >= 70) return { text: 'Very Compatible', emoji: '🎯', desc: 'Strong taste overlap detected' };
    if (score >= 60) return { text: 'Good Compatibility', emoji: '👍', desc: 'You have solid common ground' };
    if (score >= 50) return { text: 'Some Common Ground', emoji: '🤝', desc: 'Different but overlapping tastes' };
    if (score >= 40) return { text: 'Different Tastes', emoji: '🎭', desc: 'You might discover new things' };
    return { text: 'Opposites Attract?', emoji: '🔄', desc: 'Very different preferences' };
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const renderMediaCard = (item: SharedMedia | { media: Media; score: number }, showScores: boolean = false, theirScore?: number) => {
    const media = 'media' in item ? item.media : item;
    const coverUrl = media.coverImage?.large || media.coverImage?.medium || '';
    const title = media.title?.english || media.title?.romaji || 'Unknown';
    
    return (
      <div key={media.id} className="group relative">
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5 shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-purple-500/20">
          {coverUrl ? (
            <OptimizedImage
              src={coverUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 25vw, 150px"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Film className="w-8 h-8 text-gray-500" />
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {/* Score badges */}
          {showScores && 'yourScore' in item && (
            <div className="absolute top-2 left-2 right-2 flex justify-between">
              <span className="px-2 py-1 bg-purple-500/90 backdrop-blur-sm rounded-lg text-xs font-bold text-white shadow-lg">
                {item.yourScore}
              </span>
              <span className="px-2 py-1 bg-pink-500/90 backdrop-blur-sm rounded-lg text-xs font-bold text-white shadow-lg">
                {item.theirScore}
              </span>
            </div>
          )}
          
          {/* Single score badge */}
          {!showScores && 'score' in item && (
            <div className="absolute top-2 right-2">
              <span className="px-2 py-1 bg-amber-500/90 backdrop-blur-sm rounded-lg text-xs font-bold text-white shadow-lg flex items-center gap-1">
                <Star className="w-3 h-3" />
                {item.score}
              </span>
            </div>
          )}
          
          {/* Title on hover */}
          <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-xs font-medium text-white line-clamp-2 text-center">
              {title}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/25">
          <Heart className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Taste Compatibility</h2>
          <p className="text-gray-400">Compare your anime & manga preferences</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && calculateCompatibility()}
            placeholder="Enter AniList username..."
            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition-all"
          />
        </div>
        <button
          onClick={calculateCompatibility}
          disabled={isLoading || !username.trim()}
          className="px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-all duration-300 flex items-center gap-2 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:-translate-y-0.5"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Users className="w-5 h-5" />
          )}
          Compare
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="font-medium">User not found</p>
            <p className="text-sm text-red-400/70">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          <div className="h-48 rounded-2xl bg-white/5 animate-pulse" />
          <div className="grid grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && comparedUser && !isLoading && (
        <div className="space-y-6 animate-fade-in">
          {/* Main Score Display */}
          <div className={`rounded-3xl p-8 bg-gradient-to-br ${getScoreBg(result.score)} border backdrop-blur-sm`}>
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* User Avatars */}
              <div className="flex items-center gap-4">
                {user?.avatar?.large ? (
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-linear-to-r from-purple-500 to-blue-500 rounded-full blur opacity-50 group-hover:opacity-75 transition" />
                    <OptimizedImage
                      src={user.avatar.large}
                      alt={user.name}
                      width={80}
                      height={80}
                      className="relative rounded-full border-3 border-white/20"
                    />
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-900/90 backdrop-blur-sm rounded-full text-xs font-medium text-white whitespace-nowrap">
                      You
                    </span>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Users className="w-8 h-8 text-purple-400" />
                  </div>
                )}
                
                <div className="text-4xl animate-pulse">{getScoreLabel(result.score).emoji}</div>
                
                {comparedUser.avatar ? (
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-linear-to-r from-pink-500 to-rose-500 rounded-full blur opacity-50 group-hover:opacity-75 transition" />
                    <OptimizedImage
                      src={comparedUser.avatar}
                      alt={comparedUser.name}
                      width={80}
                      height={80}
                      className="relative rounded-full border-3 border-white/20"
                    />
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-900/90 backdrop-blur-sm rounded-full text-xs font-medium text-white whitespace-nowrap">
                      {comparedUser.name}
                    </span>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-pink-500/20 flex items-center justify-center">
                    <Users className="w-8 h-8 text-pink-400" />
                  </div>
                )}
              </div>

              {/* Score */}
              <div className="flex-1 text-center md:text-left">
                <div className={`text-7xl font-black mb-2 ${getScoreColor(result.score)}`}>
                  <AnimatedCounter value={result.score} />%
                </div>
                <p className="text-2xl font-bold text-white mb-1">{getScoreLabel(result.score).text}</p>
                <p className="text-gray-400">{getScoreLabel(result.score).desc}</p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm">
                  <Film className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-white">{result.sharedAnime.length}</div>
                  <div className="text-xs text-gray-400">Shared Anime</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm">
                  <BookOpen className="w-5 h-5 text-pink-400 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-white">{result.sharedManga.length}</div>
                  <div className="text-xs text-gray-400">Shared Manga</div>
                </div>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-sm text-gray-400 mb-3">Score Breakdown</p>
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{result.scoreBreakdown.sharedTitles}</div>
                  <div className="text-xs text-gray-500">Shared Titles</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{result.scoreBreakdown.scoreAlignment}</div>
                  <div className="text-xs text-gray-500">Score Alignment</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{result.scoreBreakdown.genreMatch}</div>
                  <div className="text-xs text-gray-500">Genre Match</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{result.scoreBreakdown.tagMatch}</div>
                  <div className="text-xs text-gray-500">Tag Match</div>
                </div>
              </div>
            </div>
          </div>

          {/* Collapsible Sections */}
          
          {/* Shared Titles Section */}
          {(result.sharedAnime.length > 0 || result.sharedManga.length > 0) && (
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              <button
                onClick={() => toggleSection('shared')}
                className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-white">Shared Titles</h3>
                    <p className="text-sm text-gray-400">{result.sharedAnime.length + result.sharedManga.length} titles you both rated</p>
                  </div>
                </div>
                {expandedSection === 'shared' ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>
              
              {expandedSection === 'shared' && (
                <div className="p-5 pt-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">
                      <span className="inline-block w-3 h-3 bg-purple-500 rounded mr-1" /> Your score
                      <span className="mx-2">·</span>
                      <span className="inline-block w-3 h-3 bg-pink-500 rounded mr-1" /> {comparedUser.name}&apos;s score
                    </p>
                    {result.sharedAnime.length + result.sharedManga.length > 10 && (
                      <button
                        onClick={() => setShowAllShared(!showAllShared)}
                        className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        {showAllShared ? 'Show Less' : `Show All (${result.sharedAnime.length + result.sharedManga.length})`}
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {[...result.sharedAnime, ...result.sharedManga]
                      .slice(0, showAllShared ? undefined : 12)
                      .map(item => renderMediaCard(item, true))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Perfect Matches Section */}
          {result.perfectMatches.length > 0 && (
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              <button
                onClick={() => toggleSection('perfect')}
                className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-white">Perfect Matches</h3>
                    <p className="text-sm text-gray-400">{result.perfectMatches.length} titles with identical scores</p>
                  </div>
                </div>
                {expandedSection === 'perfect' ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>
              
              {expandedSection === 'perfect' && (
                <div className="p-5 pt-0">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {result.perfectMatches.map(item => renderMediaCard(item, true))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Controversial Picks Section */}
          {result.controversialPicks.length > 0 && (
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              <button
                onClick={() => toggleSection('controversial')}
                className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-white">Controversial Picks</h3>
                    <p className="text-sm text-gray-400">{result.controversialPicks.length} titles where you disagree</p>
                  </div>
                </div>
                {expandedSection === 'controversial' ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>
              
              {expandedSection === 'controversial' && (
                <div className="p-5 pt-0">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {result.controversialPicks.map(item => renderMediaCard(item, true))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Genre Comparison */}
          {result.topGenres.length > 0 && (
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              <button
                onClick={() => toggleSection('genres')}
                className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-white">Genre Preferences</h3>
                    <p className="text-sm text-gray-400">How your genre ratings compare</p>
                  </div>
                </div>
                {expandedSection === 'genres' ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>
              
              {expandedSection === 'genres' && (
                <div className="p-5 pt-0 space-y-3">
                  {result.topGenres.map(genre => (
                    <div key={genre.name} className="p-4 rounded-xl bg-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white">{genre.name}</span>
                        <span className={`text-sm ${Math.abs(genre.yourAvgScore - genre.theirAvgScore) <= 1 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {Math.abs(genre.yourAvgScore - genre.theirAvgScore) <= 1 ? '✓ Similar' : '≠ Different'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-purple-400">You</span>
                            <span className="text-white font-medium">{genre.yourAvgScore}</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${genre.yourAvgScore * 10}%` }} />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-pink-400">{comparedUser.name}</span>
                            <span className="text-white font-medium">{genre.theirAvgScore}</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-pink-500 rounded-full" style={{ width: `${genre.theirAvgScore * 10}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tag Comparison */}
          {result.topTags.length > 0 && (
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              <button
                onClick={() => toggleSection('tags')}
                className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <Tag className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-white">Tag Preferences</h3>
                    <p className="text-sm text-gray-400">Shared interests based on content tags</p>
                  </div>
                </div>
                {expandedSection === 'tags' ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>
              
              {expandedSection === 'tags' && (
                <div className="p-5 pt-0">
                  <div className="flex flex-wrap gap-2">
                    {result.topTags.map(tag => {
                      const diff = Math.abs(tag.yourAvgScore - tag.theirAvgScore);
                      const isAligned = diff <= 1;
                      return (
                        <div
                          key={tag.name}
                          className={`px-4 py-2 rounded-xl ${isAligned ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-white/5 border border-white/10'}`}
                        >
                          <span className={`font-medium ${isAligned ? 'text-emerald-400' : 'text-white'}`}>{tag.name}</span>
                          <div className="flex items-center gap-2 mt-1 text-xs">
                            <span className="text-purple-400">{tag.yourAvgScore}</span>
                            <span className="text-gray-500">vs</span>
                            <span className="text-pink-400">{tag.theirAvgScore}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          {result.uniqueToThem.length > 0 && (
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              <button
                onClick={() => toggleSection('recs')}
                className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Target className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-white">Recommended For You</h3>
                    <p className="text-sm text-gray-400">Titles {comparedUser.name} loves that you haven&apos;t seen</p>
                  </div>
                </div>
                {expandedSection === 'recs' ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>
              
              {expandedSection === 'recs' && (
                <div className="p-5 pt-0">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {result.uniqueToThem.map(item => renderMediaCard(item, false))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Your Recommendations */}
          {result.uniqueToYou.length > 0 && (
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              <button
                onClick={() => toggleSection('yourrecs')}
                className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-white">Recommend to {comparedUser.name}</h3>
                    <p className="text-sm text-gray-400">Titles you love that they haven&apos;t seen</p>
                  </div>
                </div>
                {expandedSection === 'yourrecs' ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>
              
              {expandedSection === 'yourrecs' && (
                <div className="p-5 pt-0">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {result.uniqueToYou.map(item => renderMediaCard(item, false))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
