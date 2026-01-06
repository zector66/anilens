'use client';

import { TasteProfile } from '@/types/anilist';
import { Sword, TrendingUp, Zap, Target, Flame, PieChart as PieChartIcon } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface BattleCategory {
  label: string;
  key: string;
  icon: LucideIcon;
  val1: number;
  val2: number;
  format: (v: number) => string;
  higherIsBetter: boolean;
}

interface TasteBattleProps {
  user1: {
    name: string;
    profile: TasteProfile;
  };
  user2: {
    name: string;
    profile: TasteProfile;
  };
}

export function TasteBattle({ user1, user2 }: TasteBattleProps) {
  const categories: BattleCategory[] = [
    {
      label: 'Mean Score',
      key: 'scorePatterns.meanScore',
      icon: TrendingUp,
      val1: user1.profile.scorePatterns.meanScore,
      val2: user2.profile.scorePatterns.meanScore,
      format: (v: number) => v.toFixed(2),
      higherIsBetter: true,
    },
    {
      label: 'Chaos Level',
      key: 'personalityTraits.chaosLevel',
      icon: Zap,
      val1: user1.profile.personalityTraits.chaosLevel,
      val2: user2.profile.personalityTraits.chaosLevel,
      format: (v: number) => v.toFixed(1),
      higherIsBetter: true,
    },
    {
      label: 'Completion Rate',
      key: 'behavioralMetrics.completionRate',
      icon: Target,
      val1: user1.profile.behavioralMetrics.completionRate * 100,
      val2: user2.profile.behavioralMetrics.completionRate * 100,
      format: (v: number) => `${v.toFixed(0)}%`,
      higherIsBetter: true,
    },
    {
      label: 'Emotional Damage',
      key: 'personalityTraits.emotionalDamageIndex',
      icon: Flame,
      val1: user1.profile.personalityTraits.emotionalDamageIndex,
      val2: user2.profile.personalityTraits.emotionalDamageIndex,
      format: (v: number) => v.toFixed(1),
      higherIsBetter: true,
    },
    {
      label: 'Mainstream Index',
      key: 'behavioralMetrics.mainstreamIndex',
      icon: TrendingUp,
      val1: user1.profile.behavioralMetrics.mainstreamIndex * 10,
      val2: user2.profile.behavioralMetrics.mainstreamIndex * 10,
      format: (v: number) => v.toFixed(1),
      higherIsBetter: true,
    },
    {
      label: 'Diversity Index',
      key: 'behavioralMetrics.diversityIndex',
      icon: PieChartIcon,
      val1: user1.profile.behavioralMetrics.diversityIndex * 10,
      val2: user2.profile.behavioralMetrics.diversityIndex * 10,
      format: (v: number) => v.toFixed(1),
      higherIsBetter: true,
    },
  ];

  const getWinner = (cat: BattleCategory) => {
    if (Math.abs(cat.val1 - cat.val2) < 0.01) return null;
    return cat.val1 > cat.val2 ? 1 : 2;
  };

  const user1Wins = categories.filter(c => getWinner(c) === 1).length;
  const user2Wins = categories.filter(c => getWinner(c) === 2).length;

  const getDNAAnalysis = () => {
    const overlaps = user1.profile.genreAffinity
      .filter(g1 => user2.profile.genreAffinity.some(g2 => g2.genre === g1.genre))
      .map(g => g.genre);

    if (overlaps.length >= 3) {
      return `You share a deep connection through ${overlaps.slice(0, 2).join(' and ')}. Your tastes are remarkably aligned!`;
    } else if (overlaps.length > 0) {
      return `While you both appreciate ${overlaps[0]}, your paths diverge significantly elsewhere. A unique mix!`;
    }
    return "Your anime DNAs are practically from different universes. Complete opposites attract?";
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between px-4">
        <div className="text-center flex-1">
          <h3 className="text-2xl font-black text-purple-400 uppercase tracking-tighter">{user1.name}</h3>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Challenger</p>
        </div>
        <div className="flex flex-col items-center px-8">
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-2">
            <Sword className="w-6 h-6 text-white" />
          </div>
          <div className="text-lg font-black text-white italic">VS</div>
        </div>
        <div className="text-center flex-1">
          <h3 className="text-2xl font-black text-blue-400 uppercase tracking-tighter">{user2.name}</h3>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Opponent</p>
        </div>
      </div>

      <div className="grid gap-4">
        {categories.map((cat, i) => {
          const winner = getWinner(cat);
          return (
            <div key={i} className="relative p-6 rounded-2xl bg-white/5 border border-white/10 overflow-hidden group">
              {/* Winner Highlight Background */}
              {winner === 1 && <div className="absolute inset-0 bg-purple-500/5 transition-opacity" />}
              {winner === 2 && <div className="absolute inset-0 bg-blue-500/5 transition-opacity" />}
              
              <div className="relative flex items-center justify-between gap-4">
                <div className={`flex-1 text-2xl font-black transition-colors ${winner === 1 ? 'text-purple-400' : 'text-white/40'}`}>
                  {cat.format(cat.val1)}
                </div>
                
                <div className="flex flex-col items-center min-w-[120px]">
                  <cat.icon className="w-5 h-5 text-gray-500 mb-1" />
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{cat.label}</span>
                </div>

                <div className={`flex-1 text-right text-2xl font-black transition-colors ${winner === 2 ? 'text-blue-400' : 'text-white/40'}`}>
                  {cat.format(cat.val2)}
                </div>
              </div>

              {/* Progress Bars */}
              <div className="mt-4 flex gap-4 items-center">
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden flex justify-end">
                  <div 
                    className={`h-full bg-purple-500 rounded-full transition-all duration-1000 ${winner === 1 ? 'shadow-[0_0_12px_rgba(168,85,247,0.4)]' : 'opacity-30'}`}
                    style={{ width: `${(cat.val1 / (cat.val1 + cat.val2)) * 100}%` }}
                  />
                </div>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-blue-500 rounded-full transition-all duration-1000 ${winner === 2 ? 'shadow-[0_0_12px_rgba(59,130,246,0.4)]' : 'opacity-30'}`}
                    style={{ width: `${(cat.val2 / (cat.val1 + cat.val2)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Shared Interests */}
      <div className="p-6 rounded-2xl bg-linear-to-br from-purple-500/10 to-blue-500/10 border border-white/10">
        <h4 className="text-sm font-black text-white uppercase tracking-widest mb-2 flex items-center gap-2">
          <PieChartIcon className="w-4 h-4 text-purple-400" />
          Taste Overlap
        </h4>
        <p className="text-sm text-gray-400 mb-4 italic">{getDNAAnalysis()}</p>
        <div className="flex flex-wrap gap-2">
          {user1.profile.genreAffinity
            .filter(g1 => user2.profile.genreAffinity.some(g2 => g2.genre === g1.genre))
            .slice(0, 5)
            .map((g, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-300">
                {g.genre}
              </span>
            ))
          }
        </div>
      </div>

      {/* Result Callout */}
      <div className="text-center p-8 rounded-3xl bg-white/5 border-2 border-dashed border-white/10">
        <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.2em] mb-2">Battle Result</p>
        <div className="text-4xl font-black text-white italic uppercase tracking-tighter">
          {user1Wins > user2Wins ? (
            <span className="text-purple-400">{user1.name} DOMINATES!</span>
          ) : user2Wins > user1Wins ? (
            <span className="text-blue-400">{user2.name} DOMINATES!</span>
          ) : (
            "IT'S A DEAD DRAW!"
          )}
        </div>
      </div>
    </div>
  );
}
