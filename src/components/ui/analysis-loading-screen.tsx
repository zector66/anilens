'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { AniListUser } from '@/types/anilist';

// Session storage key for tracking if user has seen loading screen
const LOADING_SCREEN_KEY = 'anilens_analysis_booted';

/**
 * Check if we should skip the loading screen this session
 */
export function hasBootedThisSession(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(LOADING_SCREEN_KEY) === '1';
}

/**
 * Mark that user has booted this session
 */
export function markAsBooted(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(LOADING_SCREEN_KEY, '1');
}

interface LoadingStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete';
}

interface AnalysisLoadingScreenProps {
  user: AniListUser | null;
  animeCount?: number;
  mangaCount?: number;
  currentStep?: string;
  isComplete?: boolean;
}

const LOADING_STEPS: LoadingStep[] = [
  { id: 'fetch', label: 'Fetching your AniList data', status: 'pending' },
  { id: 'genres', label: 'Processing genres & formats', status: 'pending' },
  { id: 'tags', label: 'Analyzing tags & themes', status: 'pending' },
  { id: 'studios', label: 'Building studio profile', status: 'pending' },
  { id: 'stats', label: 'Calculating statistics', status: 'pending' },
  { id: 'emotional', label: 'Analyzing emotional patterns', status: 'pending' },
  { id: 'prepare', label: 'Preparing your experience', status: 'pending' },
  { id: 'finalize', label: 'Finalizing profile', status: 'pending' },
];

export function AnalysisLoadingScreen({
  user,
  animeCount,
  mangaCount,
  currentStep,
  isComplete = false,
}: AnalysisLoadingScreenProps) {
  const [steps, setSteps] = useState<LoadingStep[]>(LOADING_STEPS);

  // Handle step updates based on props
  useEffect(() => {
    if (isComplete) {
      // All steps complete
      setSteps(LOADING_STEPS.map(s => ({ ...s, status: 'complete' })));
      return;
    }

    if (currentStep) {
      // Use explicit step control
      const stepIndex = LOADING_STEPS.findIndex(s => s.id === currentStep);
      setSteps(LOADING_STEPS.map((s, i) => ({
        ...s,
        status: i < stepIndex ? 'complete' : i === stepIndex ? 'active' : 'pending',
      })));
      return;
    }

    // Simulate progress with realistic timing
    const timings = [600, 800, 900, 1000, 700, 800, 600, 500]; // ms per step
    let currentIdx = 0;
    
    // Start first step immediately
    setSteps(LOADING_STEPS.map((s, i) => ({
      ...s,
      status: i === 0 ? 'active' : 'pending',
    })));

    // Schedule remaining steps
    const timeouts: NodeJS.Timeout[] = [];
    let totalTime = 0;
    
    timings.forEach((timing) => {
      totalTime += timing;
      const timeout = setTimeout(() => {
        currentIdx++;
        if (currentIdx <= LOADING_STEPS.length) {
          setSteps(LOADING_STEPS.map((s, i) => ({
            ...s,
            status: i < currentIdx ? 'complete' : i === currentIdx ? 'active' : 'pending',
          })));
        }
      }, totalTime);
      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [currentStep, isComplete]);

  const completedSteps = steps.filter(s => s.status === 'complete').length;
  const progress = (completedSteps / steps.length) * 100;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {/* Banner + Avatar Section */}
      <div className="relative w-full max-w-md mb-8">
        {/* Banner with shimmer effect */}
        <div className="relative h-32 rounded-2xl overflow-hidden bg-linear-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20">
          {user?.bannerImage ? (
            <Image
              src={user.bannerImage}
              alt="Profile banner"
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-linear-to-r from-purple-500/30 via-pink-500/30 to-blue-500/30 animate-gradient" />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-[#0a0a0f] via-transparent to-transparent" />
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        </div>

        {/* Avatar */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-[#0a0a0f] bg-white/10 shadow-xl">
              {user?.avatar?.large ? (
                <Image
                  src={user.avatar.large}
                  alt={user.name || 'User avatar'}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              )}
            </div>
            {/* Animated ring */}
            <div className="absolute -inset-1 rounded-2xl border-2 border-purple-500/50 animate-pulse" />
            <div className="absolute -inset-2 rounded-2xl border border-purple-400/30 animate-ping" style={{ animationDuration: '2s' }} />
          </div>
        </div>
      </div>

      {/* User Name */}
      <h2 className="text-xl font-bold text-white mt-6 mb-2">
        {user?.name || 'Loading...'}
      </h2>

      {/* Entry Counts */}
      {(animeCount !== undefined || mangaCount !== undefined || user?.statistics) && (
        <div className="flex items-center gap-4 text-sm mb-8">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
            <span className="text-purple-400 font-bold">
              {animeCount ?? user?.statistics?.anime?.count ?? '—'}
            </span>
            <span className="text-gray-400">anime</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
            <span className="text-blue-400 font-bold">
              {mangaCount ?? user?.statistics?.manga?.count ?? '—'}
            </span>
            <span className="text-gray-400">manga</span>
          </div>
        </div>
      )}

      {/* Main Title */}
      <h3 className="text-lg font-semibold text-white mb-6">
        Analyzing your AniList...
      </h3>

      {/* Progress Steps */}
      <div className="w-full max-w-sm space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
              step.status === 'complete'
                ? 'bg-green-500/10 border border-green-500/20'
                : step.status === 'active'
                ? 'bg-purple-500/10 border border-purple-500/30'
                : 'bg-white/5 border border-white/10'
            }`}
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          >
            {/* Status Icon */}
            <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
              step.status === 'complete'
                ? 'bg-green-500'
                : step.status === 'active'
                ? 'bg-purple-500'
                : 'bg-white/10'
            }`}>
              {step.status === 'complete' ? (
                <Check className="w-4 h-4 text-white" />
              ) : step.status === 'active' ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-white/30" />
              )}
            </div>

            {/* Label */}
            <span className={`text-sm font-medium transition-colors ${
              step.status === 'complete'
                ? 'text-green-400'
                : step.status === 'active'
                ? 'text-white'
                : 'text-gray-500'
            }`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-sm mt-6">
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center text-xs text-gray-500 mt-2">
          {completedSteps} of {steps.length} steps complete
        </p>
      </div>

      {/* Dynamic Loading Tips */}
      <div className="text-center text-xs text-gray-400 mt-8 max-w-sm space-y-2">
        <p className="animate-fade-in">
          {completedSteps < 2 && '🔍 Scanning your watch history...'}
          {completedSteps >= 2 && completedSteps < 4 && '🎨 Identifying your unique preferences...'}
          {completedSteps >= 4 && completedSteps < 6 && '📊 Crunching the numbers...'}
          {completedSteps >= 6 && completedSteps < 7 && '✨ Almost there...'}
          {completedSteps >= 7 && '🎉 Ready to reveal your taste!'}
        </p>
        <p className="text-gray-600 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          💡 Your profile updates automatically as you watch more
        </p>
      </div>
    </div>
  );
}
