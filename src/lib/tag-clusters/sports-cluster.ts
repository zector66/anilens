import type { TagDefinition } from '../tag-types';

export const SPORTS_CLUSTER: TagDefinition[] = [
  { tagName: 'Sports', type: 'primary', mappings: [{ traitId: 'sports', weight: 5 }, { traitId: 'game_competition', weight: 4 }, { traitId: 'training_loop', weight: 3 }, { traitId: 'hype', weight: 3 }] },
  { tagName: 'Team Sports', type: 'structural', mappings: [{ traitId: 'sports', weight: 5 }, { traitId: 'found_family', weight: 2 }, { traitId: 'ensemble_cast', weight: 3 }] },
  { tagName: 'Basketball', type: 'structural', mappings: [{ traitId: 'sports', weight: 5 }, { traitId: 'hype', weight: 3 }] },
  { tagName: 'Baseball', type: 'structural', mappings: [{ traitId: 'sports', weight: 5 }, { traitId: 'training_loop', weight: 2 }] },
  { tagName: 'Soccer', type: 'structural', mappings: [{ traitId: 'sports', weight: 5 }, { traitId: 'hype', weight: 3 }] },
  { tagName: 'Football', type: 'structural', mappings: [{ traitId: 'sports', weight: 5 }, { traitId: 'hype', weight: 3 }] },
  { tagName: 'Volleyball', type: 'structural', mappings: [{ traitId: 'sports', weight: 5 }, { traitId: 'hype', weight: 3 }, { traitId: 'found_family', weight: 2 }] },
  { tagName: 'Boxing', type: 'structural', mappings: [{ traitId: 'sports', weight: 5 }, { traitId: 'martial_arts', weight: 3 }, { traitId: 'training_loop', weight: 4 }] },
  { tagName: 'Swimming', type: 'structural', mappings: [{ traitId: 'sports', weight: 5 }, { traitId: 'drama', weight: 2 }] },
  { tagName: 'Cycling', type: 'structural', mappings: [{ traitId: 'sports', weight: 5 }, { traitId: 'training_loop', weight: 3 }] },
  { tagName: 'Tennis', type: 'structural', mappings: [{ traitId: 'sports', weight: 5 }, { traitId: 'rivalry_core', weight: 3 }] },
  { tagName: 'Ice Skating', type: 'structural', mappings: [{ traitId: 'sports', weight: 5 }, { traitId: 'music', weight: 2 }] },
  { tagName: 'Golf', type: 'structural', mappings: [{ traitId: 'sports', weight: 5 }] },
  { tagName: 'Racing', type: 'structural', mappings: [{ traitId: 'sports', weight: 4 }, { traitId: 'hype', weight: 4 }, { traitId: 'game_competition', weight: 4 }] },
  { tagName: 'Esports', type: 'structural', mappings: [{ traitId: 'game_competition', weight: 5 }, { traitId: 'modern_urban', weight: 3 }, { traitId: 'hype', weight: 3 }] },
  { tagName: 'Rivalry', type: 'structural', mappings: [{ traitId: 'rivalry_core', weight: 5 }, { traitId: 'game_competition', weight: 3 }, { traitId: 'drama', weight: 2 }, { traitId: 'hype', weight: 2 }] },
  { tagName: 'Badminton', type: 'structural', mappings: [{ traitId: 'sports', weight: 5 }] },
  { tagName: 'Archery', type: 'structural', mappings: [{ traitId: 'sports', weight: 4 }, { traitId: 'action', weight: 2 }] },
  { tagName: 'Sumo', type: 'structural', mappings: [{ traitId: 'sports', weight: 5 }, { traitId: 'martial_arts', weight: 3 }] },
];
