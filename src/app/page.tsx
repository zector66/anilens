'use client';

import { useState } from 'react';
import Image from 'next/image';
import { LoginButton } from '@/components/auth/login-button';
import { useAuth } from '@/hooks/use-auth';
import { TasteProfile } from '@/components/taste/taste-profile';
import { GameHub } from '@/components/games/game-hub';
import { Recommendations } from '@/components/recommendations/recommendations';
import { PersonalityTest } from '@/components/personality/personality-test';
import { 
  BarChart3, 
  Brain, 
  Gamepad2, 
  Users, 
  TrendingUp, 
  Sparkles,
  ChevronRight,
  Zap,
  Heart,
  Share2,
  LogOut,
  Settings
} from 'lucide-react';
import { SettingsPanel } from '@/components/settings/settings-panel';

type TabType = 'taste' | 'games' | 'recommendations' | 'personality';

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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">AniLens</span>
            </div>
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
              Anime DNA
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Deep analytics, interactive games, and personalized insights that reveal your true anime taste. 
            Connect with friends and compare your otaku profiles.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <LoginButton variant="hero" />
            <a 
              href="#demo" 
              className="group flex items-center gap-2 px-6 py-3 text-gray-300 hover:text-white transition-colors"
            >
              or try a demo
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
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
                { value: '∞', label: 'Your Anime' },
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
            <p className="text-gray-400 max-w-xl mx-auto">Unlock deep insights into your anime preferences with our comprehensive suite of tools</p>
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
                icon: Brain,
                title: 'Personality Insights',
                description: 'Discover your anime personality type: Completionist, Seasonal Tourist, Art Snob, and more.',
                gradient: 'from-green-500 to-emerald-500',
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
                description: 'AI-powered suggestions based on your unique taste profile and hidden preferences.',
                gradient: 'from-pink-500 to-rose-500',
              },
              {
                icon: Share2,
                title: 'Shareable Reports',
                description: 'Generate beautiful cards and reports to share your anime journey on social media.',
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

      {/* Demo Section */}
      <section id="demo" className="relative z-10 py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Try Before You Login</h2>
            <p className="text-gray-400">Enter any public AniList username to preview the experience</p>
          </div>
          
          <DemoLookup />
        </div>
      </section>

      {/* Feature Previews */}
      <section className="relative z-10 py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">See It In Action</h2>
            <p className="text-gray-400">Real screenshots from actual users</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Preview Cards */}
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              <div className="p-4 bg-purple-500/10 border-b border-white/10">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  Taste Analytics
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Action</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="w-4/5 h-full bg-red-500 rounded-full" />
                    </div>
                    <span className="text-white font-medium">82%</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Romance</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="w-3/5 h-full bg-pink-500 rounded-full" />
                    </div>
                    <span className="text-white font-medium">64%</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Comedy</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="w-1/2 h-full bg-yellow-500 rounded-full" />
                    </div>
                    <span className="text-white font-medium">51%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              <div className="p-4 bg-blue-500/10 border-b border-white/10">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-blue-400" />
                  OP/ED Guessing
                </h3>
              </div>
              <div className="p-4 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">🎵</span>
                </div>
                <p className="text-white font-medium mb-1">Now Playing...</p>
                <p className="text-xs text-gray-500">Guess which anime this opening is from!</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-white/5 text-xs text-gray-400">Option A</div>
                  <div className="p-2 rounded-lg bg-white/5 text-xs text-gray-400">Option B</div>
                </div>
              </div>
            </div>
            
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              <div className="p-4 bg-green-500/10 border-b border-white/10">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  Smart Recs
                </h3>
              </div>
              <div className="p-4">
                <div className="flex gap-3 items-start">
                  <div className="w-12 h-16 rounded-lg bg-gradient-to-br from-purple-500/30 to-blue-500/30 shrink-0" />
                  <div>
                    <p className="text-white font-medium text-sm">Recommended for You</p>
                    <p className="text-xs text-gray-500 mt-1">Based on your love for psychological thrillers</p>
                    <div className="mt-2 flex gap-1">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300">98% match</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="p-12 rounded-3xl bg-linear-to-br from-purple-500/20 to-blue-500/20 border border-white/10">
            <Heart className="w-12 h-12 text-pink-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Discover Your Anime DNA?</h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
              Join anime fans who have uncovered their true taste. It only takes a minute to get started.
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

// Demo lookup component for trying without login
function DemoLookup() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoUser, setDemoUser] = useState<{ id: number; name: string; avatar?: { large?: string } } | null>(null);

  const handleLookup = async () => {
    if (!username.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const query = `
        query ($name: String) {
          User(name: $name) {
            id
            name
            avatar { large }
            statistics {
              anime {
                count
                meanScore
                minutesWatched
              }
            }
          }
        }
      `;
      
      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { name: username } }),
      });
      
      const data = await response.json();
      
      if (data.errors) {
        setError('User not found. Check the username and try again.');
        setDemoUser(null);
      } else if (data.data?.User) {
        setDemoUser(data.data.User);
      }
    } catch {
      setError('Failed to lookup user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="flex gap-3">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
          placeholder="Enter AniList username..."
          className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
        />
        <button
          onClick={handleLookup}
          disabled={loading || !username.trim()}
          className="px-6 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Lookup'
          )}
        </button>
      </div>
      
      {error && (
        <p className="mt-3 text-sm text-red-400 text-center">{error}</p>
      )}
      
      {demoUser && (
        <div className="mt-6 p-6 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-4 mb-4">
            {demoUser.avatar?.large && (
              <Image
                src={demoUser.avatar.large}
                alt={demoUser.name}
                width={64}
                height={64}
                className="rounded-xl"
              />
            )}
            <div>
              <h3 className="text-xl font-bold text-white">{demoUser.name}</h3>
              <p className="text-sm text-gray-400">AniList User</p>
            </div>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Found! Login with AniList to view {demoUser.name}&apos;s full taste profile, play games with their list, and more.
          </p>
          <LoginButton variant="hero" />
        </div>
      )}
      
      <p className="mt-4 text-xs text-gray-500 text-center">
        Try: &quot;Josh&quot;, &quot;Friendly&quot;, or any public AniList username
      </p>
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
  
  const tabs = [
    { id: 'taste' as const, label: 'Taste Profile', icon: BarChart3 },
    { id: 'games' as const, label: 'Games', icon: Gamepad2 },
    { id: 'recommendations' as const, label: 'Recommendations', icon: TrendingUp },
    { id: 'personality' as const, label: 'Personality', icon: Brain },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'taste':
        return <TasteProfile userId={user?.id} />;
      case 'games':
        return <GameHub />;
      case 'recommendations':
        return <Recommendations userId={user?.id} />;
      case 'personality':
        return <PersonalityTest userId={user?.id} />;
      default:
        return <TasteProfile />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">AniLens</span>
            </div>

            <div className="flex items-center gap-2">
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
                onClick={() => setActiveTab(tab.id)}
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
        {renderContent()}
      </main>
    </div>
  );
}

