'use client';

import { useState, useEffect, useCallback } from 'react';
import { MediaListEntry, GameSession, GameQuestion, Media } from '@/types/anilist';
import { Check, Trophy, Skull } from 'lucide-react';

interface HangmanGameProps {
  entries: MediaListEntry[];
  onComplete: (session: GameSession) => void;
  onBack: () => void;
  questionCount?: number;
  activeType?: 'ANIME' | 'MANGA';
  // Configurable settings from user feedback
  maxWrongGuesses?: number; // Default 6
  timeLimit?: number; // Seconds per round, 0 = no limit
}

interface HangmanRound {
  media: Media;
  answer: string;
  displayTitle: string;
  coverImage: string;
  guessedLetters: Set<string>;
  wrongGuesses: number;
  isComplete: boolean;
  isWon: boolean;
  timeRemaining?: number;
}

const DEFAULT_maxWrongGuesses = 6;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function normalizeTitle(title: string): string {
  // Remove special characters but keep letters and spaces
  return title.toUpperCase().replace(/[^A-Z\s]/g, '');
}

export function HangmanGame({ 
  entries, 
  onComplete, 
  onBack, 
  questionCount = 5, 
  activeType = 'ANIME',
  maxWrongGuesses = DEFAULT_maxWrongGuesses,
  timeLimit = 0, // 0 = no time limit
}: HangmanGameProps) {
  const [startTime] = useState(() => Date.now());
  const [rounds, setRounds] = useState<HangmanRound[]>(() => {
    const shuffled = [...entries].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, questionCount).filter(e => e.media?.title);
    
    return selected.map(entry => {
      const media = entry.media!;
      const title = media.title.english || media.title.romaji || '';
      return {
        media,
        answer: normalizeTitle(title),
        displayTitle: title,
        coverImage: media.coverImage?.large || '',
        guessedLetters: new Set<string>(),
        wrongGuesses: 0,
        isComplete: false,
        isWon: false,
      };
    });
  });
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);

  const currentRound = rounds[currentRoundIndex];

  // Reset timer when round changes
  useEffect(() => {
    if (timeLimit > 0) {
      setTimeRemaining(timeLimit);
    }
  }, [currentRoundIndex, timeLimit]);

  // Timer countdown effect
  useEffect(() => {
    if (timeLimit === 0 || currentRound?.isComplete) return;
    if (timeRemaining <= 0) {
      // Time's up - mark round as lost
      setRounds(prevRounds => {
        const updated = [...prevRounds];
        if (!updated[currentRoundIndex].isComplete) {
          updated[currentRoundIndex] = { 
            ...updated[currentRoundIndex], 
            isComplete: true, 
            isWon: false 
          };
        }
        return updated;
      });
      return;
    }

    const timer = setTimeout(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeRemaining, timeLimit, currentRound?.isComplete, currentRoundIndex]);

  const guessLetter = useCallback((letter: string) => {
    if (!currentRound || currentRound.isComplete) return;
    if (currentRound.guessedLetters.has(letter)) return;

    setRounds(prev => {
      const updated = [...prev];
      const round = { ...updated[currentRoundIndex] };
      round.guessedLetters = new Set(round.guessedLetters);
      round.guessedLetters.add(letter);

      if (!round.answer.includes(letter)) {
        round.wrongGuesses++;
      }

      // Check if won (all letters guessed)
      const allGuessed = round.answer.split('').every(
        char => char === ' ' || round.guessedLetters.has(char)
      );

      if (allGuessed) {
        round.isComplete = true;
        round.isWon = true;
        setScore(s => s + Math.max(0, (maxWrongGuesses - round.wrongGuesses) * 10));
      } else if (round.wrongGuesses >= maxWrongGuesses) {
        round.isComplete = true;
        round.isWon = false;
      }

      updated[currentRoundIndex] = round;
      return updated;
    });
  }, [currentRound, currentRoundIndex, maxWrongGuesses]);

  const nextRound = () => {
    if (currentRoundIndex < rounds.length - 1) {
      setCurrentRoundIndex(i => i + 1);
    } else {
      setGameComplete(true);
      
      // Create GameSession for results
      const questions: GameQuestion[] = rounds.map((r, i) => ({
        id: `hangman-${i}`,
        type: 'HANGMAN',
        media: r.media,
        difficulty: 'MEDIUM',
        question: 'Guess the title',
        correctAnswer: r.displayTitle,
        points: maxWrongGuesses * 10,
        timeLimit: 0,
      }));

      const answers = rounds.map((r, i) => ({
        questionId: `hangman-${i}`,
        answer: r.isWon ? r.displayTitle : 'Given Up',
        correct: r.isWon,
        timeTaken: 0,
        points: r.isWon ? Math.max(0, (maxWrongGuesses - r.wrongGuesses) * 10) : 0,
      }));

      const session: GameSession = {
        id: `hangman-${Date.now()}`,
        type: 'hangman',
        questions,
        currentQuestionIndex: rounds.length - 1,
        score,
        answers,
        startTime: startTime,
        endTime: Date.now(),
        completed: true,
      };

      onComplete(session);
    }
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const letter = e.key.toUpperCase();
      if (ALPHABET.includes(letter)) {
        guessLetter(letter);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [guessLetter]);

  if (rounds.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (gameComplete) {
    const wonCount = rounds.filter(r => r.isWon).length;
    return (
      <div className="max-w-2xl mx-auto p-8 rounded-2xl bg-white/5 border border-white/10 text-center">
        <div className="w-20 h-20 rounded-2xl bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
          <Trophy className="w-10 h-10 text-yellow-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Game Complete!</h2>
        <p className="text-gray-400 mb-6">
          You got {wonCount} out of {questionCount} correct
        </p>
        <div className="text-4xl font-bold text-purple-400 mb-8">{score} points</div>
        <div className="flex gap-4 justify-center">
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

  // displayWord no longer needed - using word-aware display with individual spans

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-gray-400">Round {currentRoundIndex + 1} of {rounds.length}</span>
        {/* Timer display when timeLimit is set */}
        {timeLimit > 0 && !currentRound.isComplete && (
          <span className={`font-bold ${timeRemaining <= 10 ? 'text-red-400 animate-pulse' : 'text-yellow-400'}`}>
            ⏱️ {timeRemaining}s
          </span>
        )}
        <span className="text-purple-400 font-bold">Score: {score}</span>
      </div>

      {/* Hangman Display */}
      <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center">
        <h3 className="text-lg text-gray-400 mb-4">Guess the {activeType === 'ANIME' ? 'Anime' : 'Manga'} Title</h3>
        
        {/* Wrong guesses indicator */}
        <div className="flex justify-center gap-2 mb-6">
          {Array.from({ length: maxWrongGuesses }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full ${
                i < currentRound.wrongGuesses ? 'bg-red-500' : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Word display - improved for mobile with word-aware breaks */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-8">
          {currentRound.answer.split(' ').map((word, wordIndex) => (
            <div key={wordIndex} className="flex gap-1">
              {word.split('').map((char, charIndex) => (
                <span 
                  key={charIndex}
                  className="text-2xl md:text-4xl font-mono font-bold text-white w-6 md:w-8 text-center border-b-2 border-white/30"
                >
                  {currentRound.guessedLetters.has(char) ? char : '\u00A0'}
                </span>
              ))}
            </div>
          ))}
        </div>

        {/* Result overlay */}
        {currentRound.isComplete && (
          <div className={`p-4 rounded-xl mb-6 ${currentRound.isWon ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              {currentRound.isWon ? (
                <Check className="w-6 h-6 text-green-400" />
              ) : (
                <Skull className="w-6 h-6 text-red-400" />
              )}
              <span className={`text-lg font-bold ${currentRound.isWon ? 'text-green-400' : 'text-red-400'}`}>
                {currentRound.isWon ? 'Correct!' : 'Game Over'}
              </span>
            </div>
            <p className="text-white">{currentRound.displayTitle}</p>
          </div>
        )}

        {/* Keyboard */}
        {!currentRound.isComplete && (
          <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
            {ALPHABET.map(letter => {
              const isGuessed = currentRound.guessedLetters.has(letter);
              const isCorrect = isGuessed && currentRound.answer.includes(letter);
              const isWrong = isGuessed && !currentRound.answer.includes(letter);
              
              return (
                <button
                  key={letter}
                  onClick={() => guessLetter(letter)}
                  disabled={isGuessed}
                  className={`w-10 h-10 rounded-lg font-bold transition-all ${
                    isCorrect ? 'bg-green-500 text-white' :
                    isWrong ? 'bg-red-500/50 text-red-300' :
                    isGuessed ? 'bg-white/10 text-gray-500' :
                    'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        )}

        {/* Next button */}
        {currentRound.isComplete && (
          <button
            onClick={nextRound}
            className="mt-6 px-8 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold transition-colors"
          >
            {currentRoundIndex < rounds.length - 1 ? 'Next Round' : 'See Results'}
          </button>
        )}
      </div>

      {/* Back button */}
      <button
        onClick={onBack}
        className="text-gray-400 hover:text-white transition-colors"
      >
        ← Back to Games
      </button>
    </div>
  );
}
