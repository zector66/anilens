'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, AlertCircle, LogIn, Eye } from 'lucide-react';

interface LoginButtonProps {
  variant?: 'default' | 'hero';
}

export function LoginButton({ variant = 'default' }: LoginButtonProps) {
  const { isAuthenticated, login, loginWithAniList, isLoggingIn } = useAuth();
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter your AniList username');
      return;
    }
    setError(null);
    try {
      await login(username.trim());
    } catch (error) {
      console.error('Login error:', error);
      
      // Better error handling based on error type
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        setError('Cannot connect to AniList. Please check your internet connection and try again.');
      } else if (error instanceof Error && (error.message.includes('Not Found') || error.message.includes('404'))) {
        setError('User not found. Check your username and try again.');
      } else if (error instanceof Error && error.message.includes('429')) {
        setError('Too many requests. Please wait a moment and try again.');
      } else {
        setError('Failed to load profile. Please try again in a moment.');
      }
    }
  };

  if (variant === 'hero') {
    return (
      <div className="w-full max-w-md mx-auto space-y-4">
        {/* Primary: Try Before Login - Zero Auth */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="text-center mb-3">
            <p className="text-sm font-medium text-white mb-1">Try it now — no login required</p>
            <p className="text-xs text-gray-500">Enter any AniList username to explore</p>
          </div>
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                // Clear error when user starts typing again
                if (error) {
                  setError(null);
                }
              }}
              placeholder="AniList username"
              className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 transition-all text-base"
              disabled={isLoggingIn}
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isLoggingIn}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-linear-to-r from-purple-500 to-blue-500 rounded-xl text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
            >
              {isLoggingIn ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Eye className="w-5 h-5" />
                  Explore
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setUsername('Girl');
                setTimeout(() => {
                  const form = document.querySelector('form');
                  if (form) {
                    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                  }
                }, 100);
              }}
              className="px-6 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-gray-300 font-medium transition-all"
            >
              Try with Girl
            </button>
          </div>
        </form>

        {/* Secondary: Full Login for Rankings */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#0a0a0f] px-3 text-gray-500">
              Want to compete in rankings?
            </span>
          </div>
        </div>

        <button
          onClick={loginWithAniList}
          disabled={isLoggingIn}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-gray-300 text-sm font-medium transition-all"
        >
          {isLoggingIn ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              Login with AniList
            </>
          )}
        </button>
        <p className="text-center text-xs text-gray-600">
          Login to save scores and compete in global rankings
        </p>
      </div>
    );
  }

  // Default compact variant
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={loginWithAniList}
        disabled={isLoggingIn}
        className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50"
      >
        {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
        Login
      </button>
    </div>
  );
}
