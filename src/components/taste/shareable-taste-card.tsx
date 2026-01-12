'use client';

import React, { useRef, useState, useCallback } from 'react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { TasteProfile } from '@/types/anilist';
import { Share2, Download, Copy, Check, Loader2 } from 'lucide-react';

interface ShareableTasteCardProps {
  profile: TasteProfile;
  username: string;
  avatarUrl?: string;
  activeType?: 'ANIME' | 'MANGA';
}

export function ShareableTasteCard({ profile, username, avatarUrl, activeType = 'ANIME' }: ShareableTasteCardProps) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const isAnime = activeType === 'ANIME';
  const topGenres = profile.genreAffinity.slice(0, 3);
  const topStudios = profile.studioBias.slice(0, 3);
  const topTags = profile.tagAffinity.slice(0, 3);

  // Generate shareable text summary
  const getShareText = useCallback(() => {
    const archetype = profile.fingerprint?.primaryArchetype || (isAnime ? 'Anime Fan' : 'Manga Fan');
    const chaosLevel = profile.personalityTraits.chaosLevel.toFixed(1);
    const meanScore = profile.scorePatterns.meanScore.toFixed(1);
    const typeLabel = isAnime ? 'Anime' : 'Manga';
    
    return `${isAnime ? '🎬' : '📚'} My ${typeLabel} DNA via AniLens\n\n` +
      `🎭 Archetype: ${archetype}\n` +
      `📊 Mean Score: ${meanScore}/10\n` +
      `🌀 Chaos Level: ${chaosLevel}/10\n` +
      `🎯 Top Genres: ${topGenres.map(g => g.genre).join(', ')}\n` +
      `${isAnime ? '🏢 Favorite Studios' : '✍️ Top Authors'}: ${topStudios.map(s => s.studio).join(', ')}\n` +
      `🏷️ Top Tags: ${topTags.map(t => t.tag).join(', ')}\n\n` +
      `Discover your ${typeLabel.toLowerCase()} DNA at anilens.app!`;
  }, [profile, topGenres, topStudios, topTags, isAnime]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getShareText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  const handleSaveImage = async () => {
    if (!cardRef.current) return;
    setSaving(true);
    
    try {
      // Dynamic import to avoid SSR issues
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#0f172a',
      });
      
      // Create download link
      const link = document.createElement('a');
      link.download = `${username}-${activeType.toLowerCase()}-taste.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to save image:', err);
      // Fallback: copy text instead
      handleCopy();
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    
    try {
      // Try Web Share API first
      if (navigator.share) {
        // Try to share with image if possible
        if (cardRef.current) {
          try {
            const { toPng } = await import('html-to-image');
            const dataUrl = await toPng(cardRef.current, {
              quality: 0.95,
              pixelRatio: 2,
              backgroundColor: '#0f172a',
            });
            
            // Convert data URL to blob
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const file = new File([blob], `${username}-${activeType.toLowerCase()}-taste.png`, { type: 'image/png' });
            
            await navigator.share({
              title: `${username}'s ${isAnime ? 'Anime' : 'Manga'} Taste DNA`,
              text: getShareText(),
              files: [file],
            });
          } catch {
            // Fallback to text-only share
            await navigator.share({
              title: `${username}'s ${isAnime ? 'Anime' : 'Manga'} Taste DNA`,
              text: getShareText(),
            });
          }
        } else {
          await navigator.share({
            title: `${username}'s ${isAnime ? 'Anime' : 'Manga'} Taste DNA`,
            text: getShareText(),
          });
        }
      } else {
        // Fallback: copy to clipboard
        await handleCopy();
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Failed to share:', err);
        // Fallback to copy
        handleCopy();
      }
    } finally {
      setSharing(false);
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
                <OptimizedImage 
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
              <p className="text-purple-400 text-sm font-medium uppercase tracking-wider">{isAnime ? 'Anime' : 'Manga'} Taste DNA</p>
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
              <p className="text-xs text-gray-500 uppercase font-bold mb-3 tracking-widest">{isAnime ? 'Top Studios' : 'Top Authors'}</p>
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
              <span className="text-white font-bold text-sm">AniLens</span>
            </div>
            <p className="text-[10px] text-gray-500">Generated on anilens.app</p>
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
          onClick={handleSaveImage}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 rounded-xl text-white text-sm font-medium transition-all shadow-lg shadow-purple-500/20"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Image'}
        </button>
        <button 
          onClick={handleShare}
          disabled={sharing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-xl text-white text-sm font-medium transition-all shadow-lg shadow-blue-500/20"
        >
          {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
          {sharing ? 'Sharing...' : 'Share'}
        </button>
      </div>
    </div>
  );
}
