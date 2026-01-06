// AnimeThemes API integration for fetching opening/ending audio
// API Docs: https://api-docs.animethemes.moe/

const ANIMETHEMES_API = 'https://api.animethemes.moe';

interface AnimeTheme {
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
  anime?: {
    name: string;
    animethemes?: AnimeTheme[];
  };
}

// Cache for theme lookups to avoid repeated API calls
const themeCache = new Map<number, AnimeTheme[]>();

export async function getAnimeThemes(anilistId: number): Promise<AnimeTheme[]> {
  // Check cache first
  if (themeCache.has(anilistId)) {
    return themeCache.get(anilistId) || [];
  }

  try {
    // AnimeThemes uses external_id mapping to find anime by AniList ID
    const response = await fetch(
      `${ANIMETHEMES_API}/anime?filter[has]=resources&filter[site]=AniList&filter[external_id]=${anilistId}&include=animethemes.animethemeentries.videos,animethemes.song.artists`
    );

    if (!response.ok) {
      console.error('AnimeThemes API error:', response.status);
      return [];
    }

    const data = await response.json();
    
    if (!data.anime || data.anime.length === 0) {
      return [];
    }

    const themes = data.anime[0]?.animethemes || [];
    themeCache.set(anilistId, themes);
    return themes;
  } catch (error) {
    console.error('Failed to fetch anime themes:', error);
    return [];
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
