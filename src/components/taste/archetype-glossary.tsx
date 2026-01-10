'use client';

import { useState } from 'react';
import { X, BookOpen, ChevronDown, ChevronUp, Info } from 'lucide-react';

interface ArchetypeGlossaryProps {
  isOpen: boolean;
  onClose: () => void;
}

// P3-13: Comprehensive archetype definitions and explanations
const ARCHETYPE_DATA = [
  {
    name: 'The Escapist',
    emoji: '🌌',
    description: 'You watch anime primarily for immersive world-building and to escape reality.',
    traits: ['Fantasy enthusiast', 'Isekai lover', 'World-builder appreciation'],
    genres: ['Isekai', 'Fantasy', 'Sci-Fi', 'Adventure'],
    examples: ['Sword Art Online', 'Re:Zero', 'Made in Abyss'],
  },
  {
    name: 'The Analyst',
    emoji: '🧠',
    description: 'You appreciate complex narratives, deep themes, and intellectual stimulation.',
    traits: ['Loves plot twists', 'Enjoys theories', 'Appreciates symbolism'],
    genres: ['Psychological', 'Mystery', 'Thriller', 'Seinen'],
    examples: ['Death Note', 'Monster', 'Steins;Gate'],
  },
  {
    name: 'The Romantic',
    emoji: '💕',
    description: 'You\'re drawn to emotional connections, relationships, and heartfelt stories.',
    traits: ['Ships characters', 'Loves slow burns', 'Emotional investment'],
    genres: ['Romance', 'Drama', 'Slice of Life', 'Shoujo'],
    examples: ['Your Lie in April', 'Toradora!', 'Fruits Basket'],
  },
  {
    name: 'The Thrill-Seeker',
    emoji: '⚡',
    description: 'You crave action, excitement, and adrenaline-pumping sequences.',
    traits: ['Hype moments lover', 'Battle enthusiast', 'Power scaling fan'],
    genres: ['Action', 'Shounen', 'Sports', 'Martial Arts'],
    examples: ['Attack on Titan', 'Demon Slayer', 'Jujutsu Kaisen'],
  },
  {
    name: 'The Aesthete',
    emoji: '🎨',
    description: 'Visual quality and artistic expression are paramount to your enjoyment.',
    traits: ['Sakuga appreciation', 'Art style focus', 'Cinematography aware'],
    genres: ['Any with strong visuals', 'Kyoto Animation works', 'Ufotable productions'],
    examples: ['Violet Evergarden', 'Mob Psycho 100', 'Fate series'],
  },
  {
    name: 'The Completionist',
    emoji: '📚',
    description: 'You aim to experience everything a series offers, including all adaptations.',
    traits: ['Finishes everything', 'Reads source material', 'Watches all seasons'],
    genres: ['Long-running series', 'Franchise anime', 'Adaptations'],
    examples: ['One Piece', 'Naruto', 'JoJo\'s Bizarre Adventure'],
  },
  {
    name: 'The Trendsetter',
    emoji: '🔥',
    description: 'You\'re always watching the latest seasonal hits and popular releases.',
    traits: ['Watches seasonally', 'Discusses online', 'First-day viewer'],
    genres: ['Current season', 'Popular releases', 'Highly anticipated'],
    examples: ['Whatever\'s trending this season'],
  },
  {
    name: 'The Nostalgist',
    emoji: '📺',
    description: 'You have deep appreciation for classic anime and older productions.',
    traits: ['Loves classics', 'Appreciates history', 'Old-school aesthetic fan'],
    genres: ['90s/2000s anime', 'Classic franchises', 'Retro style'],
    examples: ['Cowboy Bebop', 'Neon Genesis Evangelion', 'Dragon Ball'],
  },
  {
    name: 'The Connoisseur',
    emoji: '🍷',
    description: 'You seek out hidden gems, underrated series, and niche content.',
    traits: ['Hipster tendencies', 'Avoids mainstream', 'Unique taste'],
    genres: ['Obscure', 'Experimental', 'Indie productions'],
    examples: ['Tatami Galaxy', 'Ping Pong', 'Mononoke'],
  },
  {
    name: 'The Casual',
    emoji: '😊',
    description: 'You watch anime for simple enjoyment without overthinking.',
    traits: ['Relaxed viewer', 'No pressure', 'Fun-focused'],
    genres: ['Comedy', 'Slice of Life', 'Iyashikei'],
    examples: ['Nichijou', 'K-On!', 'Yuru Camp'],
  },
];

// Additional glossary terms for taste profile
const GLOSSARY_TERMS = [
  {
    term: 'Affinity Score',
    definition: 'A weighted calculation combining your ratings, watch time, and completion rate for a genre or category.',
  },
  {
    term: 'Diversity Index',
    definition: 'Measures how varied your anime consumption is across different genres, formats, and demographics.',
  },
  {
    term: 'Taste Fingerprint',
    definition: 'A unique code representing your viewing patterns, preferences, and behavioral metrics.',
  },
  {
    term: 'Recency Bias',
    definition: 'Your tendency to rate recent anime differently than older ones (positive = rate newer higher).',
  },
  {
    term: 'Popularity Correlation',
    definition: 'How closely your ratings align with mainstream popularity (-1 to 1, negative = contrarian).',
  },
  {
    term: 'Completion Rate',
    definition: 'The percentage of anime you finish versus drop from your list.',
  },
  {
    term: 'Binge Factor',
    definition: 'How quickly you consume anime relative to their air dates.',
  },
  {
    term: 'Risk Profile',
    definition: 'Your willingness to try new or unfamiliar anime based on your exploration patterns.',
  },
];

export function ArchetypeGlossary({ isOpen, onClose }: ArchetypeGlossaryProps) {
  const [expandedArchetype, setExpandedArchetype] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'archetypes' | 'glossary'>('archetypes');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-900 rounded-2xl border border-white/10 w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-white/10 p-6 z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-purple-400" />
                Taste Profile Glossary
              </h2>
              <p className="text-gray-400 text-sm mt-1">Understanding your anime taste analysis</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('archetypes')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'archetypes'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              🎭 Archetypes
            </button>
            <button
              onClick={() => setActiveTab('glossary')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'glossary'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              📖 Terms & Metrics
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
          {activeTab === 'archetypes' ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-400 mb-4">
                Archetypes represent your primary motivation for watching anime. Most viewers are a combination of 2-3 archetypes.
              </p>
              {ARCHETYPE_DATA.map((archetype) => (
                <div 
                  key={archetype.name}
                  className="rounded-xl bg-white/5 border border-white/10 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedArchetype(
                      expandedArchetype === archetype.name ? null : archetype.name
                    )}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{archetype.emoji}</span>
                      <div className="text-left">
                        <h3 className="font-bold text-white">{archetype.name}</h3>
                        <p className="text-sm text-gray-400 line-clamp-1">{archetype.description}</p>
                      </div>
                    </div>
                    {expandedArchetype === archetype.name ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  
                  {expandedArchetype === archetype.name && (
                    <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
                      <p className="text-gray-300 text-sm">{archetype.description}</p>
                      
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Key Traits</p>
                        <div className="flex flex-wrap gap-2">
                          {archetype.traits.map((trait) => (
                            <span key={trait} className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs">
                              {trait}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Common Genres</p>
                        <div className="flex flex-wrap gap-2">
                          {archetype.genres.map((genre) => (
                            <span key={genre} className="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-xs">
                              {genre}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Example Anime</p>
                        <p className="text-sm text-gray-400">{archetype.examples.join(', ')}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-400 mb-4">
                Understanding the metrics and calculations used in your taste profile analysis.
              </p>
              {GLOSSARY_TERMS.map((item) => (
                <div 
                  key={item.term}
                  className="p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-bold text-white">{item.term}</h3>
                      <p className="text-sm text-gray-400 mt-1">{item.definition}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Export a button component to trigger the glossary
export function GlossaryButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-colors text-sm"
    >
      <BookOpen className="w-4 h-4" />
      <span>Glossary</span>
    </button>
  );
}
