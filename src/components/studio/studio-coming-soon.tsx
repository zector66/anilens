'use client';

import React from 'react';
import { Sparkles, Palette, Download, Share2, Settings, BarChart3 } from 'lucide-react';

export function StudioComingSoon() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center max-w-2xl">
        {/* Icon */}
        <div className="w-20 h-20 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-10 h-10 text-purple-400" />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-white mb-4">
          AniLens Studio
        </h1>
        
        {/* Subtitle */}
        <p className="text-xl text-gray-400 mb-8">
          Coming Soon
        </p>

        {/* Description */}
        <p className="text-gray-500 mb-12 max-w-lg mx-auto">
          Create beautiful, shareable taste posters with live customization. 
          Export as PNG and share your anime journey with the world.
        </p>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <FeatureCard 
            icon={Palette} 
            title="Live Customization" 
            description="Real-time poster preview with instant updates" 
          />
          <FeatureCard 
            icon={Download} 
            title="PNG Export" 
            description="High-resolution poster downloads" 
          />
          <FeatureCard 
            icon={Share2} 
            title="Easy Sharing" 
            description="One-click AniList sharing" 
          />
          <FeatureCard 
            icon={Settings} 
            title="Full Control" 
            description="Customize every aspect of your poster" 
          />
          <FeatureCard 
            icon={BarChart3} 
            title="Rich Analytics" 
            description="Your complete taste profile visualized" 
          />
          <FeatureCard 
            icon={Sparkles} 
            title="Multiple Templates" 
            description="Compact, Poster, and Ultra layouts" 
          />
        </div>

        {/* Status */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
            <span className="text-yellow-400 font-medium">In Development</span>
          </div>
          <p className="text-gray-400 text-sm">
            We&apos;re working hard to bring you the ultimate anime taste poster builder. 
            This feature will allow you to create stunning visualizations of your anime journey.
          </p>
        </div>

        {/* Call to Action */}
        <div className="text-sm text-gray-500">
          In the meantime, check out your <span className="text-purple-400 font-medium">Taste Profile</span> 
          {' '}for detailed analytics about your anime preferences!
        </div>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <Icon className="w-8 h-8 text-purple-400 mb-3 mx-auto" />
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}
