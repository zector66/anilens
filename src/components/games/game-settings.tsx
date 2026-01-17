'use client';

import { useState } from 'react';
import { 
  Settings, 
  Clock, 
  Hash, 
  Zap, 
  Play, 
  X,
  ChevronDown,
  Info
} from 'lucide-react';

export interface GameSettings {
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  timeLimit: 'relaxed' | 'normal' | 'speed' | 'custom';
  customTimeSeconds?: number;
  showHints: boolean;
  shuffleOptions: boolean;
  // OP/ED specific
  themeMode?: 'openings' | 'endings' | 'mix';
  // P3-12: Format filters for OP/ED games
  includeTV?: boolean;
  includeMovies?: boolean;
  includeOVA?: boolean;
  includeONA?: boolean;
  includeSpecials?: boolean;
  // Bracket specific
  bracketSize?: 8 | 16 | 32 | 64 | 128;
  bracketCategory?: 'anime' | 'manga' | 'characters' | 'openings' | 'endings';
  bracketGenre?: string;
  // Bracket personalization (new)
  bracketSeedMode?: 'random' | 'by-rating' | 'by-popularity';
  bracketStatusFilter?: 'completed-only' | 'completed-dropped' | 'all';
  // Bracket format filters
  bracketIncludeTV?: boolean;
  bracketIncludeMovies?: boolean;
  bracketIncludeOVA?: boolean;
  bracketIncludeONA?: boolean;
  bracketIncludeSpecials?: boolean;
  bracketMinEpisodes?: number;
}

const DEFAULT_SETTINGS: GameSettings = {
  questionCount: 10,
  difficulty: 'mixed',
  timeLimit: 'normal',
  showHints: true,
  shuffleOptions: true,
};

interface GameSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (settings: GameSettings) => void;
  gameTitle: string;
  gameDescription: string;
  maxQuestions: number;
  gameType?: string;
}

export function GameSettingsModal({
  isOpen,
  onClose,
  onStart,
  gameTitle,
  gameDescription,
  maxQuestions,
  gameType,
}: GameSettingsModalProps) {
  const [settings, setSettings] = useState<GameSettings>({
    ...DEFAULT_SETTINGS,
    themeMode: 'mix',
    bracketSize: 16,
    bracketCategory: gameType === 'bracket-manga' ? 'manga' : 'anime',
    bracketSeedMode: 'random',
    bracketStatusFilter: 'completed-only',
    // P3-12: Default format filters (TV only by default)
    includeTV: true,
    includeMovies: false,
    includeOVA: false,
    includeONA: false,
    includeSpecials: false,
    // Bracket format filters (all enabled by default)
    bracketIncludeTV: true,
    bracketIncludeMovies: true,
    bracketIncludeOVA: true,
    bracketIncludeONA: true,
    bracketIncludeSpecials: true,
    bracketMinEpisodes: 1,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isOpGame = gameType === 'op-guessing';
  const isBracketGame = gameType?.startsWith('bracket-');

  if (!isOpen) return null;

  const questionOptions = [5, 10, 15, 20, 25].filter(n => n <= maxQuestions);
  if (maxQuestions > 25) questionOptions.push(maxQuestions);

  const difficultyOptions = [
    { 
      id: 'easy', 
      label: 'Easy', 
      description: 'Recent & popular titles you know well',
      color: 'bg-green-500/20 text-green-400 border-green-500/30'
    },
    { 
      id: 'medium', 
      label: 'Medium', 
      description: 'Mix of familiar and challenging',
      color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    },
    { 
      id: 'hard', 
      label: 'Hard', 
      description: 'Older, obscure, or less popular titles',
      color: 'bg-red-500/20 text-red-400 border-red-500/30'
    },
    { 
      id: 'mixed', 
      label: 'Mixed', 
      description: 'Random difficulty for each question',
      color: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    },
  ];

  const timeOptions = [
    { id: 'relaxed', label: 'Relaxed', seconds: 45, description: 'Take your time' },
    { id: 'normal', label: 'Normal', seconds: 30, description: 'Standard pace' },
    { id: 'speed', label: 'Speed Run', seconds: 15, description: 'Quick thinking!' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-900 rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-white/10 p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Settings className="w-6 h-6 text-purple-400" />
                Game Settings
              </h2>
              <p className="text-gray-400 text-sm mt-1">{gameTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Game Description */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-gray-300 text-sm">{gameDescription}</p>
          </div>

          {/* OP/ED Mode Selection (for op-guessing game) */}
          {isOpGame && (
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-white font-medium">
                🎵 Theme Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'openings', label: 'Openings Only', icon: '🎬' },
                  { id: 'endings', label: 'Endings Only', icon: '🎭' },
                  { id: 'mix', label: 'Mix Both', icon: '🎵' },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSettings({ ...settings, themeMode: option.id as 'openings' | 'endings' | 'mix' })}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      settings.themeMode === option.id
                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{option.icon}</span>
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* P3-12: Format Filters (for op-guessing game) */}
          {isOpGame && (
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-white font-medium">
                📺 Include Formats
              </label>
              <p className="text-xs text-gray-500 -mt-1">Select which anime formats to include in questions</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'includeTV', label: 'TV Series', default: true },
                  { id: 'includeMovies', label: 'Movies', default: false },
                  { id: 'includeOVA', label: 'OVA', default: false },
                  { id: 'includeONA', label: 'ONA', default: false },
                  { id: 'includeSpecials', label: 'Specials', default: false },
                ].map((format) => (
                  <button
                    key={format.id}
                    onClick={() => setSettings({ 
                      ...settings, 
                      [format.id]: !settings[format.id as keyof GameSettings] 
                    })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      settings[format.id as keyof GameSettings]
                        ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300'
                        : 'bg-white/5 border border-white/10 text-gray-500 hover:border-white/20'
                    }`}
                  >
                    {settings[format.id as keyof GameSettings] ? '✓ ' : ''}{format.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-600">
                💡 Movies and shorts often have unique OPs/EDs that are harder to recognize
              </p>
            </div>
          )}

          {/* Bracket Battle Settings */}
          {isBracketGame && (
            <>
              {/* Bracket Size */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-white font-medium">
                  🏆 Bracket Size
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {([8, 16, 32, 64, 128] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => setSettings({ ...settings, bracketSize: size })}
                      className={`py-3 rounded-xl font-bold transition-all ${
                        settings.bracketSize === size
                          ? 'bg-purple-500 text-white scale-105'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  {settings.bracketSize === 8 && '3 rounds to crown a champion'}
                  {settings.bracketSize === 16 && '4 rounds to crown a champion'}
                  {settings.bracketSize === 32 && '5 rounds to crown a champion'}
                  {settings.bracketSize === 64 && '6 rounds to crown a champion'}
                  {settings.bracketSize === 128 && '7 rounds to crown a champion (epic!)'}
                </p>
              </div>

              {/* Seed Mode */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-white font-medium">
                  🎲 Seed Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'random', label: 'Random', icon: '🎲', desc: 'Chaos mode' },
                    { id: 'by-rating', label: 'By Rating', icon: '⭐', desc: 'Your scores' },
                    { id: 'by-popularity', label: 'By Popularity', icon: '📈', desc: 'Global rank' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSettings({ ...settings, bracketSeedMode: option.id as GameSettings['bracketSeedMode'] })}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        settings.bracketSeedMode === option.id
                          ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      <span className="text-lg block">{option.icon}</span>
                      <span className="text-xs font-medium block">{option.label}</span>
                      <span className="text-[10px] opacity-60">{option.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-white font-medium">
                  📋 Include Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'completed-only', label: 'Completed', icon: '✅', desc: 'Best for fairness' },
                    { id: 'completed-dropped', label: '+ Dropped', icon: '🗑️', desc: 'Include dropped' },
                    { id: 'all', label: 'All', icon: '📚', desc: 'Everything' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSettings({ ...settings, bracketStatusFilter: option.id as GameSettings['bracketStatusFilter'] })}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        settings.bracketStatusFilter === option.id
                          ? 'bg-green-500/20 border-green-500/50 text-green-300'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      <span className="text-lg block">{option.icon}</span>
                      <span className="text-xs font-medium block">{option.label}</span>
                      <span className="text-[10px] opacity-60">{option.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bracket Category */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-white font-medium">
                  📂 Battle Category
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'anime', label: 'Anime', icon: '📺', desc: 'Your anime list' },
                    { id: 'manga', label: 'Manga', icon: '📚', desc: 'Your manga list' },
                    { id: 'characters', label: 'Characters', icon: '👤', desc: 'Favorite characters' },
                    { id: 'openings', label: 'Openings', icon: '🎬', desc: 'Best OP tournament' },
                    { id: 'endings', label: 'Endings', icon: '🎭', desc: 'Best ED tournament' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSettings({ ...settings, bracketCategory: option.id as GameSettings['bracketCategory'] })}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        settings.bracketCategory === option.id
                          ? 'bg-pink-500/20 border-pink-500/50 text-pink-300'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      <span className="flex items-center gap-2 font-bold">
                        <span className="text-xl">{option.icon}</span>
                        {option.label}
                      </span>
                      <span className="text-xs opacity-70">{option.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Format Filters (Anime only) */}
              {settings.bracketCategory === 'anime' && (
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-white font-medium">
                    🎬 Format Filters
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'bracketIncludeTV', label: 'TV', icon: '📺' },
                      { id: 'bracketIncludeMovies', label: 'Movies', icon: '🎬' },
                      { id: 'bracketIncludeOVA', label: 'OVA', icon: '💿' },
                      { id: 'bracketIncludeONA', label: 'ONA', icon: '🌐' },
                      { id: 'bracketIncludeSpecials', label: 'Specials', icon: '⭐' },
                    ].map((format) => (
                      <button
                        key={format.id}
                        onClick={() => setSettings({ 
                          ...settings, 
                          [format.id]: !settings[format.id as keyof GameSettings] 
                        })}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          settings[format.id as keyof GameSettings]
                            ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300'
                            : 'bg-white/5 border border-white/10 text-gray-500 hover:border-white/20'
                        }`}
                      >
                        {format.icon} {format.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    💡 Filter which formats can appear in your bracket
                  </p>
                </div>
              )}

              {/* Minimum Episodes (Anime only) */}
              {settings.bracketCategory === 'anime' && (
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-white font-medium">
                    📊 Minimum Episodes: {settings.bracketMinEpisodes}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="24"
                    value={settings.bracketMinEpisodes}
                    onChange={(e) => setSettings({ ...settings, bracketMinEpisodes: parseInt(e.target.value) })}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>1 ep</span>
                    <span>12 eps</span>
                    <span>24 eps</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    💡 Exclude shorts and one-episode specials
                  </p>
                </div>
              )}
            </>
          )}

          {/* Question Count (hide for bracket games) */}
          {!isBracketGame && (
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-white font-medium">
              <Hash className="w-4 h-4 text-blue-400" />
              Number of Questions
            </label>
            <div className="grid grid-cols-5 gap-2">
              {questionOptions.map((count) => (
                <button
                  key={count}
                  onClick={() => setSettings({ ...settings, questionCount: count })}
                  className={`py-3 rounded-xl font-bold transition-all ${
                    settings.questionCount === count
                      ? 'bg-purple-500 text-white scale-105'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
          )}

          {/* Difficulty (hide for bracket games) */}
          {!isBracketGame && (
            <div className="space-y-3">
            <label className="flex items-center gap-2 text-white font-medium">
              <Zap className="w-4 h-4 text-yellow-400" />
              Difficulty
            </label>
            <div className="grid grid-cols-2 gap-3">
              {difficultyOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSettings({ ...settings, difficulty: option.id as GameSettings['difficulty'] })}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    settings.difficulty === option.id
                      ? option.color + ' border-current'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <span className="font-bold block">{option.label}</span>
                  <span className="text-xs opacity-70">{option.description}</span>
                </button>
              ))}
            </div>
          </div>
          )}

          {/* Time Limit (hide for bracket games) */}
          {!isBracketGame && (
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-white font-medium">
                <Clock className="w-4 h-4 text-green-400" />
                Time per Question
              </label>
              <div className="grid grid-cols-3 gap-3">
                {timeOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSettings({ ...settings, timeLimit: option.id as GameSettings['timeLimit'] })}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      settings.timeLimit === option.id
                        ? 'bg-green-500/20 border-green-500/50 text-green-300'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <span className="font-bold block">{option.label}</span>
                    <span className="text-xs opacity-70">{option.seconds}s</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Advanced Options Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            Advanced Options
          </button>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">Show Hints</span>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, showHints: !settings.showHints })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.showHints ? 'bg-purple-500' : 'bg-gray-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    settings.showHints ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">Shuffle Answer Order</span>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, shuffleOptions: !settings.shuffleOptions })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.shuffleOptions ? 'bg-purple-500' : 'bg-gray-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    settings.shuffleOptions ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </label>
            </div>
          )}

          {/* Summary */}
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <h4 className="text-purple-300 font-medium mb-2">Game Summary</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• {settings.questionCount} questions</li>
              <li>• {difficultyOptions.find(d => d.id === settings.difficulty)?.label} difficulty</li>
              <li>• {timeOptions.find(t => t.id === settings.timeLimit)?.seconds || 30}s per question</li>
              <li>• Estimated time: {Math.ceil(settings.questionCount * (timeOptions.find(t => t.id === settings.timeLimit)?.seconds || 30) / 60)} min</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-white/10 p-6 rounded-b-2xl">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => onStart(settings)}
              className="flex-1 py-3 rounded-xl bg-linear-to-r from-purple-500 to-violet-600 text-white font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Start Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
