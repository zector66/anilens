'use client';

import { useState, useEffect, useRef } from 'react';
import { MediaListEntry } from '@/types/anilist';
import { Trophy, Swords, Play, Pause, Volume2, Music, Tv, BookOpen, Heart } from 'lucide-react';
import Image from 'next/image';
import { getAnimeThemes, getThemeAudioUrl } from '@/lib/animethemes';

interface BracketBattleProps {
  entries: MediaListEntry[];
  onComplete: (winner: BattleItem) => void;
  onBack: () => void;
  battleType: 'anime' | 'manga' | 'openings' | 'endings' | 'characters';
  bracketSize?: number;
}

interface BattleItem {
  id: number;
  title: string;
  image: string;
  subtitle?: string;
  audioUrl?: string;
  anilistId?: number;
}

type BracketRound = {
  matches: [BattleItem, BattleItem][];
  winners: BattleItem[];
};

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getRoundName(remaining: number): string {
  if (remaining === 2) return 'Finals';
  if (remaining === 4) return 'Semi-Finals';
  if (remaining === 8) return 'Quarter-Finals';
  if (remaining === 16) return 'Round of 16';
  return `Round of ${remaining}`;
}

export function BracketBattle({ entries, onComplete, onBack, battleType, bracketSize = 16 }: BracketBattleProps) {
  const [items, setItems] = useState<BattleItem[]>([]);
  const [currentRound, setCurrentRound] = useState<BracketRound | null>(null);
  const [matchIndex, setMatchIndex] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);
  const [winner, setWinner] = useState<BattleItem | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedSide, setSelectedSide] = useState<'left' | 'right' | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [audioLoading, setAudioLoading] = useState<number | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Debug state changes
  console.log('BracketBattle state:', { 
    isInitializing, 
    isReady, 
    hasItems: items.length > 0, 
    hasCurrentRound: !!currentRound, 
    hasWinner: !!winner, 
    hasError: !!initError,
    itemsLength: items.length 
  });

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Toggle audio playback for openings/endings
  const toggleAudio = async (item: BattleItem) => {
    const isThemeBattle = battleType === 'openings' || battleType === 'endings';
    if (!isThemeBattle) return;

    // If already playing this item, pause it
    if (playingId === item.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(null);
      return;
    }

    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    setAudioLoading(item.id);

    try {
      // Fetch theme from AnimeThemes API
      const anilistId = item.anilistId || item.id;
      const response = await fetch(
        `https://api.animethemes.moe/anime?filter[has]=resources&filter[site]=AniList&filter[external_id]=${anilistId}&include=animethemes.animethemeentries.videos`
      );
      
      if (!response.ok) {
        console.error('Failed to fetch themes');
        setAudioLoading(null);
        return;
      }

      const data = await response.json();
      const anime = data.anime?.[0];
      const themes = anime?.animethemes || [];
      
      // Filter for openings or endings based on battleType
      const targetType = battleType === 'openings' ? 'OP' : 'ED';
      const theme = themes.find((t: { type: string }) => t.type === targetType);
      
      if (!theme) {
        console.log('No theme found for', item.title);
        setAudioLoading(null);
        return;
      }

      const videoUrl = theme.animethemeentries?.[0]?.videos?.[0]?.link;
      
      if (videoUrl) {
        audioRef.current = new Audio(videoUrl);
        audioRef.current.volume = 0.5;
        audioRef.current.onended = () => setPlayingId(null);
        audioRef.current.onerror = () => {
          console.error('Audio playback error');
          setPlayingId(null);
        };
        await audioRef.current.play();
        setPlayingId(item.id);
      }
    } catch (error) {
      console.error('Error fetching theme:', error);
    }
    
    setAudioLoading(null);
  };

  // Initialize battle items based on battleType and bracketSize
  useEffect(() => {
    let active = true;
    const initBracket = async () => {
      setIsInitializing(true);
      let battleItems: BattleItem[] = [];
      const shuffledEntries = shuffleArray(entries);
      
      // Get data based on battle type
      if (battleType === 'openings' || battleType === 'endings') {
        const targetType = battleType === 'openings' ? 'OP' : 'ED';
        const filtered: BattleItem[] = [];
        
        // We need to find enough items with themes to fill the bracket
        // We'll check entries one by one until we have bracketSize or run out
        for (const entry of shuffledEntries) {
          if (!active) return;
          if (filtered.length >= bracketSize) break;
          
          try {
            const themes = await getAnimeThemes(entry.media?.id || 0);
            const targetThemes = themes.filter(t => t.type === targetType);
            const playableTheme = targetThemes.find(t => getThemeAudioUrl(t) !== null);
            
            if (playableTheme) {
              filtered.push({
                id: entry.media?.id || 0,
                anilistId: entry.media?.id || 0,
                title: entry.media?.title.english || entry.media?.title.romaji || 'Unknown',
                image: entry.media?.coverImage?.large || '',
                subtitle: battleType === 'openings' ? 'Opening Theme' : 'Ending Theme',
              });
            }
          } catch (e) {
            console.error('Error checking theme for', entry.media?.title.english, e);
          }
        }
        battleItems = filtered;
      } else if (battleType === 'characters') {
        // For characters, get main characters from anime (using edges structure)
        const itemsToProcess = shuffledEntries.slice(0, bracketSize * 2);
        battleItems = itemsToProcess.flatMap(entry => {
          const edges = entry.media?.characters?.edges || [];
          return edges.slice(0, 1).map(edge => ({
            id: edge?.node?.id || entry.media?.id || 0,
            title: edge?.node?.name?.full || 'Unknown Character',
            image: edge?.node?.image?.large || entry.media?.coverImage?.large || '',
            subtitle: entry.media?.title.english || entry.media?.title.romaji,
          }));
        }).filter(item => item.title !== 'Unknown Character').slice(0, bracketSize);
      } else {
        // For anime/manga, use cover images
        battleItems = shuffledEntries.slice(0, bracketSize).map(entry => ({
          id: entry.media?.id || 0,
          title: entry.media?.title.english || entry.media?.title.romaji || 'Unknown',
          image: entry.media?.coverImage?.large || '',
        }));
      }
      
      if (!active) return;

      // Ensure we have a power of 2 and respect bracketSize
      const targetCount = Math.pow(2, Math.floor(Math.log2(battleItems.length)));
      const finalItems = battleItems.slice(0, targetCount);
      
      if (finalItems.length < 2) {
        console.error('Not enough items for a bracket battle');
        setInitError(`Not enough ${battleType} for a bracket battle. Need at least 2 items, found ${finalItems.length}.`);
        setIsInitializing(false);
        return;
      }

      setItems(finalItems);
      setIsReady(true);
      setIsInitializing(false);
      setInitError(null);
    };

    initBracket();
    return () => { active = false; };
  }, [entries, battleType, bracketSize]);

  const startBattle = () => {
    console.log('startBattle called', { itemsLength: items.length, isReady, currentRound });
    if (!items.length) {
      console.log('No items available, cannot start battle');
      return;
    }
    
    console.log('Creating first round with', items.length, 'items');
    
    // Create first round
    const matches: [BattleItem, BattleItem][] = [];
    for (let i = 0; i < items.length; i += 2) {
      if (items[i] && items[i + 1]) {
        matches.push([items[i], items[i + 1]]);
      }
    }
    
    console.log('Created', matches.length, 'matches');
    
    setCurrentRound({ matches, winners: [] });
    setMatchIndex(0);
    setRoundNumber(1);
    setWinner(null);
    setIsReady(false); // Set ready to false after starting
  };

  const handleVote = (item: BattleItem, side: 'left' | 'right') => {
    if (!currentRound || isAnimating) return;
    
    // Stop any playing audio when voting
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
    }
    
    setSelectedSide(side);
    setIsAnimating(true);

    setTimeout(() => {
      const newWinners = [...currentRound.winners, item];
      
      if (matchIndex < currentRound.matches.length - 1) {
        // More matches in this round
        setCurrentRound({ ...currentRound, winners: newWinners });
        setMatchIndex(m => m + 1);
      } else {
        // Round complete
        if (newWinners.length === 1) {
          // We have a winner!
          setWinner(newWinners[0]);
          onComplete(newWinners[0]);
        } else {
          // Start next round
          const newMatches: [BattleItem, BattleItem][] = [];
          for (let i = 0; i < newWinners.length; i += 2) {
            newMatches.push([newWinners[i], newWinners[i + 1]]);
          }
          setCurrentRound({ matches: newMatches, winners: [] });
          setMatchIndex(0);
          setRoundNumber(r => r + 1);
        }
      }
      
      setIsAnimating(false);
      setSelectedSide(null);
    }, 500);
  };

  const getBattleIcon = () => {
    switch (battleType) {
      case 'openings':
      case 'endings':
        return <Music className="w-6 h-6" />;
      case 'manga':
        return <BookOpen className="w-6 h-6" />;
      default:
        return <Tv className="w-6 h-6" />;
    }
  };

  const getBattleTitle = () => {
    switch (battleType) {
      case 'openings':
        return 'Best Opening Tournament';
      case 'endings':
        return 'Best Ending Tournament';
      case 'manga':
        return 'Best Manga Tournament';
      case 'characters':
        return 'Best Character Tournament';
      default:
        return 'Best Anime Tournament';
    }
  };

  if (isInitializing) {
    console.log('Rendering initializing screen');
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 animate-pulse">
          {battleType === 'openings' || battleType === 'endings' 
            ? 'Finding themes for your tournament...' 
            : 'Initializing bracket...'}
        </p>
      </div>
    );
  }

  if (initError) {
    console.log('Rendering error screen:', initError);
    return (
      <div className="max-w-2xl mx-auto p-8 rounded-2xl bg-white/5 border border-white/10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-6">
          <Swords className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Cannot Start Tournament</h2>
        <p className="text-gray-400 mb-6">{initError}</p>
        
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Try watching more {battleType === 'anime' ? 'anime' : battleType === 'manga' ? 'manga' : 'anime with themes'} 
            or select a smaller bracket size.
          </p>
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
          >
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  if (isReady && !currentRound) {
    console.log('Rendering ready screen', { itemsLength: items.length, isReady, currentRound, battleType });
    return (
      <div className="max-w-2xl mx-auto p-8 rounded-2xl bg-white/5 border border-white/10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-6">
          {getBattleIcon()}
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">{getBattleTitle()}</h2>
        <p className="text-gray-400 mb-6">
          {items.length} contestants ready for battle!
        </p>
        
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mb-6 max-w-md mx-auto">
          {items.slice(0, 16).map((item) => (
            <div key={item.id} className="relative aspect-3/4 rounded-lg overflow-hidden border border-white/20">
              {item.image && (
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-1">
                <p className="text-[8px] text-white truncate">{item.title}</p>
              </div>
            </div>
          ))}
          {items.length > 16 && (
            <div className="aspect-3/4 rounded-lg bg-gray-800 flex items-center justify-center border border-white/20">
              <span className="text-xs text-gray-400">+{items.length - 16}</span>
            </div>
          )}
        </div>
        
        <button
          onClick={(e) => {
            console.log('Button clicked!');
            e.preventDefault();
            startBattle();
          }}
          className="px-8 py-4 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-lg transition-all hover:scale-105 flex items-center gap-2 mx-auto"
        >
          <Play className="w-5 h-5" />
          Start Tournament
        </button>
      </div>
    );
  }

  if (winner) {
    console.log('Rendering winner screen:', winner.title);
    return (
      <div className="max-w-2xl mx-auto p-8 rounded-2xl bg-white/5 border border-white/10 text-center">
        <div className="w-20 h-20 rounded-2xl bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
          <Trophy className="w-10 h-10 text-yellow-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Champion!</h2>
        <p className="text-gray-400 mb-6">Your {battleType} tournament winner is...</p>
        
        <div className="relative w-48 h-72 mx-auto mb-6 rounded-xl overflow-hidden border-4 border-yellow-500">
          {winner.image && (
            <Image
              src={winner.image}
              alt={winner.title}
              fill
              className="object-cover"
            />
          )}
        </div>
        <h3 className="text-2xl font-bold text-yellow-400 mb-8">{winner.title}</h3>
        
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
        >
          Back to Games
        </button>
      </div>
    );
  }

  if (!currentRound) {
    return null; // This should not happen since we check earlier, but TypeScript safety
  }

  const currentMatch = currentRound.matches[matchIndex];
  const remaining = currentRound.matches.length * 2 - currentRound.winners.length;

  console.log('Rendering battle screen', { currentMatch: currentMatch[0]?.title, remaining, matchIndex });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 text-purple-400 mb-4">
          {getBattleIcon()}
          <span>{getBattleTitle()}</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{getRoundName(remaining)}</h2>
        <p className="text-gray-400">
          Match {matchIndex + 1} of {currentRound.matches.length} • Round {roundNumber}
        </p>
      </div>

      {/* Battle Arena */}
      <div className="flex items-center justify-center gap-4 md:gap-8">
        {/* Left Contestant */}
        <button
          onClick={() => handleVote(currentMatch[0], 'left')}
          disabled={isAnimating}
          className={`group relative flex-1 max-w-xs transition-all duration-300 ${
            selectedSide === 'left' ? 'scale-110 z-10' : 
            selectedSide === 'right' ? 'scale-90 opacity-50' : 
            'hover:scale-105'
          }`}
        >
          <div className="relative aspect-2/3 rounded-xl overflow-hidden border-2 border-white/20 group-hover:border-purple-500 transition-colors">
            {currentMatch[0].image && (
              <Image
                src={currentMatch[0].image}
                alt={currentMatch[0].title}
                fill
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />
            {/* Play button for openings/endings */}
            {(battleType === 'openings' || battleType === 'endings') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAudio(currentMatch[0]);
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-black/60 hover:bg-purple-600 flex items-center justify-center transition-all hover:scale-110"
              >
                {audioLoading === currentMatch[0].id ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : playingId === currentMatch[0].id ? (
                  <Pause className="w-8 h-8 text-white" />
                ) : (
                  <Play className="w-8 h-8 text-white ml-1" />
                )}
              </button>
            )}
            {playingId === currentMatch[0].id && (
              <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-purple-600 text-white text-xs">
                <Volume2 className="w-3 h-3" />
                Playing
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-white font-bold text-lg line-clamp-2">{currentMatch[0].title}</p>
              {currentMatch[0].subtitle && (
                <p className="text-purple-400 text-sm">{currentMatch[0].subtitle}</p>
              )}
            </div>
          </div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Heart className="w-8 h-8 text-pink-500 fill-pink-500" />
          </div>
        </button>

        {/* VS */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center">
            <Swords className="w-8 h-8 text-red-400" />
          </div>
          <span className="text-red-400 font-bold mt-2">VS</span>
        </div>

        {/* Right Contestant */}
        <button
          onClick={() => handleVote(currentMatch[1], 'right')}
          disabled={isAnimating}
          className={`group relative flex-1 max-w-xs transition-all duration-300 ${
            selectedSide === 'right' ? 'scale-110 z-10' : 
            selectedSide === 'left' ? 'scale-90 opacity-50' : 
            'hover:scale-105'
          }`}
        >
          <div className="relative aspect-2/3 rounded-xl overflow-hidden border-2 border-white/20 group-hover:border-purple-500 transition-colors">
            {currentMatch[1].image && (
              <Image
                src={currentMatch[1].image}
                alt={currentMatch[1].title}
                fill
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />
            {/* Play button for openings/endings */}
            {(battleType === 'openings' || battleType === 'endings') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAudio(currentMatch[1]);
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-black/60 hover:bg-purple-600 flex items-center justify-center transition-all hover:scale-110"
              >
                {audioLoading === currentMatch[1].id ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : playingId === currentMatch[1].id ? (
                  <Pause className="w-8 h-8 text-white" />
                ) : (
                  <Play className="w-8 h-8 text-white ml-1" />
                )}
              </button>
            )}
            {playingId === currentMatch[1].id && (
              <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-purple-600 text-white text-xs">
                <Volume2 className="w-3 h-3" />
                Playing
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-white font-bold text-lg line-clamp-2">{currentMatch[1].title}</p>
              {currentMatch[1].subtitle && (
                <p className="text-purple-400 text-sm">{currentMatch[1].subtitle}</p>
              )}
            </div>
          </div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Heart className="w-8 h-8 text-pink-500 fill-pink-500" />
          </div>
        </button>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: items.length }).map((_, i) => {
          const totalEliminated = (items.length - remaining);
          const isEliminated = i < totalEliminated;
          const isWinner = i < currentRound.winners.length + (items.length - currentRound.matches.length * 2);
          
          return (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all ${
                isEliminated ? 'bg-gray-600' : 
                isWinner ? 'bg-green-500' : 'bg-purple-500/50'
              }`}
            />
          );
        })}
      </div>

      {/* Instructions */}
      <p className="text-center text-gray-500 text-sm">
        Click on your favorite to advance it to the next round
      </p>

      {/* Back button */}
      <button
        onClick={onBack}
        className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
      >
        ← Back to Games
      </button>
    </div>
  );
}
