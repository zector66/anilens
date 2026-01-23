/**
 * TAG MAPPINGS - Maps AniList tags to traits with weights
 * 
 * Tag Types:
 * A) PRIMARY - Defining identity (weight 4-5)
 * B) STRUCTURAL - How story runs (weight 3-4)
 * C) FLAVOR - Nice but shouldn't overpower (weight 1-2)
 * D) CONTENT - Warnings, separate scoring channel
 * 
 * Weight System: 5=defining, 4=strong, 3=meaningful, 2=flavor, 1=hint, 0=ignore
 */

// Import and re-export types from tag-types to maintain backward compatibility
import type { TagType, TraitMapping, TagDefinition } from './tag-types';
export type { TagType, TraitMapping, TagDefinition };

// Tags that ALWAYS hit hard when present
export const DEFINING_TAGS = new Set([
  'Isekai', 'Time Loop', 'Time Travel', 'Cyberpunk', 'Dystopia', 'Post-Apocalyptic',
  'Death Game', 'Horror', 'Psychological', 'Iyashikei', 'War', 'Politics',
  'Mystery', 'Detective', 'Cultivation', 'Mecha', 'Idol', 'Boys\' Love', 'Yuri',
  'Harem', 'Reverse Harem', 'Ecchi', 'Mahou Shoujo', 'Sports', 'Cooking',
  'Survival', 'Battle Royale', 'Revenge', 'Reincarnation', 'Virtual World',
  'Space Opera', 'Military', 'Crime', 'Tragedy', 'Coming of Age'
]);

// Import cluster mappings
import { FANTASY_CLUSTER } from './tag-clusters/fantasy-cluster';
import { SCIFI_CLUSTER } from './tag-clusters/scifi-cluster';
import { HORROR_THRILLER_CLUSTER } from './tag-clusters/horror-thriller-cluster';
import { MYSTERY_CRIME_CLUSTER } from './tag-clusters/mystery-crime-cluster';
import { ACTION_CLUSTER } from './tag-clusters/action-cluster';
import { SPORTS_CLUSTER } from './tag-clusters/sports-cluster';
import { ROMANCE_CLUSTER } from './tag-clusters/romance-cluster';
import { SOL_COMFORT_CLUSTER } from './tag-clusters/sol-comfort-cluster';
import { DRAMA_DAMAGE_CLUSTER } from './tag-clusters/drama-damage-cluster';
import { PSYCHOLOGICAL_CLUSTER } from './tag-clusters/psychological-cluster';
import { POLITICAL_CLUSTER } from './tag-clusters/political-cluster';
import { MUSIC_CLUSTER } from './tag-clusters/music-cluster';
import { SETTING_CAST_CLUSTER } from './tag-clusters/setting-cast-cluster';
import { CONTENT_CLUSTER } from './tag-clusters/content-cluster';
import { COMEDY_CLUSTER } from './tag-clusters/comedy-cluster';

// All tag definitions combined
export const ALL_TAG_DEFINITIONS: TagDefinition[] = [
  ...FANTASY_CLUSTER,
  ...SCIFI_CLUSTER,
  ...HORROR_THRILLER_CLUSTER,
  ...MYSTERY_CRIME_CLUSTER,
  ...ACTION_CLUSTER,
  ...SPORTS_CLUSTER,
  ...ROMANCE_CLUSTER,
  ...SOL_COMFORT_CLUSTER,
  ...DRAMA_DAMAGE_CLUSTER,
  ...PSYCHOLOGICAL_CLUSTER,
  ...POLITICAL_CLUSTER,
  ...MUSIC_CLUSTER,
  ...SETTING_CAST_CLUSTER,
  ...CONTENT_CLUSTER,
  ...COMEDY_CLUSTER,
];

// Build lookup map for fast access
export const TAG_MAP = new Map<string, TagDefinition>();
for (const def of ALL_TAG_DEFINITIONS) {
  TAG_MAP.set(def.tagName.toLowerCase(), def);
}

/**
 * Look up tag definition (case-insensitive)
 */
export function getTagDefinition(tagName: string): TagDefinition | undefined {
  return TAG_MAP.get(tagName.toLowerCase());
}

/**
 * Check if a tag is a defining tag (should have high weight)
 */
export function isDefiningTag(tagName: string): boolean {
  return DEFINING_TAGS.has(tagName);
}
