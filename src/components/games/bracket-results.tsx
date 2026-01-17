'use client';

import React, { useMemo } from 'react';
import { Trophy, AlertTriangle, TrendingUp, TrendingDown, Star, Swords, Share2, Download } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { MediaListEntry } from '@/types/anilist';

interface BracketResult {
  id: number;
  title: string;
  image: string;
  round: number;      // Round they reached (1 = first round loss, higher = further)
  seed?: number;      // Seed position if seeded
  userScore?: number; // User's AniList score (1-10)
}

interface BracketInconsistency {
  winner: BracketResult;
  loser: BracketResult;
  scoreDiff: number;  // loser.score - winner.score (positive = upset)
  round: number;
  type: 'upset' | 'expected';
}

interface BracketAnalysis {
  winner: BracketResult;
  runnerUp: BracketResult;
  biggestUpsets: BracketInconsistency[];
  mostConsistent: BracketInconsistency[];
  inconsistencyScore: number; // 0-100, higher = more bracket picks disagree with scores
  totalMatches: number;
  upsetCount: number;
}

interface BracketResultsProps {
  bracketResults: BracketResult[];
  matchHistory: Array<{ winner: BracketResult; loser: BracketResult; round: number }>;
  entries: MediaListEntry[];
  onPlayAgain: () => void;
  onBack: () => void;
}

export function BracketResults({ 
  bracketResults, 
  matchHistory, 
  entries,
  onPlayAgain, 
  onBack 
}: BracketResultsProps) {
  
  // Enrich bracket results with user scores from entries
  const enrichedResults = useMemo(() => {
    const scoreMap = new Map<number, number>();
    entries.forEach(e => {
      if (e.media?.id && e.score) {
        scoreMap.set(e.media.id, e.score);
      }
    });
    
    return bracketResults.map(r => ({
      ...r,
      userScore: scoreMap.get(r.id),
    }));
  }, [bracketResults, entries]);

  // Analyze bracket for inconsistencies
  const analysis = useMemo<BracketAnalysis>(() => {
    const inconsistencies: BracketInconsistency[] = [];
    
    // Enrich match history with scores
    const enrichedHistory = matchHistory.map(m => {
      const winnerEntry = entries.find(e => e.media?.id === m.winner.id);
      const loserEntry = entries.find(e => e.media?.id === m.loser.id);
      
      const winner = { ...m.winner, userScore: winnerEntry?.score };
      const loser = { ...m.loser, userScore: loserEntry?.score };
      
      // Check for inconsistency: loser rated higher than winner
      if (winner.userScore && loser.userScore) {
        const scoreDiff = loser.userScore - winner.userScore;
        inconsistencies.push({
          winner,
          loser,
          scoreDiff,
          round: m.round,
          type: scoreDiff > 0 ? 'upset' : 'expected',
        });
      }
      
      return { winner, loser, round: m.round };
    });

    // Sort inconsistencies
    const upsets = inconsistencies
      .filter(i => i.type === 'upset')
      .sort((a, b) => b.scoreDiff - a.scoreDiff);
    
    const consistent = inconsistencies
      .filter(i => i.type === 'expected')
      .sort((a, b) => a.scoreDiff - b.scoreDiff);

    // Calculate inconsistency score
    const upsetCount = upsets.length;
    const totalWithScores = inconsistencies.length;
    const inconsistencyScore = totalWithScores > 0 
      ? Math.round((upsetCount / totalWithScores) * 100)
      : 0;

    // Find winner and runner-up
    const sortedByRound = [...enrichedResults].sort((a, b) => b.round - a.round);
    const winner = sortedByRound[0];
    const runnerUp = sortedByRound[1];

    return {
      winner,
      runnerUp,
      biggestUpsets: upsets.slice(0, 5),
      mostConsistent: consistent.slice(0, 3),
      inconsistencyScore,
      totalMatches: matchHistory.length,
      upsetCount,
    };
  }, [matchHistory, entries, enrichedResults]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Winner Card */}
      <div className="relative p-6 rounded-2xl bg-gradient-to-br from-yellow-500/20 via-amber-500/10 to-orange-500/20 border border-yellow-500/30 overflow-hidden">
        <div className="absolute top-4 right-4">
          <Trophy className="w-16 h-16 text-yellow-500/20" />
        </div>
        
        <div className="relative flex items-center gap-6">
          {analysis.winner?.image && (
            <div className="w-24 h-32 rounded-xl overflow-hidden ring-4 ring-yellow-500/50 shadow-lg shadow-yellow-500/20">
              <OptimizedImage
                src={analysis.winner.image}
                alt={analysis.winner.title}
                width={96}
                height={128}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium mb-1">
              <Trophy className="w-4 h-4" />
              CHAMPION
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{analysis.winner?.title}</h2>
            {analysis.winner?.userScore && (
              <div className="flex items-center gap-1 text-gray-400">
                <Star className="w-4 h-4 text-yellow-400" />
                <span>Your rating: {analysis.winner.userScore}/10</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inconsistency Score */}
      <div className="p-5 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">Bracket vs Score Consistency</h3>
          </div>
          <div className={`text-2xl font-bold ${
            analysis.inconsistencyScore > 50 ? 'text-red-400' : 
            analysis.inconsistencyScore > 25 ? 'text-yellow-400' : 
            'text-green-400'
          }`}>
            {100 - analysis.inconsistencyScore}%
          </div>
        </div>
        
        <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
          <div 
            className={`h-full rounded-full transition-all ${
              analysis.inconsistencyScore > 50 ? 'bg-red-500' : 
              analysis.inconsistencyScore > 25 ? 'bg-yellow-500' : 
              'bg-green-500'
            }`}
            style={{ width: `${100 - analysis.inconsistencyScore}%` }}
          />
        </div>
        
        <p className="text-sm text-gray-400">
          {analysis.inconsistencyScore > 50 ? (
            <>Your bracket picks often disagree with your scores. Heart over head! 💖</>
          ) : analysis.inconsistencyScore > 25 ? (
            <>Some upsets in your bracket. You followed your gut sometimes! 🤔</>
          ) : (
            <>Your bracket aligns well with your ratings. Very consistent! ✨</>
          )}
        </p>
        
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-sm">
          <span className="text-gray-500">{analysis.totalMatches} total matches</span>
          <span className="text-orange-400">{analysis.upsetCount} upsets (picked lower-rated)</span>
        </div>
      </div>

      {/* Biggest Upsets */}
      {analysis.biggestUpsets.length > 0 && (
        <div className="p-5 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-semibold text-white">Biggest Upsets</h3>
            <span className="text-xs text-gray-500">(You picked the lower-rated)</span>
          </div>
          
          <div className="space-y-3">
            {analysis.biggestUpsets.map((upset, i) => (
              <div 
                key={`${upset.winner.id}-${upset.loser.id}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20"
              >
                <div className="flex items-center gap-2 flex-1">
                  {upset.winner.image && (
                    <div className="w-10 h-14 rounded overflow-hidden shrink-0">
                      <OptimizedImage
                        src={upset.winner.image}
                        alt={upset.winner.title}
                        width={40}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{upset.winner.title}</p>
                    <p className="text-xs text-gray-500">
                      Your pick • {upset.winner.userScore}/10
                    </p>
                  </div>
                </div>
                
                <Swords className="w-4 h-4 text-gray-600 shrink-0" />
                
                <div className="flex items-center gap-2 flex-1 justify-end text-right">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-400 truncate">{upset.loser.title}</p>
                    <p className="text-xs text-red-400">
                      Lost • {upset.loser.userScore}/10 (+{upset.scoreDiff})
                    </p>
                  </div>
                  {upset.loser.image && (
                    <div className="w-10 h-14 rounded overflow-hidden shrink-0 opacity-60">
                      <OptimizedImage
                        src={upset.loser.image}
                        alt={upset.loser.title}
                        width={40}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Most Consistent Picks */}
      {analysis.mostConsistent.length > 0 && (
        <div className="p-5 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Most Decisive Wins</h3>
            <span className="text-xs text-gray-500">(Biggest score gaps)</span>
          </div>
          
          <div className="space-y-2">
            {analysis.mostConsistent.map((match, i) => (
              <div 
                key={`${match.winner.id}-${match.loser.id}`}
                className="flex items-center justify-between p-2 rounded-lg bg-green-500/5"
              >
                <span className="text-sm text-white">{match.winner.title}</span>
                <span className="text-xs text-green-400">
                  {match.winner.userScore}/10 beat {match.loser.userScore}/10
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white transition-colors font-medium"
        >
          Back to Games
        </button>
        <button
          onClick={onPlayAgain}
          className="flex-1 py-3 rounded-xl bg-purple-500 text-white font-bold hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
        >
          <Swords className="w-5 h-5" />
          New Bracket
        </button>
      </div>
    </div>
  );
}

export default BracketResults;
