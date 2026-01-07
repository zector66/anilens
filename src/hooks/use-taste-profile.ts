import { useMemo } from "react";
import { useAniListData } from "./use-anilist-data";
import { TasteAnalyzer } from "@/lib/taste-analyzer";
import { TasteProfile } from "@/types/anilist";

export function useTasteProfile() {
  const { entries, loading } = useAniListData();

  const tasteProfile = useMemo<TasteProfile | null>(() => {
    if (entries.length === 0) return null;
    
    // Only include watched entries (exclude Planning, Paused, Dropped)
    const validStatuses = ['COMPLETED', 'CURRENT', 'REPEATING'];
    const filteredEntries = entries.filter(e => validStatuses.includes(e.status || ''));
    
    if (filteredEntries.length === 0) return null;
    
    return TasteAnalyzer.analyzeTaste(filteredEntries, 'ANIME');
  }, [entries]);

  return { tasteProfile, loading };
}
