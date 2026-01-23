import type { TagDefinition } from '../tag-types';

export const COMEDY_CLUSTER: TagDefinition[] = [
  { tagName: 'Comedy', type: 'primary', mappings: [{ traitId: 'comedy', weight: 5 }] },
  { tagName: 'Slapstick', type: 'structural', mappings: [{ traitId: 'slapstick', weight: 5 }, { traitId: 'comedy', weight: 4 }, { traitId: 'chaotic', weight: 2 }] },
  { tagName: 'Dark Comedy', type: 'structural', mappings: [{ traitId: 'dark_comedy', weight: 5 }, { traitId: 'comedy', weight: 4 }, { traitId: 'dark', weight: 2 }] },
  { tagName: 'Gag Humor', type: 'structural', mappings: [{ traitId: 'comedy', weight: 4 }, { traitId: 'slapstick', weight: 3 }] },
  { tagName: 'Absurdist', type: 'structural', mappings: [{ traitId: 'absurd', weight: 5 }, { traitId: 'comedy', weight: 3 }, { traitId: 'chaotic', weight: 3 }] },
  { tagName: 'Deadpan', type: 'flavor', mappings: [{ traitId: 'deadpan', weight: 5 }, { traitId: 'comedy', weight: 3 }] },
  { tagName: 'Romantic Comedy', type: 'structural', mappings: [{ traitId: 'romcom', weight: 5 }, { traitId: 'comedy', weight: 4 }, { traitId: 'romance', weight: 4 }] },
  { tagName: 'Cringe Comedy', type: 'structural', mappings: [{ traitId: 'cringe_comedy', weight: 5 }, { traitId: 'comedy', weight: 4 }, { traitId: 'anxiety', weight: 2 }] },
  { tagName: 'Black Comedy', type: 'structural', mappings: [{ traitId: 'dark_comedy', weight: 5 }, { traitId: 'comedy', weight: 4 }, { traitId: 'dark', weight: 3 }] },
  { tagName: 'Social Commentary', type: 'structural', mappings: [{ traitId: 'satirical', weight: 4 }, { traitId: 'political', weight: 2 }] },
  { tagName: 'Moe', type: 'flavor', mappings: [{ traitId: 'cute', weight: 5 }, { traitId: 'cozy', weight: 2 }] },
  { tagName: 'Chibi', type: 'flavor', mappings: [{ traitId: 'cute', weight: 4 }, { traitId: 'comedy', weight: 2 }] },
  { tagName: 'Fourth Wall', type: 'structural', mappings: [{ traitId: 'fourth_wall', weight: 5 }, { traitId: 'meta', weight: 4 }, { traitId: 'comedy', weight: 2 }] },
  { tagName: 'Anime Influenced', type: 'flavor', mappings: [] },
];
