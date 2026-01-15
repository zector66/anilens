/**
 * Simple in-memory cache for TasteAnalyzer results
 * Prevents recalculating expensive taste profiles on every render
 */

import { TasteProfile, MediaListEntry } from '@/types/anilist';

interface CacheEntry {
  profile: TasteProfile;
  timestamp: number;
  hash: string;
}

class TasteAnalyzerCache {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 15 * 60 * 1000; // 15 minutes
  private readonly MAX_ENTRIES = 50;

  /**
   * Generate a stable hash from media list entries
   */
  private generateHash(entries: MediaListEntry[], type: string): string {
    // Use entry count, first/last IDs, and total score as a quick hash
    const ids = entries.map(e => e.id).sort();
    const totalScore = entries.reduce((sum, e) => sum + (e.score || 0), 0);
    return `${type}-${entries.length}-${ids[0]}-${ids[ids.length - 1]}-${totalScore}`;
  }

  /**
   * Get cached profile if available and fresh
   */
  get(entries: MediaListEntry[], type: 'ANIME' | 'MANGA'): TasteProfile | null {
    const hash = this.generateHash(entries, type);
    const cached = this.cache.get(hash);
    
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(hash);
      return null;
    }
    
    return cached.profile;
  }

  /**
   * Store profile in cache
   */
  set(entries: MediaListEntry[], type: 'ANIME' | 'MANGA', profile: TasteProfile): void {
    const hash = this.generateHash(entries, type);
    
    // Evict oldest if at capacity
    if (this.cache.size >= this.MAX_ENTRIES) {
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(hash, {
      profile,
      timestamp: Date.now(),
      hash,
    });
  }

  /**
   * Clear all cached profiles
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats for debugging
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, value]) => ({
        key,
        age: Date.now() - value.timestamp,
      })),
    };
  }
}

export const tasteAnalyzerCache = new TasteAnalyzerCache();
