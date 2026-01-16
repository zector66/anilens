'use client';

import React from 'react';
import { TopMediaItem } from '@/types/studio';

interface CoversModuleProps {
  media: TopMediaItem[];
  accentColor: string;
  title?: string;
  layout?: 'grid-9' | 'grid-6' | 'row-5' | 'featured';
  showScores?: boolean;
  showRanks?: boolean;
}

export function CoversModule({ 
  media, 
  accentColor, 
  title = 'Top Rated',
  layout = 'grid-9',
  showScores = true,
  showRanks = true,
}: CoversModuleProps) {
  
  if (layout === 'featured' && media.length > 0) {
    const [featured, ...rest] = media;
    return (
      <div className="p-4 rounded-xl" style={{ background: 'rgba(10, 10, 15, 0.55)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
        {title && (
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
        )}
        <div className="flex gap-3">
          {/* Featured large cover */}
          <div className="relative shrink-0">
            <div 
              className="w-32 h-48 rounded-xl overflow-hidden"
              style={{ boxShadow: `0 0 0 2px ${accentColor}` }}
            >
              <img src={featured.cover} alt={featured.title} className="w-full h-full object-cover" />
              {showScores && featured.score && (
                <div 
                  className="absolute bottom-2 right-2 px-2 py-1 rounded-lg text-sm font-bold"
                  style={{ 
                    background: 'rgba(0,0,0,0.85)',
                    color: featured.score >= 8 ? '#22c55e' : featured.score >= 6 ? '#eab308' : '#ef4444'
                  }}
                >
                  {featured.score}
                </div>
              )}
            </div>
            {showRanks && (
              <div 
                className="absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: accentColor, color: '#fff' }}
              >
                1
              </div>
            )}
          </div>
          
          {/* Grid of remaining */}
          <div className="grid grid-cols-3 gap-2 flex-1">
            {rest.slice(0, 6).map((item, i) => (
              <div key={item.id} className="relative">
                <div className="aspect-[2/3] rounded-lg overflow-hidden bg-white/5">
                  <img src={item.cover} alt={item.title} className="w-full h-full object-cover" />
                  {showScores && item.score && (
                    <div 
                      className="absolute bottom-1 right-1 px-1 py-0.5 rounded text-[10px] font-bold"
                      style={{ 
                        background: 'rgba(0,0,0,0.8)',
                        color: item.score >= 8 ? '#22c55e' : item.score >= 6 ? '#eab308' : '#ef4444'
                      }}
                    >
                      {item.score}
                    </div>
                  )}
                </div>
                {showRanks && (
                  <div 
                    className="absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#9ca3af' }}
                  >
                    {i + 2}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (layout === 'row-5') {
    return (
      <div className="p-4 rounded-xl" style={{ background: 'rgba(10, 10, 15, 0.55)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
        {title && (
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
        )}
        <div className="flex gap-2 justify-center">
          {media.slice(0, 5).map((item, i) => (
            <div key={item.id} className="relative">
              <div 
                className="w-20 h-28 rounded-lg overflow-hidden"
                style={{ 
                  boxShadow: i === 0 ? `0 0 0 2px ${accentColor}` : 'none',
                  transform: i === 0 ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <img src={item.cover} alt={item.title} className="w-full h-full object-cover" />
                {showScores && item.score && (
                  <div 
                    className="absolute bottom-1 right-1 px-1 py-0.5 rounded text-[10px] font-bold"
                    style={{ 
                      background: 'rgba(0,0,0,0.8)',
                      color: item.score >= 8 ? '#22c55e' : item.score >= 6 ? '#eab308' : '#ef4444'
                    }}
                  >
                    {item.score}
                  </div>
                )}
              </div>
              {showRanks && (
                <div 
                  className="absolute -top-2 -left-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ 
                    background: i === 0 ? accentColor : 'rgba(255,255,255,0.1)',
                    color: i === 0 ? '#fff' : '#9ca3af'
                  }}
                >
                  {i + 1}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Default: grid-9 or grid-6
  const count = layout === 'grid-6' ? 6 : 9;
  const cols = layout === 'grid-6' ? 3 : 3;
  
  return (
    <div className="p-4 rounded-xl" style={{ background: 'rgba(10, 10, 15, 0.55)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
      {title && (
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
      )}
      <div className={`grid grid-cols-${cols} gap-2`}>
        {media.slice(0, count).map((item, i) => (
          <div key={item.id} className="relative">
            <div 
              className="aspect-[2/3] rounded-lg overflow-hidden bg-white/5"
              style={{ 
                boxShadow: i === 0 ? `0 0 0 2px ${accentColor}` : 'none',
              }}
            >
              <img src={item.cover} alt={item.title} className="w-full h-full object-cover" />
              {showScores && item.score && (
                <div 
                  className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-xs font-bold"
                  style={{ 
                    background: 'rgba(0,0,0,0.8)',
                    color: item.score >= 8 ? '#22c55e' : item.score >= 6 ? '#eab308' : '#ef4444'
                  }}
                >
                  {item.score}
                </div>
              )}
            </div>
            {showRanks && (
              <div 
                className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ 
                  background: i === 0 ? accentColor : 'rgba(255,255,255,0.1)',
                  color: i === 0 ? '#fff' : '#9ca3af'
                }}
              >
                {i + 1}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Specialized cover modules for different categories
export function HiddenGemsModule({ 
  media, 
  accentColor 
}: { 
  media: TopMediaItem[]; 
  accentColor: string;
}) {
  return (
    <div className="p-4 rounded-xl" style={{ background: 'rgba(10, 10, 15, 0.55)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        💎 Hidden Gems
      </h3>
      <div className="flex gap-3 justify-center">
        {media.slice(0, 3).map((item, i) => (
          <div key={item.id} className="text-center">
            <div 
              className="w-20 h-28 rounded-lg overflow-hidden mx-auto mb-2"
              style={{ boxShadow: `0 4px 12px ${accentColor}33` }}
            >
              <img src={item.cover} alt={item.title} className="w-full h-full object-cover" />
            </div>
            <p className="text-[10px] text-gray-400 truncate max-w-20">{item.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
