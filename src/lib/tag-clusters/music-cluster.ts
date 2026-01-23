import type { TagDefinition } from '../tag-types';

export const MUSIC_CLUSTER: TagDefinition[] = [
  { tagName: 'Music', type: 'primary', mappings: [{ traitId: 'music', weight: 5 }, { traitId: 'emotional_damage', weight: 2 }] },
  { tagName: 'Band', type: 'structural', mappings: [{ traitId: 'music', weight: 5 }, { traitId: 'drama', weight: 2 }, { traitId: 'slice_of_life', weight: 2 }, { traitId: 'found_family', weight: 2 }] },
  { tagName: 'Idol', type: 'primary', mappings: [{ traitId: 'showbiz', weight: 5 }, { traitId: 'music', weight: 4 }, { traitId: 'drama', weight: 2 }, { traitId: 'game_competition', weight: 2 }] },
  { tagName: 'Male Idol', type: 'structural', mappings: [{ traitId: 'showbiz', weight: 5 }, { traitId: 'music', weight: 4 }] },
  { tagName: 'Female Idol', type: 'structural', mappings: [{ traitId: 'showbiz', weight: 5 }, { traitId: 'music', weight: 4 }, { traitId: 'cute', weight: 2 }] },
  { tagName: 'Dancing', type: 'flavor', mappings: [{ traitId: 'music', weight: 2 }, { traitId: 'sports', weight: 1 }] },
  { tagName: 'Acting', type: 'structural', mappings: [{ traitId: 'showbiz', weight: 4 }, { traitId: 'drama', weight: 3 }] },
  { tagName: 'Theater', type: 'structural', mappings: [{ traitId: 'drama', weight: 3 }, { traitId: 'showbiz', weight: 3 }] },
  { tagName: 'Performance', type: 'structural', mappings: [{ traitId: 'music', weight: 3 }, { traitId: 'showbiz', weight: 3 }] },
  { tagName: 'Rakugo', type: 'structural', mappings: [{ traitId: 'showbiz', weight: 4 }, { traitId: 'drama', weight: 3 }, { traitId: 'historical', weight: 2 }] },
  { tagName: 'Classical Music', type: 'flavor', mappings: [{ traitId: 'music', weight: 4 }, { traitId: 'drama', weight: 2 }] },
];
