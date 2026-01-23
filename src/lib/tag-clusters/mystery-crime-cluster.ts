import type { TagDefinition } from '../tag-types';

export const MYSTERY_CRIME_CLUSTER: TagDefinition[] = [
  { tagName: 'Mystery', type: 'primary', mappings: [{ traitId: 'mystery', weight: 5 }, { traitId: 'mystery_box', weight: 4 }, { traitId: 'thriller', weight: 2 }] },
  { tagName: 'Detective', type: 'primary', mappings: [{ traitId: 'mystery', weight: 4 }, { traitId: 'crime', weight: 4 }, { traitId: 'investigation_loop', weight: 5 }, { traitId: 'detective_pair', weight: 3 }] },
  { tagName: 'Police', type: 'structural', mappings: [{ traitId: 'crime', weight: 4 }, { traitId: 'investigation_loop', weight: 3 }, { traitId: 'thriller', weight: 2 }] },
  { tagName: 'Mafia', type: 'structural', mappings: [{ traitId: 'crime', weight: 5 }, { traitId: 'criminal_gang', weight: 5 }, { traitId: 'thriller', weight: 3 }, { traitId: 'dark', weight: 2 }] },
  { tagName: 'Yakuza', type: 'structural', mappings: [{ traitId: 'crime', weight: 5 }, { traitId: 'criminal_gang', weight: 5 }, { traitId: 'drama', weight: 2 }, { traitId: 'action', weight: 2 }] },
  { tagName: 'Organized Crime', type: 'structural', mappings: [{ traitId: 'crime', weight: 5 }, { traitId: 'criminal_gang', weight: 4 }, { traitId: 'thriller', weight: 3 }] },
  { tagName: 'Heist', type: 'structural', mappings: [{ traitId: 'crime', weight: 4 }, { traitId: 'heist_structure', weight: 5 }, { traitId: 'thriller', weight: 3 }, { traitId: 'tense', weight: 3 }] },
  { tagName: 'Espionage', type: 'structural', mappings: [{ traitId: 'thriller', weight: 5 }, { traitId: 'political', weight: 3 }, { traitId: 'action', weight: 3 }, { traitId: 'tense', weight: 3 }] },
  { tagName: 'Assassins', type: 'structural', mappings: [{ traitId: 'action', weight: 4 }, { traitId: 'crime', weight: 3 }, { traitId: 'dark', weight: 2 }, { traitId: 'thriller', weight: 2 }] },
  { tagName: 'Serial Killer', type: 'structural', mappings: [{ traitId: 'crime', weight: 4 }, { traitId: 'thriller', weight: 5 }, { traitId: 'horror', weight: 2 }, { traitId: 'dark', weight: 4 }, { traitId: 'psychological', weight: 3 }] },
  { tagName: 'Crime', type: 'primary', mappings: [{ traitId: 'crime', weight: 5 }, { traitId: 'thriller', weight: 2 }] },
  { tagName: 'Delinquents', type: 'structural', mappings: [{ traitId: 'crime', weight: 3 }, { traitId: 'teen_cast', weight: 2 }, { traitId: 'action', weight: 2 }] },
  { tagName: 'Gangs', type: 'structural', mappings: [{ traitId: 'crime', weight: 4 }, { traitId: 'criminal_gang', weight: 4 }, { traitId: 'action', weight: 2 }] },
  { tagName: 'Whodunit', type: 'structural', mappings: [{ traitId: 'mystery', weight: 5 }, { traitId: 'investigation_loop', weight: 4 }] },
];
