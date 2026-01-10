'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAnimeList, useMangaList } from '@/hooks/use-anilist';
import { GameEngine } from '@/lib/game-engine';
import { GameSession, MediaListEntry, GameQuestion } from '@/types/anilist';
import { normalizeMediaList } from '@/lib/normalize-media-list';
import { GamePlay } from './game-play';
import { GameResults } from './game-results';
import { MultiplayerResults } from './multiplayer-results';
import { GameSettingsModal, GameSettings } from './game-settings';
import { 
  Music, 
  Image as ImageIcon, 
  Quote, 
  Target, 
  Trophy, 
  Clock, 
  Gamepad2, 
  Zap, 
  Play, 
  Users, 
  Activity,
  Calendar,
  BookOpen,
  Swords
} from 'lucide-react';
import { HangmanGame } from './hangman-game';
import { WordleGame } from './wordle-game';
import { BracketBattle } from './bracket-battle';
import { MultiplayerRoom } from '@/lib/supabase';
import { MultiplayerLobby } from './multiplayer-lobby';
import { useMedia } from '@/contexts/media-context';

export function GameHub() {
  const { user } = useAuth();
  const { activeType, setActiveType, getSeriesTerm, getWatchReadTerm } = useMedia();
  const { data: animeList, isLoading: isLoadingAnime } = useAnimeList(user?.id || 0);
  const { data: mangaList, isLoading: isLoadingManga } = useMangaList(user?.id || 0);
  
  const [currentGame, setCurrentGame] = useState<GameSession | null>(null);
  const [gameResults, setGameResults] = useState<GameSession | null>(null);
  const [selectedGameType, setSelectedGameType] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [specialGame, setSpecialGame] = useState<'hangman' | 'wordle' | 'bracket-anime' | 'bracket-manga' | null>(null);
  const [bracketSettings, setBracketSettings] = useState<{ size: number; category: string }>({ size: 16, category: 'anime' });
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [multiplayerGameType, setMultiplayerGameType] = useState<string | null>(null);
  const [multiplayerRoom, setMultiplayerRoom] = useState<MultiplayerRoom | null>(null);
  // P1-9 FIX: Track last played game type for "Play Again" to return to settings
  const [lastPlayedGameType, setLastPlayedGameType] = useState<string | null>(null);

  const isLoading = activeType === 'ANIME' ? isLoadingAnime : isLoadingManga;
  const currentList = activeType === 'ANIME' ? animeList : mangaList;

  // Normalize list: flatten, dedupe, and filter to engaged entries only
  const allEntries = useMemo(() => normalizeMediaList(currentList), [currentList]);

  // Separate anime and manga entries for bracket battles
  const animeEntries = useMemo(() => normalizeMediaList(animeList), [animeList]);
  const mangaEntries = useMemo(() => normalizeMediaList(mangaList), [mangaList]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-gray-400">Loading games...</p>
      </div>
    );
  }

  if (!animeList) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No game data available.</p>
      </div>
    );
  }

  // Open settings modal when clicking Play
  const openGameSettings = (gameType: string) => {
    // Hangman and Wordle start directly (no settings needed)
    if (gameType === 'hangman' || gameType === 'wordle') {
      setSpecialGame(gameType as 'hangman' | 'wordle');
      return;
    }
    // All other games (including bracket) use settings modal
    setSelectedGameType(gameType);
    setShowSettings(true);
  };

  // Open multiplayer lobby
  const openMultiplayer = (gameType: string) => {
    setMultiplayerGameType(gameType);
    setShowMultiplayer(true);
  };

  const handleStartMultiplayer = async (room: MultiplayerRoom) => {
    setMultiplayerRoom(room);
    
    // Hide lobby and show game when room is in playing state and has questions
    if (room.state === 'playing' && room.questions && room.questions.length > 0) {
      setShowMultiplayer(false);
      setMultiplayerGameType(null);
      
      const session = GameEngine.createGameSession(room.gameType, room.questions as GameQuestion[]);
      setCurrentGame(session);
    }
  };

  // Start game with configured settings
  const startGameWithSettings = (settings: GameSettings) => {
    if (!selectedGameType) return;
    
    // Filter entries based on difficulty
    const filteredEntries = GameEngine.filterEntriesByDifficulty(allEntries, settings.difficulty);
    const questionCount = Math.min(settings.questionCount, filteredEntries.length);
    
    // Get time limit based on setting
    const timeMultiplier = settings.timeLimit === 'relaxed' ? 1.5 : settings.timeLimit === 'speed' ? 0.5 : 1;
    
    let questions;
    
    switch (selectedGameType) {
      case 'op-guessing':
        questions = GameEngine.generateOPGuessingQuestions(filteredEntries, questionCount, settings.themeMode);
        break;
      case 'screenshot-guessing':
        questions = GameEngine.generateScreenshotQuestions(filteredEntries, questionCount);
        break;
      case 'quote-guessing':
        questions = GameEngine.generateQuoteQuestions(filteredEntries, questionCount);
        break;
      case 'score-guessing':
        questions = GameEngine.generateScoreGuessQuestions(filteredEntries, questionCount);
        break;
      case 'character-guessing':
        questions = GameEngine.generateCharacterQuestions(filteredEntries, questionCount);
        break;
      case 'season-matching':
        questions = GameEngine.generateSeasonMatchQuestions(filteredEntries, questionCount);
        break;
      case 'cover-guessing':
        questions = GameEngine.generateCoverGuessQuestions(filteredEntries, questionCount);
        break;
      case 'chapters-guessing':
        questions = GameEngine.generateChapterCountGuessQuestions(filteredEntries, questionCount);
        break;
      case 'bracket-anime':
        // P2-10 FIX: Handle anime bracket battle
        setBracketSettings({
          size: settings.bracketSize || 16,
          category: settings.bracketCategory || 'anime',
        });
        setSpecialGame('bracket-anime');
        setShowSettings(false);
        setSelectedGameType(null);
        return;
      case 'bracket-manga':
        // Start bracket battle with settings from modal
        setBracketSettings({
          size: settings.bracketSize || 16,
          category: settings.bracketCategory || 'manga',
        });
        setSpecialGame('bracket-manga');
        setShowSettings(false);
        setSelectedGameType(null);
        return;
      default:
        return;
    }

    // Apply time multiplier to questions
    questions = questions.map(q => ({
      ...q,
      timeLimit: Math.round((q.timeLimit || 30) * timeMultiplier),
    }));

    const session = GameEngine.createGameSession(selectedGameType, questions);
    // P1-9 FIX: Save last played game type for Play Again
    setLastPlayedGameType(selectedGameType);
    setCurrentGame(session);
    setGameResults(null);
    setShowSettings(false);
    setSelectedGameType(null);
  };

  // Get selected game info for modal
  const getSelectedGameInfo = () => {
    const allGameTypes = [
      ...animeGameTypes,
      ...mangaGameTypes,
      ...commonGameTypes,
    ];
    return allGameTypes.find(g => g.id === selectedGameType);
  };

  const handleGameComplete = (results: GameSession, finalRoom?: MultiplayerRoom) => {
    setCurrentGame(null);
    setGameResults(results);
    if (finalRoom) {
      setMultiplayerRoom(finalRoom);
    }
  };

  // P1-9 FIX: Play Again returns to settings with same game type
  const handlePlayAgain = () => {
    setGameResults(null);
    if (lastPlayedGameType) {
      setSelectedGameType(lastPlayedGameType);
      setShowSettings(true);
    }
  };

  if (showMultiplayer && multiplayerGameType) {
    return (
      <MultiplayerLobby
        gameType={multiplayerGameType}
        activeType={activeType}
        allEntries={multiplayerGameType?.includes('chapters') || multiplayerGameType?.includes('volumes') ? mangaEntries : allEntries}
        onStartGame={handleStartMultiplayer}
        onBack={() => {
          setShowMultiplayer(false);
          setMultiplayerGameType(null);
        }}
      />
    );
  }

  // Special games (Hangman, Wordle, Bracket Battle)
  if (specialGame === 'hangman') {
    return (
      <HangmanGame
        entries={allEntries}
        activeType={activeType}
        onComplete={(session) => {
          setSpecialGame(null);
          handleGameComplete(session);
        }}
        onBack={() => setSpecialGame(null)}
      />
    );
  }

  if (specialGame === 'wordle') {
    return (
      <WordleGame
        entries={allEntries}
        activeType={activeType}
        onComplete={(session) => {
          setSpecialGame(null);
          handleGameComplete(session);
        }}
        onBack={() => setSpecialGame(null)}
      />
    );
  }

  if (specialGame === 'bracket-anime' || specialGame === 'bracket-manga') {
    // P2-11 FIX: Properly determine media type and category to prevent cross-media leakage
    // The specialGame determines which media pool to use, bracketSettings.category determines the battle type
    const isAnimeBracket = specialGame === 'bracket-anime';
    const battleCategory = bracketSettings.category as 'anime' | 'manga' | 'characters' | 'openings' | 'endings';
    
    // Use the correct entry pool based on specialGame (not bracketSettings.category)
    // This ensures anime brackets only use anime entries and manga brackets only use manga entries
    const bracketEntries = isAnimeBracket ? animeEntries : mangaEntries;
    return (
      <BracketBattle
        entries={bracketEntries}
        battleType={battleCategory}
        bracketSize={bracketSettings.size}
        onComplete={(winner) => {
          console.log('Bracket winner:', winner);
          setSpecialGame(null);
        }}
        onBack={() => setSpecialGame(null)}
      />
    );
  }

  if (currentGame) {
    return (
      <GamePlay 
        game={currentGame} 
        onComplete={handleGameComplete} 
        multiplayerRoomId={multiplayerRoom?.id}
      />
    );
  }

    if (gameResults) {
    // Use multiplayer results screen for head-to-head games
    if (multiplayerRoom && multiplayerRoom.players.length > 1) {
      return (
        <MultiplayerResults
          results={gameResults}
          room={multiplayerRoom}
          onPlayAgain={() => {
            setGameResults(null);
            setMultiplayerRoom(null);
          }}
          onBackToHub={() => {
            setGameResults(null);
            setMultiplayerRoom(null);
          }}
        />
      );
    }
    
    return (
      <GameResults 
        results={gameResults} 
        activeType={activeType}
        onPlayAgain={handlePlayAgain}
        onBackToHub={() => {
          setGameResults(null);
          setLastPlayedGameType(null);
        }}
      />
    );
  }

  const animeGameTypes = [
    {
      id: 'op-guessing',
      title: 'OP/ED Guessing',
      description: 'Guess series from their opening and ending themes',
      icon: Music,
      gradient: 'from-purple-500 to-violet-600',
      difficulty: 'Medium',
      difficultyColor: 'bg-yellow-500/20 text-yellow-400',
      estimatedTime: '5-10 min',
    },
    {
      id: 'quote-guessing',
      title: 'Quote Master',
      description: 'Guess titles from memorable quotes',
      icon: Quote,
      gradient: 'from-green-500 to-emerald-500',
      difficulty: 'Medium',
      difficultyColor: 'bg-yellow-500/20 text-yellow-400',
      estimatedTime: '4-7 min',
    },
    {
      id: 'season-matching',
      title: 'Season Navigator',
      description: 'Test your memory of when titles aired or started',
      icon: Calendar,
      gradient: 'from-indigo-500 to-blue-600',
      difficulty: 'Hard',
      difficultyColor: 'bg-red-500/20 text-red-400',
      estimatedTime: '3-6 min',
    },
    {
      id: 'bracket-anime',
      title: 'Anime Bracket Battle',
      description: 'Tournament to crown your favorite anime',
      icon: Swords,
      gradient: 'from-red-500 to-pink-600',
      difficulty: 'Fun',
      difficultyColor: 'bg-pink-500/20 text-pink-400',
      estimatedTime: '5-10 min',
      special: true,
    },
  ];

  const mangaGameTypes = [
    {
      id: 'cover-guessing',
      title: 'Cover Art Expert',
      description: 'Guess the manga from its cover illustration',
      icon: ImageIcon,
      gradient: 'from-orange-500 to-red-600',
      difficulty: 'Medium',
      difficultyColor: 'bg-yellow-500/20 text-yellow-400',
      estimatedTime: '4-8 min',
    },
    {
      id: 'chapters-guessing',
      title: 'Chapter Count',
      description: 'How well do you know the length of your manga?',
      icon: BookOpen,
      gradient: 'from-teal-500 to-emerald-600',
      difficulty: 'Hard',
      difficultyColor: 'bg-red-500/20 text-red-400',
      estimatedTime: '3-5 min',
    },
    {
      id: 'bracket-manga',
      title: 'Manga Bracket Battle',
      description: 'Tournament to crown your favorite manga',
      icon: Swords,
      gradient: 'from-red-500 to-pink-600',
      difficulty: 'Fun',
      difficultyColor: 'bg-pink-500/20 text-pink-400',
      estimatedTime: '5-10 min',
      special: true,
    },
  ];

  const commonGameTypes = [
    {
      id: 'hangman',
      title: `${activeType === 'ANIME' ? 'Anime' : 'Manga'} Hangman`,
      description: `Guess ${activeType === 'ANIME' ? 'anime' : 'manga'} titles letter by letter`,
      icon: Gamepad2,
      gradient: 'from-amber-500 to-orange-600',
      difficulty: 'Medium',
      difficultyColor: 'bg-yellow-500/20 text-yellow-400',
      estimatedTime: '5-10 min',
      special: true,
    },
    {
      id: 'wordle',
      title: `${activeType === 'ANIME' ? 'Anime' : 'Manga'} Wordle`,
      description: `Guess 5-letter ${activeType === 'ANIME' ? 'anime' : 'manga'} words`,
      icon: Zap,
      gradient: 'from-lime-500 to-green-600',
      difficulty: 'Medium',
      difficultyColor: 'bg-yellow-500/20 text-yellow-400',
      estimatedTime: '3-5 min',
      special: true,
    },
    {
      id: 'character-guessing',
      title: 'Character Expert',
      description: `Match characters to their respective ${getSeriesTerm()}`,
      icon: Users,
      gradient: 'from-pink-500 to-rose-600',
      difficulty: 'Medium',
      difficultyColor: 'bg-yellow-500/20 text-yellow-400',
      estimatedTime: '4-8 min',
    },
    {
      id: 'score-guessing',
      title: 'Memory Test',
      description: `Remember what scores you gave to ${getSeriesTerm()}`,
      icon: Target,
      gradient: 'from-orange-500 to-amber-500',
      difficulty: 'Easy',
      difficultyColor: 'bg-green-500/20 text-green-400',
      estimatedTime: '2-5 min',
    },
  ];

  const gameTypes = [
    ...(activeType === 'ANIME' ? animeGameTypes : mangaGameTypes),
    ...commonGameTypes,
  ];

  /*
  const _handleStartDailyChallenge = () => {
    const questions = GameEngine.generateOPGuessingQuestions(allEntries, 10);
    const session = GameEngine.createGameSession('daily-challenge', questions);
    setCurrentGame(session);
  };
  */

  return (
    <div className="space-y-8">
      {/* Type Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-white/5 border border-white/10 rounded-xl">
          <button
            onClick={() => setActiveType('ANIME')}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
              activeType === 'ANIME' 
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Anime
          </button>
          <button
            onClick={() => setActiveType('MANGA')}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
              activeType === 'MANGA' 
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Manga
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-sm text-purple-400 mb-4">
          <Gamepad2 className="w-4 h-4" />
          <span>{allEntries.length} {getSeriesTerm()} in your collection</span>
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">Game Arena</h2>
        <p className="text-gray-400 max-w-xl mx-auto">
          Test your {getSeriesTerm()} knowledge with personalized challenges based on your {getWatchReadTerm()} history
        </p>
      </div>

      {allEntries.length === 0 ? (
        <div className="max-w-md mx-auto p-8 rounded-2xl bg-white/5 border border-white/10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-4 mx-auto">
            <Activity className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No {activeType === 'ANIME' ? 'Anime' : 'Manga'} Data</h3>
          <p className="text-gray-400">
            You need {getSeriesTerm()} in your AniList to play games. Start {getWatchReadTerm()} and come back!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gameTypes.map((gameType) => {
            const Icon = gameType.icon;
            const isDisabled = 'disabled' in gameType && (gameType as { disabled?: boolean }).disabled === true;
            return (
              <div 
                key={gameType.id} 
                className={`group p-6 rounded-2xl bg-white/5 border border-white/10 transition-all duration-300 ${
                  isDisabled ? 'opacity-60' : 'hover:border-white/20 hover:-translate-y-1'
                }`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${gameType.gradient} flex items-center justify-center shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-1">{gameType.title}</h3>
                    <p className="text-sm text-gray-400">{gameType.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {gameType.estimatedTime}
                    </div>
                    <div className={`px-2 py-0.5 rounded-full ${gameType.difficultyColor}`}>
                      {gameType.difficulty}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => !isDisabled && openMultiplayer(gameType.id)}
                      disabled={isDisabled}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isDisabled 
                          ? 'bg-white/5 text-gray-500 cursor-not-allowed' 
                          : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      Battle
                    </button>
                    <button
                      onClick={() => !isDisabled && openGameSettings(gameType.id)}
                      disabled={isDisabled}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isDisabled 
                          ? 'bg-white/5 text-gray-500 cursor-not-allowed' 
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      <Play className="w-4 h-4" />
                      {isDisabled ? 'Coming Soon' : 'Play'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Community Features Teaser */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Community Features</h3>
            <p className="text-sm text-gray-400">Track your progress and compete with friends</p>
          </div>
        </div>
        
        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
          <p className="text-purple-300 mb-2">🏆 Switch to Community mode to view:</p>
          <div className="flex flex-wrap justify-center gap-2 text-sm">
            <span className="px-3 py-1 rounded-full bg-white/5 text-gray-300">Your Rating</span>
            <span className="px-3 py-1 rounded-full bg-white/5 text-gray-300">Match History</span>
            <span className="px-3 py-1 rounded-full bg-white/5 text-gray-300">Achievements</span>
            <span className="px-3 py-1 rounded-full bg-white/5 text-gray-300">Daily Challenges</span>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-6 rounded-2xl bg-linear-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">How It Works</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 rounded-lg bg-white/5">
            <div className="text-purple-400 font-medium mb-1">Personalized</div>
            <div className="text-gray-400">Questions based on your actual {getSeriesTerm()} list</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5">
            <div className="text-blue-400 font-medium mb-1">Adaptive</div>
            <div className="text-gray-400">Difficulty scales with your collection</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5">
            <div className="text-green-400 font-medium mb-1">Competitive</div>
            <div className="text-gray-400">Track your scores and improve over time</div>
          </div>
        </div>
      </div>

      {/* Game Settings Modal */}
      {(() => {
        const selectedGame = getSelectedGameInfo();
        return (
          <GameSettingsModal
            isOpen={showSettings}
            onClose={() => {
              setShowSettings(false);
              setSelectedGameType(null);
            }}
            onStart={startGameWithSettings}
            gameTitle={selectedGame?.title || ''}
            gameDescription={selectedGame?.description || ''}
            maxQuestions={allEntries.length}
            gameType={selectedGameType || undefined}
          />
        );
      })()}
    </div>
  );
}
