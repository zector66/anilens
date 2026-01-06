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
  const [showViewOnly, setShowViewOnly] = useState(false);

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
    } catch {
      setError('User not found. Check your username and try again.');
    }
  };

  if (variant === 'hero') {
    return (
      <div className="w-full max-w-md mx-auto space-y-4">
        {/* Primary: OAuth Login for Rankings */}
        <button
          onClick={loginWithAniList}
          disabled={isLoggingIn}
          className="group relative w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-linear-to-r from-purple-500 to-blue-500 rounded-xl font-semibold text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {isLoggingIn ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              Login with AniList
            </>
          )}
          <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        
        <p className="text-center text-xs text-gray-500">
          Login to compete in rankings and save your scores
        </p>

        {/* Secondary: View-only mode */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <button 
              onClick={() => setShowViewOnly(!showViewOnly)}
              className="bg-gray-900 px-3 text-gray-500 hover:text-gray-400 transition-colors"
            >
              or just view stats
            </button>
          </div>
        </div>

        {showViewOnly && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter any AniList username to view"
                className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all text-sm"
                disabled={isLoggingIn}
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-gray-300 text-sm font-medium transition-all"
            >
              {isLoggingIn ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  View Stats (No Rankings)
                </>
              )}
            </button>
            <p className="text-center text-xs text-gray-600">
              View-only mode: Games won&apos;t count toward rankings
            </p>
          </form>
        )}
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
