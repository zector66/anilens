'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { 
  Users, 
  Copy, 
  Check, 
  Play, 
  ArrowLeft, 
  Crown,
  Loader2,
  UserPlus
} from 'lucide-react';
import {
  supabase,
  createRoom,
  joinRoom,
  subscribeToRoom,
  updatePlayerState,
  updateRoomState,
  leaveRoom,
  MultiplayerRoom,
} from '@/lib/supabase';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { MediaListEntry, GameQuestion } from '@/types/anilist';
import { GameEngine } from '@/lib/game-engine';
import { GameSettings } from './game-settings';

interface MultiplayerLobbyProps {
  gameType: string;
  activeType?: 'ANIME' | 'MANGA';
  allEntries: MediaListEntry[];
  onStartGame: (room: MultiplayerRoom) => void;
  onBack: () => void;
}

export function MultiplayerLobby({ gameType, activeType = 'ANIME', allEntries, onStartGame, onBack }: MultiplayerLobbyProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<'menu' | 'create' | 'join' | 'lobby'>('menu');
  const [room, setRoom] = useState<MultiplayerRoom | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync room state when in lobby
  useEffect(() => {
    const roomId = room?.id;
    if (!roomId || mode !== 'lobby') return;

    const channel = subscribeToRoom(roomId, (updatedRoom) => {
      setRoom(updatedRoom);
      
      // If game started, notify parent
      if (updatedRoom.state === 'playing' && updatedRoom.questions?.length > 0) {
        onStartGame(updatedRoom);
      }
    });

    return () => {
      channel?.unsubscribe();
    };
  }, [room?.id, mode, onStartGame]);

  // Check if Supabase is configured
  const isConfigured = !!supabase;

  // Cleanup on unmount
  useEffect(() => {
    const roomId = room?.id;
    const userId = user?.id;
    return () => {
      if (roomId && userId) {
        leaveRoom(roomId, String(userId));
      }
    };
  }, [room?.id, user?.id]);

  const handleCreateRoom = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    const newRoom = await createRoom(
      String(user.id),
      user.name,
      user.avatar?.large,
      gameType,
      {
        questionCount: 10,
        difficulty: 'mixed',
        timeLimit: 'normal',
      }
    );

    if (newRoom) {
      setRoom(newRoom);
      setMode('lobby');
    } else {
      setError(`You need to have ${activeType === 'ANIME' ? 'anime' : 'manga'} in your list to play personalized games.`);
    }

    setIsLoading(false);
  };

  const handleJoinRoom = async () => {
    if (!user || !joinCode.trim()) return;
    setIsLoading(true);
    setError(null);

    const joinedRoom = await joinRoom(
      joinCode.trim(),
      String(user.id),
      user.name,
      user.avatar?.large
    );

    if (joinedRoom) {
      setRoom(joinedRoom);
      setMode('lobby');
    } else {
      setError('Room not found or already started.');
    }

    setIsLoading(false);
  };

  const handleReady = async () => {
    if (!room || !user) return;
    
    const player = room.players.find(p => p.id === String(user.id));
    if (player) {
      await updatePlayerState(room.id, String(user.id), { isReady: !player.isReady });
    }
  };

  const handleStartGame = async () => {
    if (!room || !user || !allEntries.length) return;
    
    // Check if all players are ready
    const allReady = room.players.every(p => p.isReady);
    if (!allReady) {
      setError('All players must be ready to start.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Generate questions first as host
      const filteredEntries = GameEngine.filterEntriesByDifficulty(allEntries, room.settings.difficulty as GameSettings['difficulty']);
      const questionCount = Math.min(room.settings.questionCount, filteredEntries.length);
      
      let questions: GameQuestion[] = [];
      switch (gameType) {
        case 'op-guessing':
          questions = GameEngine.generateOPGuessingQuestions(filteredEntries, questionCount, (room.settings as GameSettings).themeMode);
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
      }

      if (questions.length === 0) {
        setError('Failed to generate questions. Please try again.');
        setIsLoading(false);
        return;
      }

      // 2. Update room with questions AND set state to playing in one go
      // This ensures guests see both at the same time and eliminates race conditions
      await updateRoomState(room.id, 'playing', { 
        questions,
        startedAt: new Date().toISOString() 
      });
    } catch (err) {
      console.error('Error starting game:', err);
      setError('Failed to start game.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyRoomCode = () => {
    if (room) {
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBack = async () => {
    if (room && user) {
      await leaveRoom(room.id, String(user.id));
      setRoom(null);
    }
    if (mode === 'lobby') {
      setMode('menu');
    } else {
      onBack();
    }
  };

  if (!isConfigured) {
    return (
      <div className="max-w-md mx-auto p-8 rounded-2xl bg-white/5 border border-white/10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-yellow-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Multiplayer Not Configured</h2>
        <p className="text-gray-400 text-sm mb-6">
          To enable head-to-head battles, you need to set up Supabase:
        </p>
        <div className="text-left p-4 rounded-xl bg-white/5 text-sm font-mono text-gray-300 mb-6">
          <p>NEXT_PUBLIC_SUPABASE_URL=...</p>
          <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=...</p>
        </div>
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Menu - Choose create or join
  if (mode === 'menu') {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {activeType === 'ANIME' ? 'Anime' : 'Manga'} Games
        </button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Head-to-Head Battle</h2>
          <p className="text-gray-400 mt-2">Challenge a friend to compete in real-time!</p>
        </div>

        <button
          onClick={handleCreateRoom}
          disabled={isLoading}
          className="w-full p-6 rounded-2xl bg-linear-to-r from-purple-500 to-pink-500 text-white font-bold text-lg flex items-center justify-center gap-3 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <Crown className="w-6 h-6" />
              Create Room
            </>
          )}
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 bg-gray-900 text-gray-500 text-sm">or</span>
          </div>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Enter room code"
            maxLength={6}
            className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-center text-2xl tracking-[0.5em] placeholder:tracking-normal placeholder:text-sm focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={handleJoinRoom}
            disabled={isLoading || joinCode.length < 6}
            className="w-full p-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Join Room
              </>
            )}
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}
      </div>
    );
  }

  // Lobby - Waiting for players
  if (mode === 'lobby' && room) {
    const isHost = room.hostId === String(user?.id);
    const currentPlayer = room.players.find(p => p.id === String(user?.id));
    const allReady = room.players.every(p => p.isReady);
    const canStart = isHost && allReady && room.players.length >= 2;

    return (
      <div className="max-w-md mx-auto space-y-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Leave Room
        </button>

        {/* Room Code */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
          <p className="text-gray-400 text-sm mb-2">Room Code</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl font-bold text-white tracking-[0.3em]">{room.code}</span>
            <button
              onClick={copyRoomCode}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : (
                <Copy className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>
          <p className="text-gray-500 text-xs mt-2">Share this code with your opponent</p>
        </div>

        {/* Players */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            Players ({room.players.length}/2)
          </h3>
          <div className="space-y-3">
            {room.players.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5"
              >
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-700">
                  {player.avatar ? (
                    <OptimizedImage src={player.avatar} alt={player.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-bold">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{player.name}</span>
                    {player.id === room.hostId && (
                      <Crown className="w-4 h-4 text-yellow-400" />
                    )}
                  </div>
                  <span className={`text-xs ${player.isReady ? 'text-green-400' : 'text-gray-500'}`}>
                    {player.isReady ? 'Ready!' : 'Not ready'}
                  </span>
                </div>
                {player.isReady && (
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                )}
              </div>
            ))}

            {room.players.length < 2 && (
              <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-white/10">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-gray-500" />
                </div>
                <span className="text-gray-500">Waiting for opponent...</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {!isHost && (
            <button
              onClick={handleReady}
              className={`w-full p-4 rounded-xl font-medium transition-colors ${
                currentPlayer?.isReady
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                  : 'bg-purple-500 text-white hover:bg-purple-600'
              }`}
            >
              {currentPlayer?.isReady ? '✓ Ready!' : 'Ready Up'}
            </button>
          )}

          {isHost && (
            <>
              <button
                onClick={handleReady}
                className={`w-full p-4 rounded-xl font-medium transition-colors ${
                  currentPlayer?.isReady
                    ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {currentPlayer?.isReady ? '✓ Ready!' : 'Ready Up'}
              </button>
              <button
                onClick={handleStartGame}
                disabled={!canStart}
                className="w-full p-4 rounded-xl bg-linear-to-r from-purple-500 to-pink-500 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-5 h-5" />
                Start Game
              </button>
              {!canStart && room.players.length >= 2 && !allReady && (
                <p className="text-yellow-400 text-sm text-center">Waiting for all players to ready up...</p>
              )}
              {!canStart && room.players.length < 2 && (
                <p className="text-gray-400 text-sm text-center">Waiting for opponent to join...</p>
              )}
            </>
          )}
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}
      </div>
    );
  }

  return null;
}
