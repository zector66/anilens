'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authManager } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

export default function OAuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Completing login...');

  useEffect(() => {
    let mounted = true;

    async function handleCallback() {
      try {
        const success = await authManager.handleOAuthCallback();
        if (!mounted) return;

        if (success) {
          setStatus('success');
          setMessage('Login successful! Redirecting...');
          // Small delay so user sees the success message
          setTimeout(() => {
            router.replace('/design');
          }, 800);
        } else {
          setStatus('error');
          setMessage('Login failed. No access token found.');
        }
      } catch (err) {
        if (!mounted) return;
        setStatus('error');
        const msg = err instanceof Error ? err.message : 'Login failed';
        if (msg.includes('missing ANILIST_CLIENT_SECRET')) {
          setMessage('Server misconfiguration: ANILIST_CLIENT_SECRET is missing. Add it to your .env.local file.');
        } else if (msg.includes('unsupported_grant_type')) {
          setMessage('AniList OAuth app misconfigured. Make sure your app uses Authorization Code flow.');
        } else {
          setMessage(msg);
        }
      }
    }

    handleCallback();

    return () => { mounted = false; };
  }, [router]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'var(--bg-deepest)' }}
    >
      <div className="flex flex-col items-center gap-4">
        {status === 'processing' && (
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent-color)' }} />
        )}
        {status === 'success' && (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--accent-color)' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8L7 12L13 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        {status === 'error' && (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: '#ef4444' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M4 12L12 4" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        )}
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {message}
        </p>
        {status === 'error' && (
          <button
            onClick={() => router.push('/design')}
            className="px-4 py-2 rounded-md text-sm font-medium"
            style={{ background: 'var(--accent-color)', color: '#fff' }}
          >
            Go back
          </button>
        )}
      </div>
    </div>
  );
}
