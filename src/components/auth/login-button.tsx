'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';

interface LoginButtonProps {
  variant?: 'default' | 'hero';
}

export function LoginButton({ variant = 'default' }: LoginButtonProps) {
  const { isAuthenticated, login, isLoggingIn } = useAuth();
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
    } catch {
      setError('User not found. Check your username and try again.');
    }
  };

  if (variant === 'hero') {
    return (
      <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your AniList username"
              className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
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
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-linear-to-r from-purple-500 to-blue-500 rounded-xl font-semibold text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading profile...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Analyze My Taste
              </>
            )}
            <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:border-purple-500 w-32"
        disabled={isLoggingIn}
      />
      <button
        type="submit"
        disabled={isLoggingIn}
        className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50"
      >
        {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Go'}
      </button>
    </form>
  );
}
