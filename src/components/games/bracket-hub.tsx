'use client';

import { useState, useEffect } from 'react';
import { 
  Trophy, 
  Play, 
  Settings, 
  History, 
  Award, 
  Users,
  Sparkles,
  ChevronRight,
  Swords
} from 'lucide-react';
import { BracketBattle } from './bracket-battle';
import { BracketConfig, BracketConfiguration } from './bracket-config';
import { HallOfFame } from './hall-of-fame';
import { useAuth } from '@/hooks/use-auth';
import { MediaListEntry } from '@/types/anilist';

type BracketView = 'home' | 'config' | 'battle' | 'halloffame' | 'history';

interface BracketHubProps {
  userId?: number;
}

interface BracketHistory {
  id: string;
  tournamentName: string;
  battleType: 'anime' | 'manga' | 'openings' | 'endings' | 'characters';
  bracketSize: number;
  completedAt: string;
  winner: {
    id: number;
    title: string;
    image: string;
  };
  config: BracketConfiguration;
}

export function BracketHub({ userId }: BracketHubProps) {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<BracketView>('home');
  const [config, setConfig] = useState<BracketConfiguration | null>(null);
  const [battleEntries, setBattleEntries] = useState<MediaListEntry[]>([]);
  const [isStartingBattle, setIsStartingBattle] = useState(false);
  const [bracketHistory, setBracketHistory] = useState<BracketHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load bracket history
  useEffect(() => {
    const loadHistory = async () => {
      setIsLoadingHistory(true);
      try {
        // Mock history data - replace with actual API call
        const mockHistory: BracketHistory[] = [
          {
            id: 'bracket_1',
            tournamentName: 'My Anime Showdown 2024',
            battleType: 'anime',
            bracketSize: 16,
            completedAt: '2024-01-15T10:30:00Z',
            winner: {
              id: 1,
              title: 'Attack on Titan',
              image: '/api/placeholder/120/180',
            },
            config: {
              seedingMode: 'hybrid',
              formatFilters: ['TV', 'MOVIE'],
              statusFilters: ['COMPLETED'],
              noSequels: false,
              highConfidenceOnly: false,
              excludeAdult: true,
              difficultyLevel: 30,
              tournamentName: 'My Anime Showdown 2024',
              bracketSize: 16,
            },
          },
        ];
        setBracketHistory(mockHistory);
      } catch (error) {
        console.error('Failed to load bracket history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    if (userId) {
      loadHistory();
    }
  }, [userId]);

  const handleConfigSubmit = async (newConfig: BracketConfiguration) => {
    setConfig(newConfig);
    
    // Generate bracket entries based on configuration
    setIsStartingBattle(true);
    try {
      // Mock entries generation - replace with actual seeding logic
      const mockEntries: MediaListEntry[] = [];
      setBattleEntries(mockEntries);
      
      // Start the battle
      setCurrentView('battle');
    } catch (error) {
      console.error('Failed to generate bracket:', error);
    } finally {
      setIsStartingBattle(false);
    }
  };

  const handleBattleComplete = (winner: any) => {
    // Save to history
    const newHistory: BracketHistory = {
      id: `bracket_${Date.now()}`,
      tournamentName: config?.tournamentName || 'My Bracket',
      battleType: 'anime', // Determine from config
      bracketSize: config?.bracketSize || 16,
      completedAt: new Date().toISOString(),
      winner: {
        id: winner.id,
        title: winner.title,
        image: winner.image,
      },
      config: config!,
    };
    
    setBracketHistory(prev => [newHistory, ...prev]);
    setCurrentView('home');
  };

  const renderNavigation = () => (
    <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
      {[
        { id: 'home' as BracketView, label: 'Home', icon: Trophy },
        { id: 'config' as BracketView, label: 'Create Bracket', icon: Settings },
        { id: 'history' as BracketView, label: 'History', icon: History },
        { id: 'halloffame' as BracketView, label: 'Hall of Fame', icon: Award },
      ].map((view) => (
        <button
          key={view.id}
          onClick={() => setCurrentView(view.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            currentView === view.id
              ? 'bg-purple-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <view.icon className="w-4 h-4" />
          {view.label}
        </button>
      ))}
    </div>
  );

  const renderHome = () => (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="text-center py-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Trophy className="w-8 h-8 text-purple-400" />
          <h1 className="text-3xl font-bold text-white">Anime Bracket Battle</h1>
          <Trophy className="w-8 h-8 text-purple-400" />
        </div>
        <p className="text-gray-400 max-w-2xl mx-auto mb-8">
          Create personalized anime brackets with advanced seeding modes, filters, and difficulty settings. 
          Compete with the community and climb the Hall of Fame!
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => setCurrentView('config')}
            className="flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
          >
            <Play className="w-5 h-5" />
            Create New Bracket
          </button>
          <button
            onClick={() => setCurrentView('halloffame')}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
          >
            <Award className="w-5 h-5" />
            View Hall of Fame
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <Swords className="w-5 h-5 text-purple-400" />
            <h3 className="font-medium text-white">Total Brackets</h3>
          </div>
          <div className="text-2xl font-bold text-purple-400">{bracketHistory.length}</div>
          <div className="text-sm text-gray-400">Completed tournaments</div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-400" />
            <h3 className="font-medium text-white">Community</h3>
          </div>
          <div className="text-2xl font-bold text-blue-400">2,847</div>
          <div className="text-sm text-gray-400">Active players</div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <h3 className="font-medium text-white">Features</h3>
          </div>
          <div className="text-2xl font-bold text-yellow-400">5+</div>
          <div className="text-sm text-gray-400">Seeding modes</div>
        </div>
      </div>

      {/* Recent History */}
      {bracketHistory.length > 0 && (
        <div className="bg-white/5 rounded-lg p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-purple-400" />
            Recent Brackets
          </h3>
          <div className="space-y-3">
            {bracketHistory.slice(0, 3).map((bracket) => (
              <div
                key={bracket.id}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={bracket.winner.image}
                    alt={bracket.winner.title}
                    className="w-12 h-16 rounded object-cover"
                  />
                  <div>
                    <h4 className="font-medium text-white">{bracket.tournamentName}</h4>
                    <p className="text-sm text-gray-400">Winner: {bracket.winner.title}</p>
                    <p className="text-xs text-gray-500">
                      {bracket.bracketSize} entries • {new Date(bracket.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            ))}
          </div>
          
          {bracketHistory.length > 3 && (
            <button
              onClick={() => setCurrentView('history')}
              className="mt-4 text-purple-400 hover:text-purple-300 text-sm font-medium"
            >
              View all history →
            </button>
          )}
        </div>
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Bracket History</h2>
      
      {isLoadingHistory ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 bg-white/5 rounded-lg border border-white/10 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/3 mb-2" />
              <div className="h-3 bg-white/10 rounded w-1/2 mb-1" />
              <div className="h-3 bg-white/10 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : bracketHistory.length === 0 ? (
        <div className="text-center py-12">
          <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No bracket history yet</h3>
          <p className="text-gray-400 mb-6">Complete your first bracket to see it here!</p>
          <button
            onClick={() => setCurrentView('config')}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
          >
            Create Your First Bracket
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bracketHistory.map((bracket) => (
            <div
              key={bracket.id}
              className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={bracket.winner.image}
                    alt={bracket.winner.title}
                    className="w-16 h-20 rounded object-cover"
                  />
                  <div>
                    <h3 className="text-lg font-medium text-white mb-1">{bracket.tournamentName}</h3>
                    <p className="text-gray-400 mb-2">
                      Winner: <span className="text-purple-400">{bracket.winner.title}</span>
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{bracket.bracketSize} entries</span>
                      <span>•</span>
                      <span>{new Date(bracket.completedAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="capitalize">{bracket.battleType}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400 mb-1">Seeding Mode</div>
                  <div className="text-sm font-medium text-purple-400 capitalize">
                    {bracket.config.seedingMode.replace('-', ' ')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return renderHome();
      case 'config':
        return (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Create New Bracket</h2>
            <BracketConfig onConfigChange={handleConfigSubmit} />
          </div>
        );
      case 'battle':
        return battleEntries.length > 0 ? (
          <BracketBattle
            entries={battleEntries}
            onComplete={handleBattleComplete}
            onBack={() => setCurrentView('home')}
            battleType="anime"
            bracketSize={config?.bracketSize || 16}
          />
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <Swords className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Preparing Battle...</h3>
            <p className="text-gray-400">Generating bracket based on your configuration</p>
          </div>
        );
      case 'halloffame':
        return (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Hall of Fame</h2>
            <HallOfFame />
          </div>
        );
      case 'history':
        return renderHistory();
      default:
        return renderHome();
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {currentView !== 'battle' && renderNavigation()}
      {renderContent()}
      
      {isStartingBattle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1f] rounded-lg p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-white">Generating bracket...</span>
            </div>
            <p className="text-gray-400 text-sm">Applying seeding algorithm and filters</p>
          </div>
        </div>
      )}
    </div>
  );
}
