'use client';

import { useState, useMemo } from 'react';
import { 
  Trophy, 
  TrendingUp, 
  Crown, 
  Medal,
  Flame,
  Calendar,
  Filter,
  ChevronDown,
  Loader2,
  Tv,
  BookOpen,
  Users,
  Award,
  Target
} from 'lucide-react';
import { 
  useAllTimeLeaderboard, 
  useTrendingLeaderboard, 
  EntityType, 
  LeaderboardEntry,
  SortBy 
} from '@/hooks/use-bracket-leaderboards';
import { useQuery } from '@tanstack/react-query';
import { anilistClient } from '@/lib/anilist-client';

interface EntityDetails {
  id: number;
  title?: string;
  name?: string;
  image: string;
}

// Batch fetch entity details from AniList
function useEntityDetails(entityType: EntityType, entityIds: number[]) {
  return useQuery({
    queryKey: ['entityDetails', entityType, entityIds.slice(0, 50).join(',')],
    queryFn: async (): Promise<Map<number, EntityDetails>> => {
      if (!entityIds.length) return new Map();

      const ids = entityIds.slice(0, 50);
      const map = new Map<number, EntityDetails>();

      if (entityType === 'character') {
        // Fetch characters
        const query = `
          query ($ids: [Int]) {
            Page(perPage: 50) {
              characters(id_in: $ids) {
                id
                name { full }
                image { large }
              }
            }
          }
        `;
        const result = await anilistClient.request<{
          Page: { characters: Array<{ id: number; name: { full: string }; image: { large: string } }> }
        }>(query, { ids });

        for (const char of result.Page?.characters || []) {
          map.set(char.id, {
            id: char.id,
            name: char.name?.full || 'Unknown Character',
            image: char.image?.large || '',
          });
        }
      } else if (entityType === 'anime' || entityType === 'manga' || entityType === 'openings' || entityType === 'endings') {
        // Fetch anime/manga/openings/endings (all use media type)
        const query = `
          query ($ids: [Int]) {
            Page(perPage: 50) {
              media(id_in: $ids) {
                id
                title { romaji english }
                coverImage { large }
              }
            }
          }
        `;
        const result = await anilistClient.request<{
          Page: { media: Array<{ id: number; title: { romaji: string; english: string }; coverImage: { large: string } }> }
        }>(query, { ids });

        for (const media of result.Page?.media || []) {
          map.set(media.id, {
            id: media.id,
            title: media.title?.english || media.title?.romaji || 'Unknown',
            image: media.coverImage?.large || '',
          });
        }
      }

      return map;
    },
    enabled: entityIds.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

interface LeaderboardRowProps {
  rank: number;
  entry: LeaderboardEntry;
  details?: EntityDetails;
  entityType: EntityType;
}

function LeaderboardRow({ rank, entry, details, entityType }: LeaderboardRowProps) {
  const name = entityType === 'character' 
    ? (details?.name || `Character #${entry.entityId}`)
    : (details?.title || `${entityType === 'anime' ? 'Anime' : 'Manga'} #${entry.entityId}`);

  const getRankBadge = () => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 text-center text-gray-500 font-medium">{rank}</span>;
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
      {/* Rank */}
      <div className="w-8 flex items-center justify-center shrink-0">
        {getRankBadge()}
      </div>

      {/* Image */}
      <div className="w-12 h-16 rounded-lg overflow-hidden bg-white/10 shrink-0">
        {details?.image ? (
          <img
            src={details.image}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {entityType === 'character' ? (
              <Users className="w-5 h-5 text-gray-500" />
            ) : entityType === 'manga' ? (
              <BookOpen className="w-5 h-5 text-gray-500" />
            ) : (
              <Tv className="w-5 h-5 text-gray-500" />
            )}
          </div>
        )}
      </div>

      {/* Name & Stats */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{name}</p>
        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
          <span className="flex items-center gap-1">
            <Trophy className="w-3 h-3 text-yellow-400" />
            {entry.wins} wins
          </span>
          <span>{entry.winRate}% rate</span>
          {entry.championships > 0 && (
            <span className="flex items-center gap-1 text-purple-400">
              <Crown className="w-3 h-3" />
              {entry.championships}
            </span>
          )}
        </div>
      </div>

      {/* Appearances */}
      <div className="text-right shrink-0">
        <p className="text-sm text-gray-400">{entry.appearances}</p>
        <p className="text-xs text-gray-500">battles</p>
      </div>
    </div>
  );
}

interface BracketLeaderboardProps {
  onBack?: () => void;
}

export function BracketLeaderboard({ onBack }: BracketLeaderboardProps) {
  const [entityType, setEntityType] = useState<EntityType>('anime');
  const [view, setView] = useState<'alltime' | 'trending7' | 'trending30'>('alltime');
  const [sortBy, setSortBy] = useState<SortBy>('wins');
  
  // Smart defaults for min appearances based on time window
  const getDefaultMinAppearances = (viewType: typeof view) => {
    switch (viewType) {
      case 'alltime': return 3;
      case 'trending7': return 2;
      case 'trending30': return 2;
      default: return 3;
    }
  };
  
  const [minAppearances, setMinAppearances] = useState(getDefaultMinAppearances('alltime'));
  const [showFilters, setShowFilters] = useState(false);

  // Handle view changes with smart defaults
  const handleViewChange = (newView: typeof view) => {
    setView(newView);
    
    // Auto-adjust min appearances for trending views
    if (newView !== 'alltime') {
      const defaultMin = getDefaultMinAppearances(newView);
      if (minAppearances > defaultMin) {
        setMinAppearances(defaultMin);
      }
    }
  };

  // Fetch leaderboard data
  const allTimeQuery = useAllTimeLeaderboard(entityType, {
    minAppearances,
    limit: 50,
    sortBy,
    enabled: view === 'alltime',
  });

  const trending7Query = useTrendingLeaderboard(entityType, {
    days: 7,
    minAppearances: 1, // Much lower threshold for trending
    limit: 50,
    enabled: view === 'trending7',
  });

  const trending30Query = useTrendingLeaderboard(entityType, {
    days: 30,
    minAppearances: 1, // Much lower threshold for trending
    limit: 50,
    enabled: view === 'trending30',
  });

  // Get current data based on view
  const currentQuery = view === 'alltime' 
    ? allTimeQuery 
    : view === 'trending7' 
      ? trending7Query 
      : trending30Query;

  const entries = currentQuery.data?.items || [];

  // Fetch entity details
  const entityIds = useMemo(() => entries.map(e => e.entityId), [entries]);
  const detailsQuery = useEntityDetails(entityType, entityIds);
  const detailsMap = detailsQuery.data;

  const isLoading = currentQuery.isLoading || detailsQuery.isLoading;
  const hasNoData = !isLoading && entries.length === 0;

  const getEntityIcon = () => {
    switch (entityType) {
      case 'character': return <Users className="w-5 h-5" />;
      case 'manga': return <BookOpen className="w-5 h-5" />;
      case 'openings': return <Target className="w-5 h-5" />;
      case 'endings': return <Award className="w-5 h-5" />;
      default: return <Tv className="w-5 h-5" />;
    }
  };

  const getViewIcon = () => {
    switch (view) {
      case 'trending7': return <Flame className="w-4 h-4 text-orange-400" />;
      case 'trending30': return <TrendingUp className="w-4 h-4 text-green-400" />;
      default: return <Trophy className="w-4 h-4 text-yellow-400" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 text-purple-400 mb-4">
          <Award className="w-5 h-5" />
          <span>Hall of Fame</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Bracket Legends</h2>
        <p className="text-gray-400">
          The most picked winners across all bracket tournaments
        </p>
      </div>

      {/* Entity Type Tabs */}
      <div className="flex justify-center gap-2 flex-wrap">
        {(['anime', 'manga', 'character', 'openings', 'endings'] as EntityType[]).map((type) => (
          <button
            key={type}
            onClick={() => setEntityType(type)}
            className={`px-3 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
              entityType === type
                ? 'bg-purple-500 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {type === 'character' ? <Users className="w-4 h-4" /> : 
             type === 'manga' ? <BookOpen className="w-4 h-4" /> : 
             type === 'openings' ? <Target className="w-4 h-4" /> :
             type === 'endings' ? <Award className="w-4 h-4" /> :
             <Tv className="w-4 h-4" />}
            <span className="capitalize">{type === 'openings' ? 'Openings' : type === 'endings' ? 'Endings' : type}</span>
          </button>
        ))}
      </div>

      {/* View Toggle */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => handleViewChange('alltime')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
            view === 'alltime'
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          All-Time
        </button>
        <button
          onClick={() => handleViewChange('trending7')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
            view === 'trending7'
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          This Week
        </button>
        <button
          onClick={() => handleViewChange('trending30')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
            view === 'trending30'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          This Month
        </button>
      </div>

      {/* Filters */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-sm transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filters
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        <div className="flex items-center gap-2 text-sm text-gray-400">
          {getViewIcon()}
          <span>{entries.length} entries</span>
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
          {view === 'alltime' && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Sort by</label>
              <div className="flex gap-2">
                {(['wins', 'championships', 'winrate'] as SortBy[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      sortBy === s
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {s === 'wins' ? 'Total Wins' : s === 'championships' ? 'Championships' : 'Win Rate'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Min. appearances: {minAppearances}
            </label>
            <input
              type="range"
              min={1}
              max={100}
              value={minAppearances}
              onChange={(e) => setMinAppearances(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>100</span>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          <p className="text-gray-400">Loading leaderboard...</p>
        </div>
      )}

      {/* Empty State */}
      {hasNoData && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
            {getEntityIcon()}
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {minAppearances > 1 
              ? `Not enough results for "Min Entries ≥ ${minAppearances}"` 
              : 'No Data Yet'}
          </h3>
          <p className="text-gray-400 text-sm max-w-sm mx-auto mb-6">
            {minAppearances > 1 
              ? `This category is new — try lowering the minimum entries filter to explore more results.`
              : view === 'alltime' 
                ? `No ${entityType} have enough bracket appearances yet. Play more brackets to see the legends emerge!`
                : `No ${entityType} bracket activity in the selected time period.`}
          </p>
          
          {minAppearances > 1 && (
            <div className="flex flex-col gap-2 max-w-xs mx-auto">
              <button
                onClick={() => setMinAppearances(Math.max(1, minAppearances - 2))}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
              >
                Lower Min Entries
              </button>
              <button
                onClick={() => setMinAppearances(1)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
              >
                Show Everything (1+)
              </button>
              {view !== 'alltime' && (
                <button
                  onClick={() => handleViewChange('alltime')}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
                >
                  Switch to All-Time
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Leaderboard List */}
      {!isLoading && entries.length > 0 && (
        <div className="space-y-2">
          {entries.map((entry, index) => (
            <LeaderboardRow
              key={entry.entityId}
              rank={index + 1}
              entry={entry}
              details={detailsMap?.get(entry.entityId)}
              entityType={entityType}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      {onBack && (
        <div className="text-center pt-4">
          <button
            onClick={onBack}
            className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
          >
            Back to Games
          </button>
        </div>
      )}
    </div>
  );
}
