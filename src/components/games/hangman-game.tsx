'use client';

import { useState, useEffect, useCallback } from 'react';
import { MediaListEntry } from '@/types/anilist';
import { Check, X, RotateCcw, Trophy, Skull } from 'lucide-react';

interface HangmanGameProps {
  entries: MediaListEntry[];
  onComplete: (score: number, maxScore: number, correctCount: number, totalCount: number) => void;
  onBack: () => void;
  questionCount?: number;
}

interface HangmanRound {
  answer: string;
  displayTitle: string;
  coverImage: string;
  guessedLetters: Set<string>;
  wrongGuesses: number;
  isComplete: boolean;
  isWon: boolean;
}

const MAX_WRONG_GUESSES = 6;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function normalizeTitle(title: string): string {
  // Remove special characters but keep letters and spaces
  return title.toUpperCase().replace(/[^A-Z\s]/g, '');
}

export function HangmanGame({ entries, onComplete, onBack, questionCount = 5 }: HangmanGameProps) {
  const [rounds, setRounds] = useState<HangmanRound[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [score, setScore] = useState(0);

  // Initialize rounds
  useEffect(() => {
    const shuffled = [...entries].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, questionCount).filter(e => e.media?.title);
    
    const newRounds: HangmanRound[] = selected.map(entry => {
      const title = entry.media?.title.english || entry.media?.title.romaji || '';
      return {
        answer: normalizeTitle(title),
        displayTitle: title,
        coverImage: entry.media?.coverImage?.large || '',
        guessedLetters: new Set<string>(),
        wrongGuesses: 0,
        isComplete: false,
        isWon: false,
      };
    });
    
    setRounds(newRounds);
  }, [entries, questionCount]);

  const currentRound = rounds[currentRoundIndex];

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
        setScore(s => s + Math.max(0, (MAX_WRONG_GUESSES - round.wrongGuesses) * 10));
      } else if (round.wrongGuesses >= MAX_WRONG_GUESSES) {
        round.isComplete = true;
        round.isWon = false;
      }

      updated[currentRoundIndex] = round;
      return updated;
    });
  }, [currentRound, currentRoundIndex]);

  const nextRound = () => {
    if (currentRoundIndex < rounds.length - 1) {
      setCurrentRoundIndex(i => i + 1);
    } else {
      setGameComplete(true);
      const wonCount = rounds.filter(r => r.isWon).length;
      onComplete(score, questionCount * MAX_WRONG_GUESSES * 10, wonCount, questionCount);
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

  const displayWord = currentRound.answer.split('').map((char, i) => {
    if (char === ' ') return ' ';
    return currentRound.guessedLetters.has(char) ? char : '_';
  }).join('');

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-gray-400">Round {currentRoundIndex + 1} of {rounds.length}</span>
        <span className="text-purple-400 font-bold">Score: {score}</span>
      </div>

      {/* Hangman Display */}
      <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center">
        <h3 className="text-lg text-gray-400 mb-4">Guess the Anime Title</h3>
        
        {/* Wrong guesses indicator */}
        <div className="flex justify-center gap-2 mb-6">
          {Array.from({ length: MAX_WRONG_GUESSES }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full ${
                i < currentRound.wrongGuesses ? 'bg-red-500' : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Word display */}
        <div className="text-4xl font-mono font-bold text-white tracking-widest mb-8 break-all">
          {displayWord}
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
