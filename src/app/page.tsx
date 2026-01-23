'use client';

import { useState, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { LoginButton } from '@/components/auth/login-button';
import { useAuth } from '@/hooks/use-auth';
import { TasteProfile } from '@/components/taste/taste-profile';
import { GameHub } from '@/components/games/game-hub';
import { Recommendations } from '@/components/recommendations/recommendations';
import { CommunityHubV2 } from '@/components/games/community-hub-v2';
import { Studio } from '@/components/studio/studio';
import { 
  BarChart3, 
  Gamepad2, 
  Users, 
  TrendingUp, 
  Zap,
  Share2,
  LogOut,
  Settings,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { SettingsPanel } from '@/components/settings/settings-panel';
import { Logo } from '@/components/ui/logo';
import { WeatherEffects, WeatherWidget } from '@/components/ui/weather-effects';
import { useUI } from '@/contexts/ui-context';

type TabType = 'studio' | 'taste' | 'games' | 'community' | 'recommendations';

function HomeWithSearchParams() {
  const searchParams = useSearchParams();
  
  // Initialize activeTab from URL parameter
  const getInitialTab = (): TabType => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['studio', 'taste', 'games', 'community', 'recommendations'].includes(tabParam)) {
      return tabParam as TabType;
    }
    return 'taste';
  };
  
  return <HomeContent initialTab={getInitialTab()} />;
}

function HomeContent({ initialTab }: { initialTab: TabType }) {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

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
    { id: 'taste' as const, label: 'Taste', icon: BarChart3 },
    { id: 'recommendations' as const, label: 'Discover', icon: TrendingUp },
    { id: 'games' as const, label: 'Games', icon: Gamepad2 },
    { id: 'community' as const, label: 'Community', icon: Users },
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
        return <CommunityHubV2 onNavigateToGames={() => handleTabChange('games')} />;
      case 'recommendations':
        return <Recommendations userId={user?.id} />;
      default:
        return <TasteProfile userId={user?.id} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Weather Effects - Fixed overlay at root level */}
      {weatherEnabled && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <WeatherEffects 
            condition={effectiveWeather} 
            isDay={isDay} 
            intensity={weatherIntensity}
          />
        </div>
      )}
      
      {/* Premium Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          {/* Left: Logo + Brand */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Logo size="sm" />
            <div className="leading-tight hidden md:block">
              <div className="text-base font-bold text-white">AniLens</div>
              <div className="text-[10px] text-white/40 tracking-wide uppercase">Taste Lab</div>
            </div>
          </Link>

          {/* Center: Nav Tabs */}
          <nav className="hidden lg:flex items-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {/* Weather Widget */}
            {weatherEnabled && weatherData && (
              <WeatherWidget 
                condition={weatherData.condition}
                temperature={weatherData.temperature}
                description={weatherData.description}
                icon={weatherData.icon}
                isDay={weatherData.isDay}
                className="hidden xl:flex"
              />
            )}
            
            {/* Settings Button */}
            <button 
              onClick={() => setSettingsOpen(true)}
              className="h-10 w-10 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Profile Dropdown */}
            <div className="relative group">
              <Link 
                href={user?.name ? `/u/${user.name}` : '#'}
                className="flex items-center gap-2.5 h-10 pl-1.5 pr-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10 hover:border-purple-500/50"
              >
                {user?.avatar?.medium ? (
                  <Image 
                    src={user.avatar.medium} 
                    alt={user.name || 'Profile'}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-md"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-md bg-purple-500/30" />
                )}
                <span className="text-sm font-semibold text-white hidden md:inline">{user?.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden md:block" />
              </Link>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-2 w-48 py-2 rounded-xl bg-[#1a1a24] border border-white/10 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <Link 
                  href={user?.name ? `/u/${user.name}` : '#'}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  View Profile
                </Link>
                <Link 
                  href="/?tab=studio"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Studio Export
                </Link>
                <button 
                  onClick={() => setSettingsOpen(true)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors w-full"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <div className="border-t border-white/10 my-2" />
                <button 
                  onClick={logout}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Mobile Navigation Tabs (hidden on desktop - nav is in header) */}
      <div className="lg:hidden border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
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

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-400 font-medium">Loading...</p>
        </div>
      </div>
    }>
      <HomeWithSearchParams />
    </Suspense>
  );
}

