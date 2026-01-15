'use client';

import { useState } from 'react';
import Image from 'next/image';
import { LoginButton } from '@/components/auth/login-button';
import { useAuth } from '@/hooks/use-auth';
import { TasteProfile } from '@/components/taste/taste-profile';
import { GameHub } from '@/components/games/game-hub';
import { Recommendations } from '@/components/recommendations/recommendations';
import { CommunityHub } from '@/components/games/community-hub';
import { Studio } from '@/components/studio/studio';
import { 
  BarChart3, 
  Gamepad2, 
  Users, 
  TrendingUp, 
  Zap,
  Heart,
  Share2,
  LogOut,
  Settings,
  Sparkles
} from 'lucide-react';
import { SettingsPanel } from '@/components/settings/settings-panel';
import { Logo } from '@/components/ui/logo';
import { WeatherEffects, WeatherWidget } from '@/components/ui/weather-effects';
import { useUI } from '@/contexts/ui-context';

type TabType = 'studio' | 'taste' | 'games' | 'community' | 'recommendations';

export default function Home() {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('taste');

  if (loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-400 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return <Dashboard user={user} activeTab={activeTab} setActiveTab={setActiveTab} logout={logout} />;
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <LoginButton />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-purple-300 mb-8">
            <Zap className="w-4 h-4" />
            <span>Powered by AniList API</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-white">Discover Your </span>
            <span className="bg-linear-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Anime & Manga DNA
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Deep analytics, interactive games, and personalized insights that reveal your true anime and manga taste. 
            Connect with friends and compare your otaku profiles.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <LoginButton variant="hero" />
          </div>
          
          {/* Privacy Note */}
          <p className="mt-6 text-xs text-gray-500 max-w-md mx-auto">
            🔒 We never see your AniList password. We only read your public list data.
            <br />Your token stays in your browser.
          </p>

          {/* Beta Badge & Trust Indicators */}
          <div className="mt-16 flex flex-col items-center gap-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 text-sm text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span>Open Beta • Free Forever</span>
            </div>
            
            <div className="grid grid-cols-3 gap-8 max-w-xl">
              {[
                { value: '8+', label: 'Game Modes' },
                { value: '∞', label: 'Titles' },
                { value: '100%', label: 'Free' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Everything You Need</h2>
            <p className="text-gray-400 max-xl mx-auto">Unlock deep insights into your anime and manga preferences with our comprehensive suite of tools</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: BarChart3,
                title: 'Taste Analytics',
                description: 'Genre affinity, studio bias, era preferences, and behavioral metrics visualized beautifully.',
                gradient: 'from-purple-500 to-violet-600',
              },
              {
                icon: Gamepad2,
                title: 'Interactive Games',
                description: 'OP/ED guessing, screenshot challenges, quote games, and score predictions based on YOUR list.',
                gradient: 'from-blue-500 to-cyan-500',
              },
              {
                icon: Sparkles,
                title: 'AniLens Studio',
                description: 'Create beautiful, shareable taste posters with live customization. Export as PNG and share on AniList!',
                gradient: 'from-purple-500 to-pink-500',
              },
              {
                icon: Users,
                title: 'Friend Comparisons',
                description: 'Compare taste profiles with friends. See compatibility scores and discover shared favorites.',
                gradient: 'from-orange-500 to-amber-500',
              },
              {
                icon: TrendingUp,
                title: 'Smart Recommendations',
                description: 'Taste-powered recommendations based on your unique profile, genre affinity, and hidden preferences.',
                gradient: 'from-pink-500 to-rose-500',
              },
              {
                icon: Share2,
                title: 'Shareable Reports',
                description: 'Generate beautiful cards and reports to share your journey on social media.',
                gradient: 'from-indigo-500 to-purple-500',
              },
            ].map((feature, i) => (
              <div 
                key={i}
                className="group relative p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${feature.gradient} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="relative z-10 py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="p-12 rounded-3xl bg-linear-to-br from-purple-500/20 to-blue-500/20 border border-white/10">
            <Heart className="w-12 h-12 text-pink-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Discover Your DNA?</h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
              Join fans who have uncovered their true taste. It only takes a minute to get started.
            </p>
            <LoginButton variant="hero" />
            <p className="mt-4 text-xs text-gray-500">
              🔒 OAuth login via AniList • We never store your password
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Sparkles className="w-4 h-4" />
              <span>AniLens © 2026</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="https://anilist.co" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">AniList</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


interface DashboardProps {
  user: { id: number; name: string; avatar?: { medium?: string } } | null;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  logout: () => void;
}

function Dashboard({ user, activeTab, setActiveTab, logout }: DashboardProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { weatherEnabled, weatherData, weatherIntensity, weatherOverride, effectiveTheme } = useUI();
  
  // Determine effective weather condition
  const effectiveWeather = weatherOverride || weatherData?.condition || 'clear';
  const isDay = weatherData?.isDay ?? (effectiveTheme === 'light');
  
  const tabs = [
    { id: 'studio' as const, label: 'AniLens Studio', icon: Sparkles },
    { id: 'taste' as const, label: 'Taste Profile', icon: BarChart3 },
    { id: 'games' as const, label: 'Games', icon: Gamepad2 },
    { id: 'community' as const, label: 'Community', icon: Users },
    { id: 'recommendations' as const, label: 'Recommendations', icon: TrendingUp },
  ];

  const handleTabChange = (tab: TabType) => {
    if (tab === activeTab) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(tab);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 150);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'studio':
        return <Studio />;
      case 'taste':
        return <TasteProfile userId={user?.id} />;
      case 'games':
        return <GameHub />;
      case 'community':
        return <CommunityHub onNavigateToGames={() => handleTabChange('games')} />;
      case 'recommendations':
        return <Recommendations userId={user?.id} />;
      default:
        return <TasteProfile userId={user?.id} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {weatherEnabled && (
        <WeatherEffects 
          condition={effectiveWeather} 
          isDay={isDay} 
          intensity={weatherIntensity}
        />
      )}
      
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" />

            <div className="flex items-center gap-2">
              {/* Weather Widget */}
              {weatherEnabled && weatherData && (
                <WeatherWidget 
                  condition={weatherData.condition}
                  temperature={weatherData.temperature}
                  description={weatherData.description}
                  icon={weatherData.icon}
                  isDay={weatherData.isDay}
                  className="hidden md:flex"
                />
              )}
              
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                {user?.avatar?.medium && (
                  <Image 
                    src={user.avatar.medium} 
                    alt={user.name}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-lg"
                  />
                )}
                <span className="text-white font-medium hidden sm:inline">{user?.name}</span>
              </div>
              <button 
                onClick={() => setSettingsOpen(true)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button 
                onClick={logout}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Navigation Tabs */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-1 overflow-x-auto py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div 
          key={activeTab} 
          className={`transition-all duration-300 ${
            isTransitioning 
              ? 'opacity-0 translate-y-4' 
              : 'opacity-100 translate-y-0'
          }`}
        >
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

