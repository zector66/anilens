'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { TasteProfile } from '@/types/anilist';
import { Share2, Download, Copy, Check } from 'lucide-react';

interface ShareableTasteCardProps {
  profile: TasteProfile;
  username: string;
  avatarUrl?: string;
}

export function ShareableTasteCard({ profile, username, avatarUrl }: ShareableTasteCardProps) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const topGenres = profile.genreAffinity.slice(0, 3);
  const topStudios = profile.studioBias.slice(0, 3);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`Check out my Anime Taste Profile! Top Genres: ${topGenres.map(g => g.genre).join(', ')}. My personality: ${profile.personalityTraits.completionist > 7 ? 'Completionist' : 'Adventurer'}!`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  return (
    <div className="space-y-4">
      <div 
        ref={cardRef}
        className="relative w-full max-w-md mx-auto aspect-4/5 overflow-hidden rounded-3xl bg-slate-900 border border-white/10 shadow-2xl"
      >
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative h-full p-8 flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-purple-500/50">
              {avatarUrl ? (
                <Image 
                  src={avatarUrl} 
                  alt={username} 
                  width={64}
                  height={64}
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-purple-500 flex items-center justify-center text-2xl font-bold text-white">
                  {username[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">@{username}</h3>
              <p className="text-purple-400 text-sm font-medium uppercase tracking-wider">Anime Taste DNA</p>
            </div>
          </div>

          {/* Core Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-xs text-gray-400 uppercase mb-1">Mean Score</p>
              <p className="text-2xl font-bold text-white">{profile.scorePatterns.meanScore.toFixed(1)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-xs text-gray-400 uppercase mb-1">Chaos Level</p>
              <p className="text-2xl font-bold text-white">{profile.personalityTraits.chaosLevel.toFixed(1)}</p>
            </div>
          </div>

          {/* Genres & Studios */}
          <div className="space-y-6 flex-1">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold mb-3 tracking-widest">Top Genres</p>
              <div className="flex flex-wrap gap-2">
                {topGenres.map((g, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-300 text-sm font-medium border border-purple-500/20">
                    {g.genre}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase font-bold mb-3 tracking-widest">Top Studios</p>
              <div className="flex flex-wrap gap-2">
                {topStudios.map((s, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-sm font-medium border border-blue-500/20">
                    {s.studio}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Branding */}
          <div className="pt-6 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-linear-to-br from-purple-500 to-blue-500" />
              <span className="text-white font-bold text-sm">AnimeTaste</span>
            </div>
            <p className="text-[10px] text-gray-500">Generated on animetaste.app</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-3">
        <button 
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-medium transition-all"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Summary'}
        </button>
        <button 
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-xl text-white text-sm font-medium transition-all shadow-lg shadow-purple-500/20"
        >
          <Download className="w-4 h-4" />
          Save Image
        </button>
        <button 
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl text-white text-sm font-medium transition-all shadow-lg shadow-blue-500/20"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>
    </div>
  );
}
