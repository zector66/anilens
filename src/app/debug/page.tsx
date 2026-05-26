'use client';

import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';

export default function DebugPage() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ background: 'var(--bg-deepest)' }}>
      <div className="max-w-md w-full p-6 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h1 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Your Account Info</h1>

        {!isAuthenticated ? (
          <p style={{ color: 'var(--text-tertiary)' }}>You are not logged in. Log in with AniList first.</p>
        ) : (
          <div className="space-y-3">
            <div>
              <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>User ID</span>
              <p className="text-lg font-mono font-bold" style={{ color: 'var(--accent-color)' }}>{user?.id}</p>
              <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Copy this number and paste it into OWNER_IDS in live-chat.tsx</p>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Username</span>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
            </div>
            {user?.avatar?.medium && (
              <div>
                <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Avatar</span>
                <Image src={user.avatar.medium} alt="avatar" width={48} height={48} className="rounded-full mt-1" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
