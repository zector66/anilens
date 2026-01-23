import type { TagDefinition } from '../tag-types';

export const HORROR_THRILLER_CLUSTER: TagDefinition[] = [
  { tagName: 'Horror', type: 'primary', mappings: [{ traitId: 'horror', weight: 5 }, { traitId: 'creepy', weight: 4 }, { traitId: 'dark', weight: 3 }] },
  { tagName: 'Psychological', type: 'primary', mappings: [{ traitId: 'psychological', weight: 5 }, { traitId: 'mindfuck', weight: 2 }, { traitId: 'tense', weight: 2 }] },
  { tagName: 'Body Horror', type: 'content', mappings: [{ traitId: 'body_horror', weight: 5 }, { traitId: 'horror', weight: 5 }, { traitId: 'gore_level', weight: 4 }, { traitId: 'disturbing', weight: 5 }] },
  { tagName: 'Cosmic Horror', type: 'primary', mappings: [{ traitId: 'horror', weight: 5 }, { traitId: 'existential_dread', weight: 5 }, { traitId: 'mystery', weight: 2 }, { traitId: 'mindfuck', weight: 3 }] },
  { tagName: 'Gore', type: 'content', mappings: [{ traitId: 'gore_level', weight: 5 }, { traitId: 'violence_level', weight: 5 }, { traitId: 'horror', weight: 3 }, { traitId: 'dark', weight: 3 }] },
  { tagName: 'Torture', type: 'content', mappings: [{ traitId: 'torture', weight: 5 }, { traitId: 'violence_level', weight: 5 }, { traitId: 'dark', weight: 5 }, { traitId: 'anxiety', weight: 4 }] },
  { tagName: 'Survival', type: 'primary', mappings: [{ traitId: 'survival', weight: 5 }, { traitId: 'survival_engine', weight: 5 }, { traitId: 'anxiety', weight: 3 }, { traitId: 'tense', weight: 3 }] },
  { tagName: 'Zombie', type: 'structural', mappings: [{ traitId: 'horror', weight: 3 }, { traitId: 'post_apocalyptic', weight: 3 }, { traitId: 'survival', weight: 3 }] },
  { tagName: 'Vampire', type: 'structural', mappings: [{ traitId: 'vampires', weight: 5 }, { traitId: 'supernatural', weight: 3 }, { traitId: 'horror', weight: 2 }, { traitId: 'romance', weight: 2 }] },
  { tagName: 'Werewolf', type: 'structural', mappings: [{ traitId: 'werewolves', weight: 5 }, { traitId: 'supernatural', weight: 3 }, { traitId: 'horror', weight: 2 }] },
  { tagName: 'Death Game', type: 'primary', mappings: [{ traitId: 'death_game_engine', weight: 5 }, { traitId: 'thriller', weight: 5 }, { traitId: 'survival', weight: 5 }, { traitId: 'anxiety', weight: 5 }, { traitId: 'dark', weight: 4 }] },
  { tagName: 'Battle Royale', type: 'primary', mappings: [{ traitId: 'survival', weight: 5 }, { traitId: 'death_game_engine', weight: 4 }, { traitId: 'action', weight: 4 }, { traitId: 'thriller', weight: 4 }, { traitId: 'anxiety', weight: 4 }] },
  { tagName: 'Conspiracy', type: 'structural', mappings: [{ traitId: 'thriller', weight: 4 }, { traitId: 'mystery', weight: 3 }, { traitId: 'paranoid', weight: 4 }, { traitId: 'political', weight: 2 }] },
  { tagName: 'Terrorism', type: 'structural', mappings: [{ traitId: 'thriller', weight: 4 }, { traitId: 'dark', weight: 3 }, { traitId: 'political', weight: 3 }] },
  { tagName: 'Thriller', type: 'primary', mappings: [{ traitId: 'thriller', weight: 5 }, { traitId: 'tense', weight: 4 }] },
  { tagName: 'Suspense', type: 'structural', mappings: [{ traitId: 'thriller', weight: 4 }, { traitId: 'tense', weight: 4 }, { traitId: 'anxiety', weight: 3 }] },
  { tagName: 'Stalking', type: 'structural', mappings: [{ traitId: 'thriller', weight: 4 }, { traitId: 'creepy', weight: 4 }, { traitId: 'psychological', weight: 3 }] },
  { tagName: 'Cannibalism', type: 'content', mappings: [{ traitId: 'horror', weight: 4 }, { traitId: 'gore_level', weight: 4 }, { traitId: 'disturbing', weight: 5 }] },
  { tagName: 'Survival Horror', type: 'primary', mappings: [{ traitId: 'survival', weight: 5 }, { traitId: 'horror', weight: 5 }, { traitId: 'anxiety', weight: 5 }, { traitId: 'tense', weight: 4 }] },
];
