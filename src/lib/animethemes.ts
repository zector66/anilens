// AnimeThemes API integration for fetching opening/ending audio
// API Docs: https://api-docs.animethemes.moe/

const ANIMETHEMES_API = 'https://api.animethemes.moe';

export interface AnimeTheme {
  id: number;
  type: 'OP' | 'ED';
  sequence: number;
  slug: string;
  song?: {
    title: string;
    artists?: Array<{ name: string }>;
  };
  animethemeentries?: Array<{
    videos?: Array<{
      link: string;
      audio: {
        link: string;
      };
    }>;
  }>;
}

interface AnimeThemesResponse {
  anime?: Array<{
    slug: string;
    name: string;
    animethemes?: AnimeTheme[];
  }>;
}

interface ThemeCacheEntry {
  themes: AnimeTheme[];
  slug: string | null;
}

// Cache for theme lookups to avoid repeated API calls
const themeCache = new Map<number, ThemeCacheEntry>();

export async function getAnimeThemes(anilistId: number): Promise<ThemeCacheEntry> {
  // Check cache first
  if (themeCache.has(anilistId)) {
    return themeCache.get(anilistId)!;
  }

  try {
    // AnimeThemes uses external_id mapping to find anime by AniList ID
    const response = await fetch(
      `${ANIMETHEMES_API}/anime?filter[has]=resources&filter[site]=AniList&filter[external_id]=${anilistId}&include=animethemes.animethemeentries.videos,animethemes.song.artists`
    );

    if (!response.ok) {
      console.error('AnimeThemes API error:', response.status);
      return { themes: [], slug: null };
    }

    const data: AnimeThemesResponse = await response.json();

    if (!data.anime || data.anime.length === 0) {
      return { themes: [], slug: null };
    }

    const anime = data.anime[0];
    const entry: ThemeCacheEntry = {
      themes: anime.animethemes || [],
      slug: anime.slug || null,
    };
    themeCache.set(anilistId, entry);
    return entry;
  } catch (error) {
    console.error('Failed to fetch anime themes:', error);
    return { themes: [], slug: null };
  }
}

export function getThemeAudioUrl(theme: AnimeTheme): string | null {
  const entry = theme.animethemeentries?.[0];
  const video = entry?.videos?.[0];
  
  // Prefer audio link if available, otherwise use video link
  if (video?.audio?.link) {
    return video.audio.link;
  }
  if (video?.link) {
    return video.link;
  }
  return null;
}

export function getThemeTitle(theme: AnimeTheme): string {
  if (theme.song?.title) {
    const artists = theme.song.artists?.map(a => a.name).join(', ');
    return artists ? `${theme.song.title} - ${artists}` : theme.song.title;
  }
  return `${theme.type}${theme.sequence || ''}`;
}

export function filterOpenings(themes: AnimeTheme[]): AnimeTheme[] {
  return themes.filter(t => t.type === 'OP');
}

export function filterEndings(themes: AnimeTheme[]): AnimeTheme[] {
  return themes.filter(t => t.type === 'ED');
}
