import type { TagDefinition } from '../tag-types';

export const POLITICAL_CLUSTER: TagDefinition[] = [
  { tagName: 'Politics', type: 'primary', mappings: [{ traitId: 'political', weight: 5 }, { traitId: 'scheme_engine', weight: 4 }, { traitId: 'drama', weight: 3 }, { traitId: 'thriller', weight: 2 }] },
  { tagName: 'Revolution', type: 'structural', mappings: [{ traitId: 'political', weight: 4 }, { traitId: 'action', weight: 2 }, { traitId: 'drama', weight: 3 }] },
  { tagName: 'Propaganda', type: 'structural', mappings: [{ traitId: 'political', weight: 4 }, { traitId: 'psychological', weight: 2 }, { traitId: 'dark', weight: 2 }] },
  { tagName: 'Nobility', type: 'flavor', mappings: [{ traitId: 'political', weight: 3 }, { traitId: 'fantasy_medieval', weight: 2 }, { traitId: 'drama', weight: 2 }] },
  { tagName: 'Royalty', type: 'flavor', mappings: [{ traitId: 'political', weight: 3 }, { traitId: 'fantasy_medieval', weight: 2 }, { traitId: 'drama', weight: 2 }] },
  { tagName: 'Class Struggle', type: 'structural', mappings: [{ traitId: 'political', weight: 4 }, { traitId: 'drama', weight: 4 }, { traitId: 'gritty', weight: 3 }] },
  { tagName: 'Slavery', type: 'content', mappings: [{ traitId: 'dark', weight: 4 }, { traitId: 'political', weight: 2 }, { traitId: 'abuse_themes', weight: 3 }] },
  { tagName: 'Colonization', type: 'structural', mappings: [{ traitId: 'political', weight: 4 }, { traitId: 'war', weight: 2 }, { traitId: 'dark', weight: 2 }] },
];
