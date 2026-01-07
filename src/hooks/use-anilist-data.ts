import { useMemo } from "react";
import { useAuth } from "./use-auth";
import { useAnimeList, useMangaList } from "./use-anilist";
import { MediaListEntry } from "@/types/anilist";

export function useAniListData() {
  const { user } = useAuth();
  
  const { data: animeList, isLoading: animeLoading } = useAnimeList(user?.id || 0);
  const { data: mangaList, isLoading: mangaLoading } = useMangaList(user?.id || 0);

  const loading = animeLoading || mangaLoading || !user;

  const entries = useMemo(() => {
    if (!animeList && !mangaList) return [];
    
    const allEntries: MediaListEntry[] = [];
    
    if (animeList && Array.isArray(animeList)) {
      allEntries.push(...animeList.map((entry: any) => ({
        ...entry,
        media: {
          ...entry.media,
          type: "ANIME" as const
        }
      })));
    }
    
    if (mangaList && Array.isArray(mangaList)) {
      allEntries.push(...mangaList.map((entry: any) => ({
        ...entry,
        media: {
          ...entry.media,
          type: "MANGA" as const
        }
      })));
    }
    
    return allEntries;
  }, [animeList, mangaList]);

  return { 
    entries, 
    loading, 
    user: user ? {
      id: user.id,
      name: user.name,
      avatarImage: { large: user.avatar.large }
    } : null
  };
}
