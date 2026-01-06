'use client';

import { useState, useEffect, useCallback } from 'react';
import { MediaListEntry } from '@/types/anilist';
import { Trophy, Delete, CornerDownLeft } from 'lucide-react';

interface WordleGameProps {
  entries: MediaListEntry[];
  onComplete: (score: number, maxScore: number, correctCount: number, totalCount: number) => void;
  onBack: () => void;
  roundCount?: number;
}

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;
const KEYBOARD_ROWS = [
  'QWERTYUIOP'.split(''),
  'ASDFGHJKL'.split(''),
  ['ENTER', ...'ZXCVBNM'.split(''), 'BACK'],
];

// Common 5-letter anime-related words (EXACTLY 5 letters each)
const ANIME_WORDS = [
  'ANIME', 'MANGA', 'OTAKU', 'KAWAI', 'CHIBI', 'BENTO', 'RAMEN',
  'NINJA', 'KOHAI', 'DANGO', 'MOCHI', 'ONSEN', 'SHOJO', 'JOSEI',
  'MECHA', 'SLICE', 'HAREM', 'MAGIC', 'DEMON', 'GHOST', 'SWORD',
  'POWER', 'TITAN', 'GUILD', 'DEATH', 'ANGEL', 'DEVIL', 'STORM',
  'FLAME', 'LIGHT', 'BLADE', 'QUEST', 'DREAM', 'HEART', 'BLOOD',
  'METAL', 'ROYAL', 'WORLD', 'SHINY', 'CURSE', 'BRAVE', 'CHAOS',
  'FAIRY', 'GIANT', 'HONOR', 'NOBLE', 'PRIDE', 'REBEL', 'SAINT',
  'SHADE', 'SHINE', 'SKILL', 'SPEED', 'SPELL', 'SPEAR', 'STAFF',
  'STEEL', 'STONE', 'ULTRA', 'UNITY', 'WITCH', 'WRATH', 'YOUTH',
];

function getRandomWord(): string {
  return ANIME_WORDS[Math.floor(Math.random() * ANIME_WORDS.length)];
}

type LetterState = 'correct' | 'present' | 'absent' | 'empty';

interface GameRound {
  word: string;
  guesses: string[];
  currentGuess: string;
  isComplete: boolean;
  isWon: boolean;
}

export function WordleGame({ onComplete, onBack, roundCount = 3 }: WordleGameProps) {
  const [rounds, setRounds] = useState<GameRound[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [shake, setShake] = useState(false);
  const [message, setMessage] = useState('');

  // Initialize rounds
  useEffect(() => {
    const newRounds: GameRound[] = Array.from({ length: roundCount }, () => ({
      word: getRandomWord(),
      guesses: [],
      currentGuess: '',
      isComplete: false,
      isWon: false,
    }));
    setRounds(newRounds);
  }, [roundCount]);

  const currentRound = rounds[currentRoundIndex];

  const getLetterState = (letter: string, position: number, guess: string): LetterState => {
    if (!currentRound) return 'empty';
    const word = currentRound.word;
    
    if (word[position] === letter) return 'correct';
    if (word.includes(letter)) return 'present';
    return 'absent';
  };

  const getKeyboardLetterState = (letter: string): LetterState => {
    if (!currentRound) return 'empty';
    
    let bestState: LetterState = 'empty';
    
    for (const guess of currentRound.guesses) {
      for (let i = 0; i < guess.length; i++) {
        if (guess[i] === letter) {
          const state = getLetterState(letter, i, guess);
          if (state === 'correct') return 'correct';
          if (state === 'present') bestState = 'present';
          if (state === 'absent' && bestState === 'empty') bestState = 'absent';
        }
      }
    }
    
    return bestState;
  };

  const submitGuess = useCallback(() => {
    if (!currentRound || currentRound.currentGuess.length !== WORD_LENGTH) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setRounds(prev => {
      const updated = [...prev];
      const round = { ...updated[currentRoundIndex] };
      round.guesses = [...round.guesses, round.currentGuess];
      
      if (round.currentGuess === round.word) {
        round.isComplete = true;
        round.isWon = true;
        const points = (MAX_GUESSES - round.guesses.length + 1) * 20;
        setScore(s => s + points);
        setMessage('Correct!');
      } else if (round.guesses.length >= MAX_GUESSES) {
        round.isComplete = true;
        round.isWon = false;
        setMessage(`The word was: ${round.word}`);
      }
      
      round.currentGuess = '';
      updated[currentRoundIndex] = round;
      return updated;
    });
  }, [currentRound, currentRoundIndex]);

  const handleKey = useCallback((key: string) => {
    if (!currentRound || currentRound.isComplete) return;

    if (key === 'ENTER') {
      submitGuess();
      return;
    }

    if (key === 'BACK') {
      setRounds(prev => {
        const updated = [...prev];
        const round = { ...updated[currentRoundIndex] };
        round.currentGuess = round.currentGuess.slice(0, -1);
        updated[currentRoundIndex] = round;
        return updated;
      });
      return;
    }

    if (currentRound.currentGuess.length < WORD_LENGTH && /^[A-Z]$/.test(key)) {
      setRounds(prev => {
        const updated = [...prev];
        const round = { ...updated[currentRoundIndex] };
        round.currentGuess = round.currentGuess + key;
        updated[currentRoundIndex] = round;
        return updated;
      });
    }
  }, [currentRound, currentRoundIndex, submitGuess]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleKey('ENTER');
      } else if (e.key === 'Backspace') {
        handleKey('BACK');
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleKey(e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKey]);

  const nextRound = () => {
    setMessage('');
    if (currentRoundIndex < rounds.length - 1) {
      setCurrentRoundIndex(i => i + 1);
    } else {
      setGameComplete(true);
      const wonCount = rounds.filter(r => r.isWon).length;
      onComplete(score, roundCount * MAX_GUESSES * 20, wonCount, roundCount);
    }
  };

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
          You got {wonCount} out of {roundCount} words
        </p>
        <div className="text-4xl font-bold text-purple-400 mb-8">{score} points</div>
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
        >
          Back to Games
        </button>
      </div>
    );
  }

  const allGuesses = [...currentRound.guesses];
  if (currentRound.currentGuess) {
    allGuesses.push(currentRound.currentGuess.padEnd(WORD_LENGTH, ' '));
  }
  while (allGuesses.length < MAX_GUESSES) {
    allGuesses.push('     ');
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-gray-400">Round {currentRoundIndex + 1} of {rounds.length}</span>
        <span className="text-purple-400 font-bold">Score: {score}</span>
      </div>

      {/* Grid */}
      <div className={`space-y-2 ${shake ? 'animate-shake' : ''}`}>
        {allGuesses.map((guess, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-2">
            {guess.split('').map((letter, colIndex) => {
              const isRevealed = rowIndex < currentRound.guesses.length;
              const state = isRevealed ? getLetterState(letter, colIndex, guess) : 'empty';
              
              return (
                <div
                  key={colIndex}
                  className={`w-14 h-14 flex items-center justify-center text-2xl font-bold rounded-lg border-2 transition-all ${
                    state === 'correct' ? 'bg-green-500 border-green-500 text-white' :
                    state === 'present' ? 'bg-yellow-500 border-yellow-500 text-white' :
                    state === 'absent' ? 'bg-gray-600 border-gray-600 text-white' :
                    letter !== ' ' ? 'border-white/30 text-white' : 'border-white/10'
                  }`}
                >
                  {letter !== ' ' ? letter : ''}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div className={`text-center text-lg font-bold ${currentRound.isWon ? 'text-green-400' : 'text-red-400'}`}>
          {message}
        </div>
      )}

      {/* Keyboard or Next button */}
      {currentRound.isComplete ? (
        <div className="text-center">
          <button
            onClick={nextRound}
            className="px-8 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold transition-colors"
          >
            {currentRoundIndex < rounds.length - 1 ? 'Next Word' : 'See Results'}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {KEYBOARD_ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-1">
              {row.map(key => {
                const state = key.length === 1 ? getKeyboardLetterState(key) : 'empty';
                const isWide = key === 'ENTER' || key === 'BACK';
                
                return (
                  <button
                    key={key}
                    onClick={() => handleKey(key)}
                    className={`${isWide ? 'px-4' : 'w-10'} h-12 rounded-lg font-bold text-sm transition-all ${
                      state === 'correct' ? 'bg-green-500 text-white' :
                      state === 'present' ? 'bg-yellow-500 text-white' :
                      state === 'absent' ? 'bg-gray-600 text-gray-400' :
                      'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    {key === 'BACK' ? <Delete className="w-5 h-5 mx-auto" /> :
                     key === 'ENTER' ? <CornerDownLeft className="w-5 h-5 mx-auto" /> : key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

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
