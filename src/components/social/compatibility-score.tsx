'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Heart, Users, Search, Loader2, Sparkles, TrendingUp, Film, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useAnimeList, useMangaList } from '@/hooks/use-anilist';
import { AniListClient } from '@/lib/anilist-client';
import { MediaList, Media } from '@/types/anilist';

interface CompatibilityResult {
  score: number;
  sharedAnime: Array<{ media: Media; yourScore: number; theirScore: number }>;
  sharedManga: Array<{ media: Media; yourScore: number; theirScore: number }>;
  genreOverlap: string[];
  uniqueToYou: Media[];
  uniqueToThem: Media[];
  theirStats: {
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

  const calculateCompatibility = async () => {
    if (!username.trim() || !user) return;
    
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const client = new AniListClient();
      
      // Fetch the other user's data
      const otherUser = await client.getUserByUsername(username.trim());
      if (!otherUser) {
        setError('User not found');
        setIsLoading(false);
        return;
      }

      setComparedUser({ name: otherUser.name, avatar: otherUser.avatar?.large });

      // Fetch their lists
      const theirAnimeList = await client.getAnimeList(otherUser.id);
      const theirMangaList = await client.getMangaList(otherUser.id);

      // Calculate compatibility
      const result = computeCompatibility(
        myAnimeList,
        myMangaList,
        theirAnimeList,
        theirMangaList,
        otherUser
      );

      setResult(result);
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
    theirUser: { statistics?: { anime?: { count: number; meanScore: number }; manga?: { count: number; meanScore: number } } }
  ): CompatibilityResult => {
    // Build maps of media ID -> score for both users
    const myAnimeMap = new Map<number, { media: Media; score: number }>();
    const theirAnimeMap = new Map<number, { media: Media; score: number }>();
    const myMangaMap = new Map<number, { media: Media; score: number }>();
    const theirMangaMap = new Map<number, { media: Media; score: number }>();

    myAnime?.lists?.forEach(list => {
      list.entries?.forEach(entry => {
        if (entry.media && entry.score) {
          myAnimeMap.set(entry.media.id, { media: entry.media, score: entry.score });
        }
      });
    });

    theirAnime?.lists?.forEach(list => {
      list.entries?.forEach(entry => {
        if (entry.media && entry.score) {
          theirAnimeMap.set(entry.media.id, { media: entry.media, score: entry.score });
        }
      });
    });

    myManga?.lists?.forEach(list => {
      list.entries?.forEach(entry => {
        if (entry.media && entry.score) {
          myMangaMap.set(entry.media.id, { media: entry.media, score: entry.score });
        }
      });
    });

    theirManga?.lists?.forEach(list => {
      list.entries?.forEach(entry => {
        if (entry.media && entry.score) {
          theirMangaMap.set(entry.media.id, { media: entry.media, score: entry.score });
        }
      });
    });

    // Find shared anime
    const sharedAnime: Array<{ media: Media; yourScore: number; theirScore: number }> = [];
    myAnimeMap.forEach((myEntry, id) => {
      const theirEntry = theirAnimeMap.get(id);
      if (theirEntry) {
        sharedAnime.push({
          media: myEntry.media,
          yourScore: myEntry.score,
          theirScore: theirEntry.score,
        });
      }
    });

    // Find shared manga
    const sharedManga: Array<{ media: Media; yourScore: number; theirScore: number }> = [];
    myMangaMap.forEach((myEntry, id) => {
      const theirEntry = theirMangaMap.get(id);
      if (theirEntry) {
        sharedManga.push({
          media: myEntry.media,
          yourScore: myEntry.score,
          theirScore: theirEntry.score,
        });
      }
    });

    // Calculate genre overlap
    const myGenres = new Set<string>();
    const theirGenres = new Set<string>();
    
    myAnimeMap.forEach(entry => entry.media.genres?.forEach(g => myGenres.add(g)));
    myMangaMap.forEach(entry => entry.media.genres?.forEach(g => myGenres.add(g)));
    theirAnimeMap.forEach(entry => entry.media.genres?.forEach(g => theirGenres.add(g)));
    theirMangaMap.forEach(entry => entry.media.genres?.forEach(g => theirGenres.add(g)));

    const genreOverlap = Array.from(myGenres).filter(g => theirGenres.has(g));

    // Find unique titles
    const uniqueToYou: Media[] = [];
    const uniqueToThem: Media[] = [];

    myAnimeMap.forEach((entry, id) => {
      if (!theirAnimeMap.has(id) && entry.score >= 8) {
        uniqueToYou.push(entry.media);
      }
    });

    theirAnimeMap.forEach((entry, id) => {
      if (!myAnimeMap.has(id) && entry.score >= 8) {
        uniqueToThem.push(entry.media);
      }
    });

    // Calculate compatibility score
    let score = 50; // Base score

    if (sharedAnime.length + sharedManga.length > 0) {
      // Score similarity bonus
      let scoreDiffSum = 0;
      [...sharedAnime, ...sharedManga].forEach(shared => {
        const diff = Math.abs(shared.yourScore - shared.theirScore);
        scoreDiffSum += diff;
      });
      const avgScoreDiff = scoreDiffSum / (sharedAnime.length + sharedManga.length);
      score += Math.max(0, 30 - avgScoreDiff * 3); // Up to +30 for similar ratings

      // Shared content bonus
      const sharedBonus = Math.min(20, (sharedAnime.length + sharedManga.length) * 0.5);
      score += sharedBonus;
    }

    // Genre overlap bonus
    score += Math.min(10, genreOverlap.length * 0.5);

    // Cap at 100
    score = Math.min(100, Math.round(score));

    return {
      score,
      sharedAnime: sharedAnime.sort((a, b) => b.yourScore - a.yourScore).slice(0, 10),
      sharedManga: sharedManga.sort((a, b) => b.yourScore - a.yourScore).slice(0, 10),
      genreOverlap,
      uniqueToYou: uniqueToYou.slice(0, 5),
      uniqueToThem: uniqueToThem.slice(0, 5),
      theirStats: {
        animeCount: theirUser.statistics?.anime?.count || 0,
        mangaCount: theirUser.statistics?.manga?.count || 0,
        meanScore: theirUser.statistics?.anime?.meanScore || 0,
      },
    };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Soulmates! 💕';
    if (score >= 80) return 'Great Match!';
    if (score >= 70) return 'Very Compatible';
    if (score >= 60) return 'Good Compatibility';
    if (score >= 50) return 'Some Common Ground';
    if (score >= 40) return 'Different Tastes';
    return 'Opposites Attract?';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center">
          <Heart className="w-6 h-6 text-pink-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Compatibility Score</h2>
          <p className="text-sm text-gray-400">Compare your taste with another user</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && calculateCompatibility()}
            placeholder="Enter AniList username..."
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50"
          />
        </div>
        <button
          onClick={calculateCompatibility}
          disabled={isLoading || !username.trim()}
          className="px-6 py-3 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center gap-2"
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
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {result && comparedUser && (
        <div className="space-y-6 animate-fade-in">
          {/* Score Display */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 text-center">
            <div className="flex items-center justify-center gap-6 mb-4">
              {user?.avatar?.large && (
                <div className="relative">
                  <Image
                    src={user.avatar.large}
                    alt={user.name}
                    width={64}
                    height={64}
                    className="rounded-full border-2 border-purple-500"
                  />
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs bg-gray-900 px-2 py-0.5 rounded-full text-gray-400">You</span>
                </div>
              )}
              <div className="text-4xl">💕</div>
              {comparedUser.avatar && (
                <div className="relative">
                  <Image
                    src={comparedUser.avatar}
                    alt={comparedUser.name}
                    width={64}
                    height={64}
                    className="rounded-full border-2 border-pink-500"
                  />
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs bg-gray-900 px-2 py-0.5 rounded-full text-gray-400">{comparedUser.name}</span>
                </div>
              )}
            </div>
            
            <div className={`text-6xl font-bold mb-2 ${getScoreColor(result.score)}`}>
              {result.score}%
            </div>
            <p className="text-xl text-white font-medium">{getScoreLabel(result.score)}</p>
            
            {/* Stats */}
            <div className="flex justify-center gap-8 mt-4 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Film className="w-4 h-4" />
                {result.sharedAnime.length} shared anime
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {result.sharedManga.length} shared manga
              </div>
            </div>
          </div>

          {/* Shared Titles */}
          {result.sharedAnime.length > 0 && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Shared Favorites
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {result.sharedAnime.slice(0, 5).map(item => (
                  <div key={item.media.id} className="text-center">
                    <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden mb-1">
                      <Image
                        src={item.media.coverImage?.medium || ''}
                        alt={item.media.title.romaji || ''}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-1">
                      {item.media.title.english || item.media.title.romaji}
                    </p>
                    <p className="text-xs">
                      <span className="text-purple-400">{item.yourScore}</span>
                      <span className="text-gray-600"> / </span>
                      <span className="text-pink-400">{item.theirScore}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Genre Overlap */}
          {result.genreOverlap.length > 0 && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                Shared Genres ({result.genreOverlap.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.genreOverlap.map(genre => (
                  <span key={genre} className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm">
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {result.uniqueToThem.length > 0 && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="font-medium text-white mb-3">
                🎯 {comparedUser.name} recommends
              </h3>
              <div className="grid grid-cols-5 gap-3">
                {result.uniqueToThem.map(media => (
                  <div key={media.id} className="text-center">
                    <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden mb-1">
                      <Image
                        src={media.coverImage?.medium || ''}
                        alt={media.title.romaji || ''}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-1">
                      {media.title.english || media.title.romaji}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
