'use client';

import React, { forwardRef, useMemo } from 'react';
import { StudioPosterProfile } from '@/types/studio';
import { LayoutPreset, LAYOUT_PRESETS, ModuleId } from '@/types/studio-v2';
import { generateFingerprint } from '@/lib/fingerprint-generator';
import {
  HeroModule,
  CoversModule,
  HiddenGemsModule,
  StatsRowModule,
  GenreBarsModule,
  TagChipsModule,
  StudiosModule,
  IndicesModule,
  ArchetypeModule,
  EraTimelineModule,
  FormatDistributionModule,
  EmotionalProfileModule,
  RiskProfileModule,
} from './modules';

interface StudioPosterV2Props {
  profile: StudioPosterProfile;
  layoutPreset: LayoutPreset;
  enabledModules?: ModuleId[];
  className?: string;
  width?: number;
  height?: number;
}

export const StudioPosterV2 = forwardRef<HTMLDivElement, StudioPosterV2Props>(
  function StudioPosterV2({ 
    profile, 
    layoutPreset = 'wrapped',
    enabledModules,
    className = '', 
    width = 1600, 
    height = 900 
  }, ref) {
    const preset = LAYOUT_PRESETS[layoutPreset];
    const modules = enabledModules || preset.modules;
    const accentColor = profile.settings.theme.accent;
    
    // Generate fingerprint
    const fingerprint = useMemo(() => {
      const result = generateFingerprint({
        profile: profile as any, // TasteProfile shape
        totalEntries: profile.activityStats.totalTitles,
        completionRate: profile.activityStats.completionRate,
        meanScore: profile.activityStats.meanScore,
        topStudio: profile.topStudiosOrAuthors[0]?.name,
        topGenre: profile.topGenres[0]?.name,
        mode: profile.mode,
      });
      return result;
    }, [profile]);
    
    // Determine layout style based on preset
    const isCompact = layoutPreset === 'clean';
    const isCoversFocused = layoutPreset === 'poster-wall';
    const isStatsFocused = layoutPreset === 'stats-nerd' || layoutPreset === 'gamer';
    
    // Background style based on theme
    const renderBackground = () => {
      const bgStyle = preset.theme?.background || 'banner-blur';
      
      if (bgStyle === 'banner-blur' && profile.user.banner) {
        return (
          <>
            <img 
              src={profile.user.banner} 
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'blur(60px) brightness(0.3)' }}
            />
            <div 
              className="absolute inset-0"
              style={{ background: 'linear-gradient(180deg, rgba(5,5,8,0.3) 0%, rgba(5,5,8,0.85) 100%)' }}
            />
          </>
        );
      }
      
      if (bgStyle === 'gradient') {
        return (
          <div 
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${accentColor}22 0%, #0a0a0f 50%, ${accentColor}11 100%)` }}
          />
        );
      }
      
      // Solid or noise
      return (
        <div className="absolute inset-0 bg-[#050508]">
          {bgStyle === 'noise' && (
            <div 
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              }}
            />
          )}
        </div>
      );
    };
    
    // Render modules based on enabled list
    const renderModule = (moduleId: ModuleId) => {
      switch (moduleId) {
        case 'hero':
          return (
            <HeroModule 
              key={moduleId}
              profile={profile} 
              fingerprint={fingerprint.short}
              compact={isCompact}
            />
          );
        case 'top-covers':
          return (
            <CoversModule
              key={moduleId}
              media={profile.topMedia}
              accentColor={accentColor}
              title="Top Rated"
              layout={isCoversFocused ? 'featured' : 'row-5'}
              showScores={true}
              showRanks={true}
            />
          );
        case 'hidden-gems':
          return (
            <HiddenGemsModule
              key={moduleId}
              media={profile.topMedia.slice(-3)} // Last 3 as "gems"
              accentColor={accentColor}
            />
          );
        case 'genre-bars':
          return (
            <GenreBarsModule
              key={moduleId}
              genres={profile.topGenres}
              accentColor={accentColor}
              count={isStatsFocused ? 8 : 6}
            />
          );
        case 'tag-chips':
          return (
            <TagChipsModule
              key={moduleId}
              tags={profile.topTags}
              accentColor={accentColor}
              count={isCompact ? 8 : 12}
            />
          );
        case 'studios':
          return (
            <StudiosModule
              key={moduleId}
              studios={profile.topStudiosOrAuthors}
              accentColor={accentColor}
              mode={profile.mode}
              count={isCompact ? 3 : 5}
            />
          );
        case 'stats-row':
          return (
            <StatsRowModule
              key={moduleId}
              profile={profile}
              layout={isStatsFocused ? 'grid' : 'row'}
            />
          );
        case 'percentiles':
          return (
            <IndicesModule
              key={moduleId}
              indices={profile.indices}
              layout={isStatsFocused ? 'bars' : 'pills'}
            />
          );
        case 'archetype':
          return (
            <ArchetypeModule
              key={moduleId}
              archetype={fingerprint.archetype}
              traits={fingerprint.tags}
              accentColor={accentColor}
            />
          );
        case 'fingerprint':
          return (
            <div 
              key={moduleId}
              className="p-4 rounded-xl text-center"
              style={{ background: 'rgba(10, 10, 15, 0.55)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
            >
              <p 
                className="text-lg font-medium italic"
                style={{ color: accentColor }}
              >
                &ldquo;{fingerprint.short}&rdquo;
              </p>
            </div>
          );
        case 'era-timeline':
          // Use eraPreference from profile if available
          const eras = (profile as any).eraPreference || [
            { era: '80s', preference: 0.1, count: 5 },
            { era: '90s', preference: 0.25, count: 15 },
            { era: '00s', preference: 0.4, count: 45 },
            { era: '10s', preference: 0.7, count: 80 },
            { era: '20s', preference: 1.0, count: 120 },
          ];
          return (
            <EraTimelineModule
              key={moduleId}
              eras={eras}
              accentColor={accentColor}
            />
          );
        case 'format-dist':
          const formats = (profile as any).formatDistribution || [
            { format: 'TV', count: 150, percentage: 60 },
            { format: 'MOVIE', count: 40, percentage: 16 },
            { format: 'OVA', count: 25, percentage: 10 },
            { format: 'ONA', count: 20, percentage: 8 },
            { format: 'SPECIAL', count: 15, percentage: 6 },
          ];
          return (
            <FormatDistributionModule
              key={moduleId}
              formats={formats}
              accentColor={accentColor}
            />
          );
        case 'emotional':
          const emotionalProfile = (profile as any).emotionalProfile || {
            escapism: 0.6,
            bleakness: 0.4,
            idealism: 0.7,
            intensity: 0.5,
            sentimentality: 0.65,
          };
          return (
            <EmotionalProfileModule
              key={moduleId}
              profile={emotionalProfile}
              accentColor={accentColor}
            />
          );
        case 'risk-profile':
          const riskData = (profile as any).riskProfile || {
            preferredTier: '20k-100k',
            riskTolerance: 0.5,
            curve: [
              { bucket: '<5k', engagement: 0.2 },
              { bucket: '5k-20k', engagement: 0.4 },
              { bucket: '20k-100k', engagement: 0.8 },
              { bucket: '100k+', engagement: 0.6 },
            ],
          };
          return (
            <RiskProfileModule
              key={moduleId}
              riskData={riskData}
              accentColor={accentColor}
            />
          );
        default:
          return null;
      }
    };
    
    // Layout configurations for different presets
    const renderLayout = () => {
      if (layoutPreset === 'wrapped') {
        // Full AniWrapped layout - 3 column grid
        return (
          <div className="h-full grid grid-cols-12 gap-4 p-5">
            {/* Left Column */}
            <div className="col-span-3 flex flex-col gap-4">
              {modules.includes('stats-row') && renderModule('stats-row')}
              {modules.includes('percentiles') && renderModule('percentiles')}
              {modules.includes('archetype') && renderModule('archetype')}
            </div>
            
            {/* Center Column */}
            <div className="col-span-6 flex flex-col gap-4">
              {modules.includes('hero') && renderModule('hero')}
              {modules.includes('top-covers') && renderModule('top-covers')}
              {modules.includes('studios') && renderModule('studios')}
              {modules.includes('tag-chips') && renderModule('tag-chips')}
            </div>
            
            {/* Right Column */}
            <div className="col-span-3 flex flex-col gap-4">
              {modules.includes('genre-bars') && renderModule('genre-bars')}
              {modules.includes('hidden-gems') && renderModule('hidden-gems')}
            </div>
          </div>
        );
      }
      
      if (layoutPreset === 'clean') {
        // Minimal clean layout - single column focus
        return (
          <div className="h-full flex flex-col gap-4 p-6 max-w-2xl mx-auto">
            {modules.includes('hero') && renderModule('hero')}
            {modules.includes('top-covers') && renderModule('top-covers')}
            {modules.includes('studios') && renderModule('studios')}
            {modules.includes('fingerprint') && renderModule('fingerprint')}
          </div>
        );
      }
      
      if (layoutPreset === 'poster-wall') {
        // Covers-focused layout
        return (
          <div className="h-full flex flex-col gap-4 p-5">
            {modules.includes('hero') && renderModule('hero')}
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-4">
                {modules.includes('top-covers') && renderModule('top-covers')}
              </div>
              <div className="flex flex-col gap-4">
                {modules.includes('hidden-gems') && renderModule('hidden-gems')}
                {modules.includes('studios') && renderModule('studios')}
              </div>
            </div>
          </div>
        );
      }
      
      if (layoutPreset === 'gamer' || layoutPreset === 'stats-nerd') {
        // Stats-heavy layout
        return (
          <div className="h-full grid grid-cols-12 gap-4 p-5">
            {/* Left - Hero & Stats */}
            <div className="col-span-4 flex flex-col gap-4">
              {modules.includes('hero') && renderModule('hero')}
              {modules.includes('stats-row') && renderModule('stats-row')}
              {modules.includes('archetype') && renderModule('archetype')}
            </div>
            
            {/* Center - Charts */}
            <div className="col-span-4 flex flex-col gap-4">
              {modules.includes('genre-bars') && renderModule('genre-bars')}
              {modules.includes('percentiles') && renderModule('percentiles')}
            </div>
            
            {/* Right - Covers */}
            <div className="col-span-4 flex flex-col gap-4">
              {modules.includes('top-covers') && renderModule('top-covers')}
            </div>
          </div>
        );
      }
      
      // Default fallback - simple vertical stack
      return (
        <div className="h-full flex flex-col gap-4 p-5">
          {modules.map(moduleId => renderModule(moduleId))}
        </div>
      );
    };
    
    return (
      <div
        ref={ref}
        className={`relative overflow-hidden ${className}`}
        style={{ 
          width: `${width}px`, 
          height: `${height}px`,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#050508',
        }}
      >
        {/* Background */}
        <div className="absolute inset-0">
          {renderBackground()}
          {/* Noise overlay */}
          <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>
        
        {/* Content */}
        <div className="relative h-full">
          {renderLayout()}
        </div>
        
        {/* Watermark */}
        <div className="absolute bottom-3 right-4 flex items-center gap-2 opacity-60">
          <svg className="w-4 h-4" style={{ color: accentColor }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
          </svg>
          <span className="text-xs font-medium text-gray-400">anilens.vercel.app</span>
        </div>
      </div>
    );
  }
);

export default StudioPosterV2;
