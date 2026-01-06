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
}

export function GameSettingsModal({
  isOpen,
  onClose,
  onStart,
  gameTitle,
  gameDescription,
  maxQuestions,
}: GameSettingsModalProps) {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!isOpen) return null;

  const questionOptions = [5, 10, 15, 20, 25].filter(n => n <= maxQuestions);
  if (maxQuestions > 25) questionOptions.push(maxQuestions);

  const difficultyOptions = [
    { 
      id: 'easy', 
      label: 'Easy', 
      description: 'Recent & popular anime you know well',
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

          {/* Question Count */}
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

          {/* Difficulty */}
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

          {/* Time Limit */}
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
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
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
