'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { GameSession, GameQuestion } from '@/types/anilist';
import { Clock, Trophy, Lightbulb, Volume2, Users, Calendar, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useAnimeTheme } from '@/hooks/use-anime-theme';
import { ThemePlayerCompact } from './theme-player';
import { useSettings } from '@/contexts/settings-context';
import { useAuth } from '@/hooks/use-auth';
import { updatePlayerState, subscribeToRoom, updateRoomState, MultiplayerRoom } from '@/lib/supabase';

// Component for OP/ED guessing with real audio from AnimeThemes
function OPGuessContent({ 
  anilistId, 
  onSkip,
  onAudioStart,
  showAnswer = false,
}: { 
  anilistId?: number;
  onSkip?: () => void;
  onAudioStart?: () => void;
  showAnswer?: boolean;
}) {
  const { theme, isLoading, error } = useAnimeTheme(anilistId);
  const skipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onSkipRef = useRef(onSkip);
  
  // Keep onSkip ref updated to avoid stale closures
  useEffect(() => {
    onSkipRef.current = onSkip;
  }, [onSkip]);

  // Skip this question if theme is unavailable
  useEffect(() => {
    // Clear any existing timeout
    if (skipTimeoutRef.current) {
      clearTimeout(skipTimeoutRef.current);
      skipTimeoutRef.current = null;
    }
    
    // Only skip if not loading, there's an error or no theme, and not showing answer
    if (!isLoading && (error || !theme) && !showAnswer) {
      // Small delay to show the "skipping" message
      skipTimeoutRef.current = setTimeout(() => {
        onSkipRef.current?.();
      }, 1500);
    }
    
    return () => {
      if (skipTimeoutRef.current) {
        clearTimeout(skipTimeoutRef.current);
      }
    };
  }, [isLoading, error, theme, showAnswer]);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="bg-white/5 rounded-2xl p-8 mb-6 border border-white/10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Loading Theme...</h3>
          <p className="text-gray-400 text-sm">Fetching theme from AnimeThemes</p>
        </div>
      </div>
    );
  }

  if (error || !theme) {
    // Show skipping message
    return (
      <div className="text-center py-8">
        <div className="bg-white/5 rounded-2xl p-8 mb-6 border border-white/10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/20 flex items-center justify-center">
            <Volume2 className="w-8 h-8 text-orange-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Theme Unavailable</h3>
          <p className="text-gray-400 text-sm">Skipping to next question...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <div className="mb-6">
        <ThemePlayerCompact 
          theme={theme} 
          autoPlay={!showAnswer} 
          showSongInfo={showAnswer}
          onPlay={onAudioStart}
        />
      </div>
      {showAnswer ? (
        <div className="space-y-2">
          <p className="text-lg font-bold text-white">
            {theme.songTitle || 'Unknown Song'}
          </p>
          {theme.artistName && (
            <p className="text-sm text-purple-300">by {theme.artistName}</p>
          )}
          <p className="text-xs text-gray-500">
            {theme.type === 'OP' ? 'Opening' : 'Ending'} {theme.sequence > 1 ? theme.sequence : ''}
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-400">
          🎵 Which anime is this {theme.type === 'OP' ? 'opening' : 'ending'} from?
        </p>
      )}
    </div>
  );
}

interface QuestionCardProps {
  question: GameQuestion;
  onAnswer: (answer: string, timeLeft: number) => void;
  gameState: 'playing' | 'answered' | 'times-up';
  selectedAnswer: string;
  onSelect: (answer: string) => void;
  onSkip?: () => void;
  room?: MultiplayerRoom | null;
  questionIndex?: number;
  currentUserId?: string;
}

function QuestionCard({ 
  question, 
  onAnswer, 
  gameState, 
  selectedAnswer, 
  onSelect,
  onSkip,
  room,
  questionIndex = 0,
  currentUserId,
}: QuestionCardProps) {
  const { getPreferredTitle } = useSettings();
  const [timeLeft, setTimeLeft] = useState(question.timeLimit || 30);
  const [showHint, setShowHint] = useState(false);
  // For OP_GUESS questions, pause timer until audio starts
  const [timerPaused, setTimerPaused] = useState(question?.type === 'OP_GUESS');

  // Reset timer pause when question changes
  useEffect(() => {
    const isOpGuess = question?.type === 'OP_GUESS';
    setTimerPaused(isOpGuess);
  }, [question?.id, question?.type]);

  useEffect(() => {
    // Don't run timer if paused (waiting for audio to start)
    if (gameState === 'playing' && timeLeft > 0 && !timerPaused) {
      const timer = setInterval(() => {
        setTimeLeft((prev: number) => {
          if (prev <= 1) {
            onAnswer('', 0); // Times up
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState, timeLeft, onAnswer, timerPaused]);

  const getHintText = () => {
    if (!question?.hints || question.hints.length === 0) return '';
    const hintIndex = Math.min(
      Math.floor(((question.timeLimit || 30) - timeLeft) / 10), 
      question.hints.length - 1
    );
    return question.hints[hintIndex];
  };

  const renderQuestionContent = () => {
    switch (question?.type) {
      case 'CHARACTER_GUESS':
        const charEdge = question.media.characters?.edges?.find(e => e.node.name.full === question.question.match(/"([^"]+)"/)?.[1]);
        const charImage = charEdge?.node.image?.large || charEdge?.node.image?.medium;

        return (
          <div className="text-center py-8">
            <div className="bg-white/5 rounded-2xl p-8 mb-6 border border-white/10">
              {charImage ? (
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <Image
                    src={charImage}
                    alt="Character"
                    fill
                    className="rounded-xl object-cover border-2 border-purple-500/20"
                  />
                </div>
              ) : (
                <Users className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              )}
              <h3 className="text-xl font-bold text-white mb-2">{question?.question}</h3>
              <p className="text-gray-400 text-sm italic">
                Use your memory of character names to identify the source!
              </p>
            </div>
          </div>
        );

      case 'SEASON_MATCH':
        return (
          <div className="text-center py-8">
            <div className="bg-white/5 rounded-2xl p-8 mb-6 border border-white/10">
              <Calendar className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">{question?.question}</h3>
              {question?.media && (
                <div className="flex items-center justify-center gap-4 mt-4">
                  <Image
                    src={question.media.coverImage.medium}
                    alt={getPreferredTitle(question.media.title)}
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-xl object-cover border-2 border-white/10"
                  />
                  <div className="text-left">
                    <p className="font-bold text-white line-clamp-1">{getPreferredTitle(question.media.title)}</p>
                    <p className="text-sm text-gray-400">{question.media.format}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'OP_GUESS':
        return (
          <OPGuessContent 
            anilistId={question?.themeData?.anilistId}
            onSkip={onSkip}
            onAudioStart={() => setTimerPaused(false)}
            showAnswer={gameState === 'answered' || gameState === 'times-up'}
          />
        );

      case 'SCREENSHOT_GUESS':
        // Use the anime's banner image as a "screenshot"
        const bannerImage = question?.media?.bannerImage || question?.media?.coverImage?.extraLarge;
        return (
          <div className="text-center py-8">
            <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
              {bannerImage ? (
                <div className="relative rounded-xl overflow-hidden mb-4">
                  <Image
                    src={bannerImage}
                    alt="Anime scene"
                    width={600}
                    height={300}
                    className="w-full h-48 md:h-64 object-cover"
                    style={{ filter: 'blur(0px)' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
              ) : (
                <div className="bg-white/10 rounded-xl h-48 md:h-64 flex items-center justify-center mb-4">
                  <div className="text-gray-400 text-center">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Scene from this anime</p>
                  </div>
                </div>
              )}
              <h3 className="text-lg font-bold text-white">Which anime is this from?</h3>
              <p className="text-sm text-gray-400 mt-1">Look at the art style and setting!</p>
            </div>
          </div>
        );

      case 'QUOTE_GUESS':
        const quoteText = question?.question.replace('Guess the anime from this quote: ', '').replace(/"/g, '');
        return (
          <div className="text-center py-8">
            <div className="bg-white/5 rounded-2xl p-8 mb-6 border border-white/10 relative overflow-hidden">
              <div className="absolute top-4 left-4 text-6xl text-purple-500/20 font-serif">&ldquo;</div>
              <div className="absolute bottom-4 right-4 text-6xl text-purple-500/20 font-serif rotate-180">&rdquo;</div>
              <blockquote className="text-xl md:text-2xl italic text-white mb-6 relative z-10 px-8">
                {quoteText}
              </blockquote>
              <div className="flex items-center justify-center gap-2">
                <div className="w-8 h-0.5 bg-purple-500/50" />
                <p className="text-sm text-purple-300">Unknown Character</p>
                <div className="w-8 h-0.5 bg-purple-500/50" />
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Which anime features this memorable quote?
              </p>
            </div>
          </div>
        );

      case 'SCORE_GUESS':
        return (
          <div className="text-center py-8">
            <div className="bg-white/5 rounded-2xl p-8 mb-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-6">{question?.question}</h3>
              {question?.media && (
                <div className="flex items-center justify-center gap-4 p-4 bg-white/5 rounded-xl">
                  <Image
                    src={question.media.coverImage.large || question.media.coverImage.medium}
                    alt={getPreferredTitle(question.media.title)}
                    width={80}
                    height={120}
                    className="w-20 h-28 rounded-lg object-cover border-2 border-white/10"
                  />
                  <div className="text-left">
                    <p className="font-bold text-white text-lg">{getPreferredTitle(question.media.title)}</p>
                    <p className="text-sm text-gray-400">
                      {question.media.episodes ? `${question.media.episodes} episodes` : question.media.chapters ? `${question.media.chapters} chapters` : ''} 
                      {question.media.startDate?.year && ` • ${question.media.startDate.year}`}
                    </p>
                    <p className="text-xs text-purple-400 mt-1">
                      Community Score: {question.media.meanScore || '?'}/100
                    </p>
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-400 mt-4">
                What score did YOU give this one?
              </p>
            </div>
          </div>
        );

      case 'COVER_GUESS':
        return (
          <div className="text-center py-8">
            <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
              {question?.media?.coverImage && (
                <div className="relative w-40 h-56 mx-auto mb-4">
                  <Image
                    src={question.media.coverImage.extraLarge || question.media.coverImage.large}
                    alt="Cover art"
                    fill
                    className="rounded-xl object-cover border-2 border-white/20 shadow-2xl"
                  />
                </div>
              )}
              <h3 className="text-lg font-bold text-white">Name this {question?.media?.type === 'MANGA' ? 'manga' : 'anime'}!</h3>
              <p className="text-sm text-gray-400 mt-1">Recognize this cover art?</p>
            </div>
          </div>
        );

      case 'CHAPTER_COUNT_GUESS':
        return (
          <div className="text-center py-8">
            <div className="bg-white/5 rounded-2xl p-8 mb-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-6">{question?.question}</h3>
              {question?.media && (
                <div className="flex items-center justify-center gap-4 p-4 bg-white/5 rounded-xl">
                  <Image
                    src={question.media.coverImage.large || question.media.coverImage.medium}
                    alt={getPreferredTitle(question.media.title)}
                    width={80}
                    height={120}
                    className="w-20 h-28 rounded-lg object-cover border-2 border-white/10"
                  />
                  <div className="text-left">
                    <p className="font-bold text-white text-lg">{getPreferredTitle(question.media.title)}</p>
                    <p className="text-sm text-gray-400">
                      {question.media.volumes && `${question.media.volumes} volumes`}
                      {question.media.startDate?.year && ` • Started ${question.media.startDate.year}`}
                    </p>
                    <p className="text-xs text-purple-400 mt-1">
                      Status: {question.media.status}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return <div>Unknown question type</div>;
    }
  };

  // Keyboard shortcuts for options (1-4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing' || !question?.options) return;
      
      const keyMap: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3 };
      const index = keyMap[e.key];
      
      if (index !== undefined && question.options[index]) {
        onSelect(question.options[index]);
        onAnswer(question.options[index], timeLeft);
      }
      
      // H for hint
      if (e.key.toLowerCase() === 'h') {
        setShowHint(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, question?.options, timeLeft, onAnswer, onSelect]);

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
              timerPaused ? 'bg-purple-500/20 text-purple-400' :
              timeLeft <= 5 ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
            }`}>
              <Clock className="w-4 h-4" />
              <span className="font-mono font-bold text-lg">
                {timerPaused ? '⏸️' : `${timeLeft}s`}
              </span>
            </div>
            {timerPaused && (
              <span className="text-xs text-purple-400">Waiting for audio...</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
              question?.difficulty === 'EASY' ? 'bg-green-500/20 text-green-400' :
              question?.difficulty === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {question?.difficulty}
            </span>
            <span className="text-purple-400 font-bold">{question?.points} pts</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderQuestionContent()}

        {/* Options with keyboard hints and thumbnails */}
        {question?.options && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
            {question.options.map((option: string, index: number) => {
              const optionImage = question.optionImages?.[option];
              // Get players who selected this option (for multiplayer)
              const playersWhoSelected = room?.players.filter(p => 
                p.selectedAnswers?.[questionIndex] === index
              ) || [];
              
              return (
                <button
                  key={index}
                  onClick={() => {
                    if (gameState === 'playing') {
                      onSelect(option);
                      onAnswer(option, timeLeft);
                    }
                  }}
                  disabled={gameState !== 'playing'}
                  className={`relative text-left p-3 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${
                    gameState === 'answered' && option === question.correctAnswer
                      ? 'bg-green-500/20 border-green-500 text-green-300'
                      : gameState === 'answered' && selectedAnswer === option && option !== question.correctAnswer
                      ? 'bg-red-500/20 border-red-500 text-red-300'
                      : selectedAnswer === option
                      ? 'bg-purple-500/20 border-purple-500 text-white'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                  } ${gameState !== 'playing' ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                >
                  {optionImage && (
                    <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0 border border-white/10">
                      <Image
                        src={optionImage}
                        alt=""
                        width={40}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <span className="flex-1 line-clamp-2 pr-6">{option}</span>
                  <span className="absolute top-2 right-2 text-xs text-gray-500 font-mono opacity-50">
                    {index + 1}
                  </span>
                  {/* Show profile pictures of players who selected this option */}
                  {playersWhoSelected.length > 0 && (
                    <div className="absolute -bottom-2 -right-2 flex -space-x-2">
                      {playersWhoSelected.map((player) => (
                        <div 
                          key={player.id}
                          className={`w-8 h-8 rounded-full border-2 overflow-hidden ${
                            player.id === currentUserId ? 'border-purple-500' : 'border-blue-500'
                          }`}
                          title={player.name}
                        >
                          {player.avatar ? (
                            <Image
                              src={player.avatar}
                              alt={player.name}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-600 flex items-center justify-center text-xs text-white">
                              {player.name.charAt(0)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Hint */}
        {gameState === 'playing' && question?.hints && question.hints.length > 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowHint(!showHint)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 transition-colors text-sm"
            >
              <Lightbulb className="w-4 h-4" />
              {showHint ? 'Hide' : 'Show'} Hint
              <span className="text-xs opacity-50">(H)</span>
            </button>
            {showHint && (
              <div className="mt-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 text-sm">
                💡 {getHintText()}
              </div>
            )}
          </div>
        )}

        {/* Result Message */}
        {gameState === 'answered' && (
          <div className={`text-center p-6 rounded-xl mt-6 ${
            selectedAnswer === question.correctAnswer
              ? 'bg-green-500/20 border border-green-500/30'
              : 'bg-red-500/20 border border-red-500/30'
          }`}>
            {selectedAnswer === question.correctAnswer ? (
              <div>
                <p className="text-2xl mb-2">✅</p>
                <p className="font-bold text-green-400 text-lg">Correct!</p>
                <p className="text-green-300 text-sm">+{question.points} points</p>
              </div>
            ) : (
              <div>
                <p className="text-2xl mb-2">❌</p>
                <p className="font-bold text-red-400 text-lg">Incorrect</p>
                <p className="text-red-300 text-sm">The answer was: {question.correctAnswer}</p>
              </div>
            )}
          </div>
        )}

        {gameState === 'times-up' && (
          <div className="text-center p-6 rounded-xl mt-6 bg-orange-500/20 border border-orange-500/30">
            <p className="text-2xl mb-2">⏰</p>
            <p className="font-bold text-orange-400 text-lg">Time&apos;s Up!</p>
            <p className="text-orange-300 text-sm">The answer was: {question.correctAnswer}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface GamePlayProps {
  game: GameSession;
  onComplete: (results: GameSession) => void;
  multiplayerRoomId?: string;
}

export function GamePlay({ game, onComplete, multiplayerRoomId }: GamePlayProps) {
  const { user } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [gameState, setGameState] = useState<'playing' | 'answered' | 'times-up'>('playing');
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<GameSession['answers']>([]);
  const [selectedAnswerIndices, setSelectedAnswerIndices] = useState<number[]>([]);
  const [room, setRoom] = useState<MultiplayerRoom | null>(null);
  const [opponentAnswered, setOpponentAnswered] = useState(false);
  const prevOpponentAnswersRef = useRef<number>(0);

  // Sync multiplayer state
  useEffect(() => {
    if (!multiplayerRoomId || !user) return;

    // Subscribe to room updates to see opponent progress
    const channel = subscribeToRoom(multiplayerRoomId, (updatedRoom) => {
      setRoom(updatedRoom);
      
      // Check if opponent just answered
      const opponent = updatedRoom.players.find(p => p.id !== String(user?.id));
      if (opponent && opponent.answers.length > prevOpponentAnswersRef.current) {
        prevOpponentAnswersRef.current = opponent.answers.length;
        // Flash indicator that opponent answered
        setOpponentAnswered(true);
        setTimeout(() => setOpponentAnswered(false), 1000);
      }
    });

    return () => {
      channel?.unsubscribe();
    };
  }, [multiplayerRoomId, user]);

  // Update our progress in Supabase
  useEffect(() => {
    if (!multiplayerRoomId || !user) return;

    updatePlayerState(multiplayerRoomId, String(user.id), {
      score,
      currentQuestion: currentQuestionIndex,
      answers: answers.map(a => a.correct ? 1 : 0),
      selectedAnswers: selectedAnswerIndices,
    });
  }, [multiplayerRoomId, user, score, currentQuestionIndex, answers, selectedAnswerIndices]);

  const currentQuestion = game.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / game.questions.length) * 100;

  // Find opponent for head-to-head display
  const opponent = room?.players.find(p => p.id !== String(user?.id));

  // Skip question (when theme is unavailable for OP_GUESS)
  const handleSkip = useCallback(() => {
    if (currentQuestionIndex < game.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer('');
    } else {
      // Last question - complete game
      onComplete({
        ...game,
        answers,
        completed: true,
        endTime: Date.now(),
      });
    }
  }, [game, currentQuestionIndex, onComplete, answers]);

  const handleAnswer = useCallback((answer: string, timeLeft: number) => {
    if (gameState !== 'playing') return;

    const isCorrect = answer === currentQuestion.correctAnswer;
    const timeTaken = (currentQuestion.timeLimit || 30) - timeLeft;
    const points = isCorrect ? currentQuestion.points : 0;
    
    // Track selected answer index for multiplayer profile picture display
    const answerIndex = currentQuestion.options?.indexOf(answer) ?? -1;
    setSelectedAnswerIndices(prev => [...prev, answerIndex]);

    const newAnswer = {
      questionId: currentQuestion.id,
      answer,
      correct: isCorrect,
      timeTaken,
      points,
    };

    if (isCorrect) {
      setScore(prev => prev + points);
    }

    setAnswers(prev => [...prev, newAnswer]);
    setGameState(answer === '' && timeLeft === 0 ? 'times-up' : 'answered');
  }, [gameState, currentQuestion]);

  // Advance to next question - in multiplayer, wait for both players
  useEffect(() => {
    if (gameState !== 'answered' && gameState !== 'times-up') return;
    
    const advanceToNext = async () => {
      if (currentQuestionIndex < game.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setGameState('playing');
        setSelectedAnswer('');
      } else {
        // Mark room as finished if multiplayer
        if (multiplayerRoomId) {
          await updateRoomState(multiplayerRoomId, 'finished', { 
            finishedAt: new Date().toISOString() 
          });
        }
        onComplete({
          ...game,
          answers,
          completed: true,
          endTime: Date.now(),
        });
      }
    };

    // In multiplayer, wait for opponent to answer before advancing
    if (multiplayerRoomId && room) {
      const opponent = room.players.find(p => p.id !== String(user?.id));
      const opponentAnsweredCurrent = opponent && opponent.answers.length > currentQuestionIndex;
      
      if (opponentAnsweredCurrent) {
        // Both answered - advance after short delay to show results
        const timer = setTimeout(advanceToNext, 1500);
        return () => clearTimeout(timer);
      }
      // Still waiting for opponent - don't advance yet
      return;
    }
    
    // Single player - advance after 2 seconds
    const timer = setTimeout(advanceToNext, 2000);
    return () => clearTimeout(timer);
  }, [gameState, currentQuestionIndex, game, answers, multiplayerRoomId, room, user, onComplete]);

  if (currentQuestionIndex >= game.questions.length) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Game Header */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/20">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="font-bold text-yellow-400">{score}</span>
            </div>
            {opponent && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 ${
                opponentAnswered 
                  ? 'bg-yellow-500/30 border-yellow-500/50 scale-105' 
                  : 'bg-red-500/20 border-red-500/20'
              }`}>
                <Users className={`w-4 h-4 ${opponentAnswered ? 'text-yellow-400' : 'text-red-400'}`} />
                <span className={`font-bold ${opponentAnswered ? 'text-yellow-400' : 'text-red-400'}`}>{opponent.score}</span>
                <span className="text-[10px] text-red-400/60 uppercase ml-1">{opponent.name}</span>
                {opponentAnswered && <span className="text-yellow-400 text-xs animate-pulse">⚡</span>}
              </div>
            )}
            <div className="text-sm text-gray-400">
              {game.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Question</span>
            <span className="px-3 py-1 rounded-lg bg-purple-500/20 text-purple-400 font-bold">
              {currentQuestionIndex + 1}/{game.questions.length}
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="relative">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-linear-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Question markers */}
          <div className="absolute top-0 left-0 right-0 h-2 flex">
            {game.questions.map((_, i) => (
              <div 
                key={i} 
                className="flex-1 flex justify-end"
              >
                {i < game.questions.length - 1 && (
                  <div className={`w-0.5 h-2 ${
                    i < currentQuestionIndex ? 'bg-purple-400' : 'bg-white/20'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          {/* Opponent Progress Marker */}
          {opponent && (
            <div 
              className="absolute top-[-4px] w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-lg transition-all duration-500 z-10"
              style={{ left: `${((opponent.currentQuestion + 1) / game.questions.length) * 100}%`, transform: 'translateX(-50%)' }}
              title={`${opponent.name}'s progress`}
            />
          )}
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-500">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-gray-400 font-mono">1-4</kbd> to select</span>
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-gray-400 font-mono">H</kbd> for hint</span>
        </div>
      </div>

      <QuestionCard 
        key={currentQuestionIndex}
        question={currentQuestion}
        onAnswer={handleAnswer}
        gameState={gameState}
        selectedAnswer={selectedAnswer}
        onSelect={setSelectedAnswer}
        onSkip={handleSkip}
        room={room}
        questionIndex={currentQuestionIndex}
        currentUserId={user?.id ? String(user.id) : undefined}
      />
    </div>
  );
}
