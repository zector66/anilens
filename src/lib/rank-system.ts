// Rank System for AniLens Games
// Players start at Iron IV and climb through ranks based on MMR

export interface Rank {
  name: string;
  tier: number; // 4 = IV, 3 = III, 2 = II, 1 = I
  minMMR: number;
  maxMMR: number;
  color: string;
  bgColor: string;
  icon: string;
}

export const RANKS: Rank[] = [
  // Iron (0-399)
  { name: 'Iron', tier: 4, minMMR: 0, maxMMR: 99, color: '#71717a', bgColor: 'from-zinc-600 to-zinc-800', icon: '🪨' },
  { name: 'Iron', tier: 3, minMMR: 100, maxMMR: 199, color: '#71717a', bgColor: 'from-zinc-600 to-zinc-800', icon: '🪨' },
  { name: 'Iron', tier: 2, minMMR: 200, maxMMR: 299, color: '#71717a', bgColor: 'from-zinc-600 to-zinc-800', icon: '🪨' },
  { name: 'Iron', tier: 1, minMMR: 300, maxMMR: 399, color: '#71717a', bgColor: 'from-zinc-600 to-zinc-800', icon: '🪨' },
  
  // Bronze (400-799)
  { name: 'Bronze', tier: 4, minMMR: 400, maxMMR: 499, color: '#b45309', bgColor: 'from-amber-700 to-amber-900', icon: '🥉' },
  { name: 'Bronze', tier: 3, minMMR: 500, maxMMR: 599, color: '#b45309', bgColor: 'from-amber-700 to-amber-900', icon: '🥉' },
  { name: 'Bronze', tier: 2, minMMR: 600, maxMMR: 699, color: '#b45309', bgColor: 'from-amber-700 to-amber-900', icon: '🥉' },
  { name: 'Bronze', tier: 1, minMMR: 700, maxMMR: 799, color: '#b45309', bgColor: 'from-amber-700 to-amber-900', icon: '🥉' },
  
  // Silver (800-1199)
  { name: 'Silver', tier: 4, minMMR: 800, maxMMR: 899, color: '#9ca3af', bgColor: 'from-gray-400 to-gray-600', icon: '🥈' },
  { name: 'Silver', tier: 3, minMMR: 900, maxMMR: 999, color: '#9ca3af', bgColor: 'from-gray-400 to-gray-600', icon: '🥈' },
  { name: 'Silver', tier: 2, minMMR: 1000, maxMMR: 1099, color: '#9ca3af', bgColor: 'from-gray-400 to-gray-600', icon: '🥈' },
  { name: 'Silver', tier: 1, minMMR: 1100, maxMMR: 1199, color: '#9ca3af', bgColor: 'from-gray-400 to-gray-600', icon: '🥈' },
  
  // Gold (1200-1599)
  { name: 'Gold', tier: 4, minMMR: 1200, maxMMR: 1299, color: '#fbbf24', bgColor: 'from-yellow-500 to-yellow-700', icon: '🥇' },
  { name: 'Gold', tier: 3, minMMR: 1300, maxMMR: 1399, color: '#fbbf24', bgColor: 'from-yellow-500 to-yellow-700', icon: '🥇' },
  { name: 'Gold', tier: 2, minMMR: 1400, maxMMR: 1499, color: '#fbbf24', bgColor: 'from-yellow-500 to-yellow-700', icon: '🥇' },
  { name: 'Gold', tier: 1, minMMR: 1500, maxMMR: 1599, color: '#fbbf24', bgColor: 'from-yellow-500 to-yellow-700', icon: '🥇' },
  
  // Platinum (1600-1999)
  { name: 'Platinum', tier: 4, minMMR: 1600, maxMMR: 1699, color: '#06b6d4', bgColor: 'from-cyan-400 to-cyan-600', icon: '💎' },
  { name: 'Platinum', tier: 3, minMMR: 1700, maxMMR: 1799, color: '#06b6d4', bgColor: 'from-cyan-400 to-cyan-600', icon: '💎' },
  { name: 'Platinum', tier: 2, minMMR: 1800, maxMMR: 1899, color: '#06b6d4', bgColor: 'from-cyan-400 to-cyan-600', icon: '💎' },
  { name: 'Platinum', tier: 1, minMMR: 1900, maxMMR: 1999, color: '#06b6d4', bgColor: 'from-cyan-400 to-cyan-600', icon: '💎' },
  
  // Diamond (2000-2399)
  { name: 'Diamond', tier: 4, minMMR: 2000, maxMMR: 2099, color: '#818cf8', bgColor: 'from-indigo-400 to-indigo-600', icon: '💠' },
  { name: 'Diamond', tier: 3, minMMR: 2100, maxMMR: 2199, color: '#818cf8', bgColor: 'from-indigo-400 to-indigo-600', icon: '💠' },
  { name: 'Diamond', tier: 2, minMMR: 2200, maxMMR: 2299, color: '#818cf8', bgColor: 'from-indigo-400 to-indigo-600', icon: '💠' },
  { name: 'Diamond', tier: 1, minMMR: 2300, maxMMR: 2399, color: '#818cf8', bgColor: 'from-indigo-400 to-indigo-600', icon: '💠' },
  
  // Master (2400-2799)
  { name: 'Master', tier: 4, minMMR: 2400, maxMMR: 2499, color: '#a855f7', bgColor: 'from-purple-500 to-purple-700', icon: '👑' },
  { name: 'Master', tier: 3, minMMR: 2500, maxMMR: 2599, color: '#a855f7', bgColor: 'from-purple-500 to-purple-700', icon: '👑' },
  { name: 'Master', tier: 2, minMMR: 2600, maxMMR: 2699, color: '#a855f7', bgColor: 'from-purple-500 to-purple-700', icon: '👑' },
  { name: 'Master', tier: 1, minMMR: 2700, maxMMR: 2799, color: '#a855f7', bgColor: 'from-purple-500 to-purple-700', icon: '👑' },
  
  // Grandmaster (2800-2999)
  { name: 'Grandmaster', tier: 2, minMMR: 2800, maxMMR: 2899, color: '#ef4444', bgColor: 'from-red-500 to-red-700', icon: '🔥' },
  { name: 'Grandmaster', tier: 1, minMMR: 2900, maxMMR: 2999, color: '#ef4444', bgColor: 'from-red-500 to-red-700', icon: '🔥' },
  
  // Challenger (3000+)
  { name: 'Challenger', tier: 0, minMMR: 3000, maxMMR: 99999, color: '#f97316', bgColor: 'from-orange-400 to-red-600', icon: '⚡' },
];

// Starting MMR for new players (Iron IV)
export const STARTING_MMR = 0;

// Get rank from MMR
export function getRankFromMMR(mmr: number): Rank {
  const rank = RANKS.find(r => mmr >= r.minMMR && mmr <= r.maxMMR);
  return rank || RANKS[0]; // Default to Iron IV
}

// Get rank display string (e.g., "Gold II")
export function getRankDisplayName(mmr: number): string {
  const rank = getRankFromMMR(mmr);
  if (rank.name === 'Challenger') return 'Challenger';
  if (rank.tier === 0) return rank.name;
  
  const tierNumerals = ['', 'I', 'II', 'III', 'IV'];
  return `${rank.name} ${tierNumerals[rank.tier]}`;
}

// Calculate MMR change after a game
export function calculateMMRChange(
  currentMMR: number,
  score: number,
  maxScore: number,
  difficulty: string,
  gamesPlayed: number
): number {
  const percentage = score / maxScore;
  
  // Base K-factor (how much MMR can change)
  // New players have higher K for faster placement
  let kFactor = gamesPlayed < 10 ? 50 : gamesPlayed < 30 ? 40 : 30;
  
  // Difficulty multiplier
  const difficultyMultiplier = 
    difficulty === 'hard' ? 1.5 : 
    difficulty === 'easy' ? 0.7 : 1.0;
  
  // Performance relative to expected (50% is baseline)
  const performanceBonus = (percentage - 0.5) * 2; // -1 to +1
  
  // Calculate change
  let change = Math.round(kFactor * performanceBonus * difficultyMultiplier);
  
  // Bonus for perfect scores
  if (percentage === 1.0) {
    change += 10;
  }
  
  // Minimum loss protection for new players
  if (gamesPlayed < 5 && change < 0) {
    change = Math.max(change, -10);
  }
  
  // Can't go below 0 MMR
  if (currentMMR + change < 0) {
    change = -currentMMR;
  }
  
  return change;
}

// Get progress to next rank (0-100)
export function getRankProgress(mmr: number): number {
  const rank = getRankFromMMR(mmr);
  if (rank.name === 'Challenger') return 100;
  
  const rangeSize = rank.maxMMR - rank.minMMR + 1;
  const progress = ((mmr - rank.minMMR) / rangeSize) * 100;
  return Math.min(100, Math.max(0, progress));
}

// Get MMR needed for next rank
export function getMMRToNextRank(mmr: number): number {
  const rank = getRankFromMMR(mmr);
  if (rank.name === 'Challenger') return 0;
  return rank.maxMMR - mmr + 1;
}
