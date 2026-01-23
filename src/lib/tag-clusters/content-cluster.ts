import type { TagDefinition } from '../tag-types';

export const CONTENT_CLUSTER: TagDefinition[] = [
  // Violence & Gore
  { tagName: 'Violence', type: 'content', mappings: [{ traitId: 'violence_level', weight: 5 }, { traitId: 'action', weight: 2 }] },
  { tagName: 'Graphic Violence', type: 'content', mappings: [{ traitId: 'violence_level', weight: 5 }, { traitId: 'gore_level', weight: 3 }, { traitId: 'dark', weight: 3 }] },
  { tagName: 'Mutilation', type: 'content', mappings: [{ traitId: 'gore_level', weight: 5 }, { traitId: 'body_horror', weight: 4 }, { traitId: 'disturbing', weight: 4 }] },
  
  // Sexual Content
  { tagName: 'Ecchi', type: 'primary', mappings: [{ traitId: 'ecchi', weight: 5 }, { traitId: 'sexual_content', weight: 3 }, { traitId: 'comedy', weight: 2 }] },
  { tagName: 'Nudity', type: 'content', mappings: [{ traitId: 'nudity', weight: 5 }, { traitId: 'sexual_content', weight: 2 }] },
  { tagName: 'Hentai', type: 'content', mappings: [{ traitId: 'sexual_content', weight: 5 }, { traitId: 'nudity', weight: 5 }] },
  { tagName: 'Fanservice', type: 'flavor', mappings: [{ traitId: 'ecchi', weight: 3 }, { traitId: 'sexual_content', weight: 2 }] },
  
  // Sensitive Themes
  { tagName: 'Drugs', type: 'content', mappings: [{ traitId: 'substance_use', weight: 5 }, { traitId: 'dark', weight: 2 }] },
  { tagName: 'Alcohol', type: 'flavor', mappings: [{ traitId: 'substance_use', weight: 3 }, { traitId: 'adult_cast', weight: 1 }] },
  { tagName: 'Addiction', type: 'content', mappings: [{ traitId: 'substance_use', weight: 4 }, { traitId: 'drama', weight: 3 }, { traitId: 'dark', weight: 3 }] },
  { tagName: 'Self-Harm', type: 'content', mappings: [{ traitId: 'suicide_themes', weight: 4 }, { traitId: 'emotional_damage', weight: 5 }, { traitId: 'dark', weight: 4 }] },
  { tagName: 'Sexual Abuse', type: 'content', mappings: [{ traitId: 'abuse_themes', weight: 5 }, { traitId: 'dark', weight: 5 }, { traitId: 'psychological_abuse', weight: 4 }] },
  { tagName: 'Domestic Abuse', type: 'content', mappings: [{ traitId: 'abuse_themes', weight: 5 }, { traitId: 'dark', weight: 4 }, { traitId: 'psychological_abuse', weight: 3 }] },
  { tagName: 'Child Abuse', type: 'content', mappings: [{ traitId: 'abuse_themes', weight: 5 }, { traitId: 'dark', weight: 5 }] },
  { tagName: 'War Crimes', type: 'content', mappings: [{ traitId: 'violence_level', weight: 5 }, { traitId: 'dark', weight: 5 }, { traitId: 'war', weight: 3 }] },
  
  // Mahou Shoujo (special category)
  { tagName: 'Mahou Shoujo', type: 'primary', mappings: [{ traitId: 'mahou_shoujo', weight: 5 }, { traitId: 'fantasy', weight: 3 }, { traitId: 'transformation', weight: 4 }, { traitId: 'action', weight: 2 }] },
  { tagName: 'Magical Girl', type: 'primary', mappings: [{ traitId: 'mahou_shoujo', weight: 5 }, { traitId: 'fantasy', weight: 3 }, { traitId: 'transformation', weight: 4 }] },
];
