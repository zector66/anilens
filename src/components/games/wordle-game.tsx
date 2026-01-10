'use client';

import { useState, useEffect, useCallback } from 'react';
import { MediaListEntry, GameSession, GameQuestion } from '@/types/anilist';
import { Trophy, Delete, CornerDownLeft } from 'lucide-react';

interface WordleGameProps {
  entries: MediaListEntry[];
  onComplete: (session: GameSession) => void;
  onBack: () => void;
  roundCount?: number;
  activeType?: 'ANIME' | 'MANGA';
}

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;
const KEYBOARD_ROWS = [
  'QWERTYUIOP'.split(''),
  'ASDFGHJKL'.split(''),
  ['ENTER', ...'ZXCVBNM'.split(''), 'BACK'],
];

// Common 5-letter anime-related words (EXACTLY 5 letters each) - used as answers
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

// Valid 5-letter words for guessing (expanded dictionary)
const VALID_WORDS = new Set([
  ...ANIME_WORDS,
  // Common English 5-letter words
  'ABOUT', 'ABOVE', 'ABUSE', 'ACTOR', 'ACUTE', 'ADMIT', 'ADOPT', 'ADULT', 'AFTER', 'AGAIN',
  'AGENT', 'AGREE', 'AHEAD', 'ALARM', 'ALBUM', 'ALERT', 'ALIKE', 'ALIVE', 'ALLOW', 'ALONE',
  'ALONG', 'ALTER', 'AMONG', 'ANGER', 'ANGLE', 'ANGRY', 'APART', 'APPLE', 'APPLY', 'ARENA',
  'ARGUE', 'ARISE', 'ARMOR', 'ARROW', 'ASIDE', 'ASSET', 'AVOID', 'AWARD', 'AWARE', 'AWFUL',
  'BASIC', 'BEACH', 'BEAST', 'BEGIN', 'BEING', 'BELOW', 'BENCH', 'BLACK', 'BLAME', 'BLANK',
  'BLAST', 'BLAZE', 'BLEND', 'BLESS', 'BLIND', 'BLOCK', 'BLOOM', 'BOARD', 'BOOST', 'BRAIN',
  'BRAND', 'BREAD', 'BREAK', 'BREED', 'BRICK', 'BRIDE', 'BRIEF', 'BRING', 'BROAD', 'BROKE',
  'BROWN', 'BUILD', 'BUNCH', 'BURST', 'BUYER', 'CABIN', 'CABLE', 'CANDY', 'CARGO', 'CARRY',
  'CATCH', 'CAUSE', 'CHAIN', 'CHAIR', 'CHARM', 'CHART', 'CHASE', 'CHEAP', 'CHECK', 'CHEST',
  'CHIEF', 'CHILD', 'CHINA', 'CHOIR', 'CHOSE', 'CHUNK', 'CIVIL', 'CLAIM', 'CLASS', 'CLEAN',
  'CLEAR', 'CLIMB', 'CLOCK', 'CLOSE', 'CLOTH', 'CLOUD', 'COACH', 'COAST', 'COLOR', 'COUCH',
  'COULD', 'COUNT', 'COURT', 'COVER', 'CRAFT', 'CRASH', 'CRAZY', 'CREAM', 'CRIME', 'CROSS',
  'CROWD', 'CROWN', 'CRUEL', 'CRUSH', 'CYCLE', 'DAILY', 'DANCE', 'DEPTH', 'DIRTY', 'DOUBT',
  'DOZEN', 'DRAFT', 'DRAIN', 'DRAMA', 'DRANK', 'DRAWN', 'DRESS', 'DRIFT', 'DRILL', 'DRINK',
  'DRIVE', 'DROWN', 'DYING', 'EAGER', 'EARLY', 'EARTH', 'EIGHT', 'ELITE', 'EMPTY', 'ENEMY',
  'ENJOY', 'ENTER', 'ENTRY', 'EQUAL', 'ERROR', 'EVENT', 'EVERY', 'EXACT', 'EXIST', 'EXTRA',
  'FAITH', 'FALSE', 'FANCY', 'FAULT', 'FAVOR', 'FEAST', 'FIELD', 'FIFTH', 'FIFTY', 'FIGHT',
  'FINAL', 'FIRST', 'FIXED', 'FLASH', 'FLEET', 'FLESH', 'FLOAT', 'FLOOD', 'FLOOR', 'FLOUR',
  'FLUID', 'FLUSH', 'FOCUS', 'FORCE', 'FORGE', 'FORTH', 'FORTY', 'FORUM', 'FOUND', 'FRAME',
  'FRANK', 'FRAUD', 'FRESH', 'FRONT', 'FROST', 'FRUIT', 'FULLY', 'FUNNY', 'GENRE', 'GHOST',
  'GIVEN', 'GLASS', 'GLEAM', 'GLOBE', 'GLORY', 'GLOSS', 'GOING', 'GRACE', 'GRADE', 'GRAIN',
  'GRAND', 'GRANT', 'GRAPE', 'GRASP', 'GRASS', 'GRAVE', 'GREAT', 'GREEN', 'GRIEF', 'GRILL',
  'GRIND', 'GROSS', 'GROUP', 'GROVE', 'GROWN', 'GUARD', 'GUESS', 'GUEST', 'GUIDE', 'GUILT',
  'HAPPY', 'HARSH', 'HASN\'T', 'HASTE', 'HAVEN', 'HEARD', 'HEAVY', 'HELLO', 'HENCE', 'HORSE',
  'HOTEL', 'HOURS', 'HOUSE', 'HUMAN', 'HUMOR', 'HURRY', 'IDEAL', 'IMAGE', 'IMPLY', 'INDEX',
  'INNER', 'INPUT', 'INTRO', 'ISSUE', 'JAPAN', 'JOINT', 'JONES', 'JUDGE', 'JUICE', 'JUMBO',
  'KEEPS', 'KNOCK', 'KNOWN', 'LABEL', 'LABOR', 'LACKS', 'LARGE', 'LASER', 'LATER', 'LAUGH',
  'LAYER', 'LEARN', 'LEASE', 'LEAST', 'LEAVE', 'LEGAL', 'LEMON', 'LEVEL', 'LEVER', 'LIMIT',
  'LIVES', 'LOCAL', 'LOGIC', 'LOOSE', 'LOTUS', 'LOVER', 'LOWER', 'LOYAL', 'LUCKY', 'LUNCH',
  'LYING', 'MAGIC', 'MAJOR', 'MAKER', 'MANOR', 'MAPLE', 'MARCH', 'MATCH', 'MAYBE', 'MAYOR',
  'MEANT', 'MEDAL', 'MEDIA', 'MERCY', 'MERGE', 'MERIT', 'MERRY', 'MIGHT', 'MINOR', 'MINUS',
  'MIXED', 'MODEL', 'MONEY', 'MONTH', 'MORAL', 'MOTOR', 'MOUNT', 'MOUSE', 'MOUTH', 'MOVED',
  'MOVIE', 'MUSIC', 'NAKED', 'NAVAL', 'NERVE', 'NEVER', 'NEWLY', 'NIGHT', 'NINTH', 'NOISE',
  'NORTH', 'NOTED', 'NOVEL', 'NURSE', 'OCCUR', 'OCEAN', 'OFFER', 'OFTEN', 'OLIVE', 'ONSET',
  'OPERA', 'ORDER', 'OTHER', 'OUGHT', 'OUTER', 'OWNER', 'OXIDE', 'OZONE', 'PAINT', 'PANEL',
  'PANIC', 'PAPER', 'PARTY', 'PASTA', 'PASTE', 'PATCH', 'PAUSE', 'PEACE', 'PEARL', 'PENNY',
  'PHASE', 'PHONE', 'PHOTO', 'PIANO', 'PIECE', 'PILOT', 'PINCH', 'PITCH', 'PLACE', 'PLAIN',
  'PLANE', 'PLANT', 'PLATE', 'PLAZA', 'PLEAD', 'PLIGHT', 'PLUMB', 'PLUMP', 'POINT', 'POLAR',
  'POLISHED', 'POUND', 'PRESS', 'PRICE', 'PRIME', 'PRINT', 'PRIOR', 'PRIZE', 'PROBE', 'PROOF',
  'PROUD', 'PROVE', 'PROXY', 'PUPIL', 'PURSE', 'QUEEN', 'QUICK', 'QUIET', 'QUITE', 'QUOTE',
  'RADAR', 'RADIO', 'RAISE', 'RALLY', 'RANCH', 'RANGE', 'RAPID', 'RATIO', 'REACH', 'REACT',
  'READY', 'REALM', 'REFER', 'REIGN', 'RELAX', 'REPLY', 'RIDER', 'RIDGE', 'RIFLE', 'RIGHT',
  'RISKY', 'RIVAL', 'RIVER', 'ROBOT', 'ROCKY', 'ROMAN', 'ROUGE', 'ROUGH', 'ROUND', 'ROUTE',
  'ROYAL', 'RUGBY', 'RULER', 'RURAL', 'SADLY', 'SAFER', 'SALAD', 'SALON', 'SANDY', 'SCALE',
  'SCARE', 'SCENE', 'SCENT', 'SCOPE', 'SCORE', 'SCOUT', 'SCREW', 'SEIZE', 'SENSE', 'SERVE',
  'SEVEN', 'SHADE', 'SHAKE', 'SHALL', 'SHAME', 'SHAPE', 'SHARE', 'SHARK', 'SHARP', 'SHELF',
  'SHELL', 'SHIFT', 'SHIRT', 'SHOCK', 'SHOOT', 'SHORE', 'SHORT', 'SHOUT', 'SHOWN', 'SIGHT',
  'SIGMA', 'SILLY', 'SINCE', 'SIXTH', 'SIXTY', 'SIZED', 'SKIRT', 'SKULL', 'SLAVE', 'SLEEP',
  'SLICE', 'SLIDE', 'SLOPE', 'SMALL', 'SMART', 'SMELL', 'SMILE', 'SMOKE', 'SNAKE', 'SNEAK',
  'SOLAR', 'SOLID', 'SOLVE', 'SORRY', 'SOUND', 'SOUTH', 'SPACE', 'SPARE', 'SPARK', 'SPEAK',
  'SPEND', 'SPENT', 'SPIKE', 'SPINE', 'SPITE', 'SPLIT', 'SPOKE', 'SPORT', 'SPRAY', 'SQUAD',
  'STACK', 'STAGE', 'STAIN', 'STAKE', 'STAMP', 'STAND', 'STARK', 'START', 'STATE', 'STEAM',
  'STEEP', 'STEER', 'STICK', 'STILL', 'STOCK', 'STORE', 'STORM', 'STORY', 'STOVE', 'STRAP',
  'STRAW', 'STRIP', 'STUCK', 'STUDY', 'STUFF', 'STYLE', 'SUGAR', 'SUITE', 'SUNNY', 'SUPER',
  'SURGE', 'SWAMP', 'SWEAR', 'SWEAT', 'SWEEP', 'SWEET', 'SWELL', 'SWIFT', 'SWING', 'TABLE',
  'TASTE', 'TEACH', 'TEETH', 'TEMPO', 'TENSE', 'TERMS', 'TEXAS', 'THANK', 'THEFT', 'THEIR',
  'THEME', 'THERE', 'THESE', 'THICK', 'THIEF', 'THING', 'THINK', 'THIRD', 'THOSE', 'THREE',
  'THREW', 'THROW', 'THUMB', 'TIGER', 'TIGHT', 'TIMER', 'TIRED', 'TITLE', 'TODAY', 'TOKEN',
  'TOKYO', 'TONAL', 'TOPIC', 'TOTAL', 'TOUCH', 'TOUGH', 'TOWER', 'TRACK', 'TRADE', 'TRAIL',
  'TRAIN', 'TRAIT', 'TRASH', 'TREAT', 'TREND', 'TRIAL', 'TRIBE', 'TRICK', 'TRIED', 'TRUCK',
  'TRULY', 'TRUMP', 'TRUNK', 'TRUST', 'TRUTH', 'TWICE', 'TWIST', 'TYPED', 'UNCLE', 'UNDER',
  'UNION', 'UNITE', 'UNTIL', 'UPPER', 'UPSET', 'URBAN', 'USAGE', 'USUAL', 'VALID', 'VALUE',
  'VAULT', 'VIDEO', 'VIRUS', 'VISIT', 'VITAL', 'VIVID', 'VOCAL', 'VOICE', 'VOTER', 'WAGON',
  'WAIST', 'WASTE', 'WATCH', 'WATER', 'WEIGH', 'WEIRD', 'WHALE', 'WHEAT', 'WHEEL', 'WHERE',
  'WHICH', 'WHILE', 'WHITE', 'WHOLE', 'WHOSE', 'WIDTH', 'WOMAN', 'WOMEN', 'WOODS', 'WORLD',
  'WORRY', 'WORSE', 'WORST', 'WORTH', 'WOULD', 'WOUND', 'WRIST', 'WRITE', 'WRONG', 'WROTE',
  'YIELD', 'YOUNG', 'YOURS', 'ZEBRA', 'ZEROS', 'ZONES',
]);

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
  startTime: number; // When this round started
  completionTime?: number; // Time taken to complete (ms)
}

export function WordleGame({ onComplete, onBack, roundCount = 3, activeType = 'ANIME' }: WordleGameProps) {
  const [startTime] = useState(() => Date.now());
  const [rounds, setRounds] = useState<GameRound[]>(() => 
    Array.from({ length: roundCount }, (_, i) => ({
      word: getRandomWord(),
      guesses: [],
      currentGuess: '',
      isComplete: false,
      isWon: false,
      startTime: i === 0 ? Date.now() : 0, // First round starts immediately
    }))
  );
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [shake, setShake] = useState(false);
  const [message, setMessage] = useState('');

  // No longer need useEffect for initialization

  const currentRound = rounds[currentRoundIndex];

  const getLetterState = (letter: string, position: number): LetterState => {
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
          const state = getLetterState(letter, i);
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

    // Validate guess against dictionary
    if (!VALID_WORDS.has(currentRound.currentGuess)) {
      setShake(true);
      setMessage('Not a valid word');
      setTimeout(() => {
        setShake(false);
        setMessage('');
      }, 1500);
      return;
    }

    setRounds(prev => {
      const updated = [...prev];
      const round = { ...updated[currentRoundIndex] };
      round.guesses = [...round.guesses, round.currentGuess];
      
      if (round.currentGuess === round.word) {
        round.isComplete = true;
        round.isWon = true;
        round.completionTime = Date.now() - round.startTime; // Track completion time
        const points = (MAX_GUESSES - round.guesses.length + 1) * 20;
        setScore(s => s + points);
        setMessage('Correct!');
      } else if (round.guesses.length >= MAX_GUESSES) {
        round.isComplete = true;
        round.isWon = false;
        round.completionTime = Date.now() - round.startTime; // Track completion time
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
      // Start timer for next round
      setRounds(prev => {
        const updated = [...prev];
        updated[currentRoundIndex + 1] = {
          ...updated[currentRoundIndex + 1],
          startTime: Date.now(),
        };
        return updated;
      });
      setCurrentRoundIndex(i => i + 1);
    } else {
      setGameComplete(true);
      
      // Create GameSession for results
      const questions: GameQuestion[] = rounds.map((r, i) => ({
        id: `wordle-${i}`,
        type: 'WORDLE',
        difficulty: 'MEDIUM',
        question: 'Guess the word',
        correctAnswer: r.word,
        points: MAX_GUESSES * 20,
        timeLimit: 0,
      }));

      const answers = rounds.map((r, i) => ({
        questionId: `wordle-${i}`,
        answer: r.guesses[r.guesses.length - 1] || 'Given Up',
        correct: r.isWon,
        timeTaken: r.completionTime ? Math.round(r.completionTime / 1000) : 0, // Use actual completion time
        points: r.isWon ? (MAX_GUESSES - r.guesses.length + 1) * 20 : 0,
      }));

      const session: GameSession = {
        id: `wordle-${Date.now()}`,
        type: 'wordle',
        questions,
        currentQuestionIndex: rounds.length - 1,
        score,
        answers,
        startTime,
        endTime: Date.now(),
        completed: true,
      };

      onComplete(session);
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

      <div className="text-center">
        <h3 className="text-lg text-gray-400">Guess the {activeType === 'ANIME' ? 'Anime' : 'Manga'} Word</h3>
      </div>

      {/* Grid */}
      <div className={`space-y-2 ${shake ? 'animate-shake' : ''}`}>
        {allGuesses.map((guess, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-2">
            {guess.split('').map((letter, colIndex) => {
              const isRevealed = rowIndex < currentRound.guesses.length;
              const state = isRevealed ? getLetterState(letter, colIndex) : 'empty';
              
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
