'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { SmartHeader } from '@/components/layout/smart-header';
import { BarChart3, LogIn } from 'lucide-react';
import Link from 'next/link';

export default function AnalyticsRedirectPage() {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated && user?.name) {
      router.replace(`/u/${user.name}/analytics`);
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-deepest)' }}>
        <SmartHeader />
        <div className="h-14" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    // Will redirect via useEffect; show brief loading state
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-deepest)' }}>
        <SmartHeader />
        <div className="h-14" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-deepest)' }}>
      <SmartHeader />
      <div className="h-14" />
      <main className="max-w-[1400px] mx-auto px-4 py-20 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'var(--accent-color)' }}>
          <BarChart3 size={32} className="text-white" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] mb-4" style={{ color: 'var(--text-primary)' }}>
          Analytics
        </h1>
        <p className="text-base max-w-md mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Sign in with AniList to decode your anime taste, explore your stats, and compare with friends.
        </p>
        <Link
          href="/api/auth/anilist"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'var(--accent-color)', color: '#fff' }}
        >
          <LogIn size={18} />
          Login with AniList
        </Link>
      </main>
    </div>
  );
}
