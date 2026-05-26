'use client';

import { Construction } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-6 border border-purple-500/20">
          <Construction className="w-8 h-8 text-purple-400" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight mb-3">
          Under Redesign
        </h1>
        <p className="text-white/40 leading-relaxed text-[15px]">
          AniLens is currently undergoing a major redesign and is temporarily unavailable.
          <br /><br />
          We are working hard to bring you a better experience. Check back soon!
        </p>
        <div className="mt-8 text-xs text-white/20">
          AniLens &copy; 2026
        </div>
      </div>
    </div>
  );
}

// Original page components preserved in git history — see previous commits for restoration

