import type { TagDefinition } from '../tag-types';

export const ACTION_CLUSTER: TagDefinition[] = [
  { tagName: 'Action', type: 'primary', mappings: [{ traitId: 'action', weight: 5 }, { traitId: 'hype', weight: 3 }] },
  { tagName: 'Martial Arts', type: 'structural', mappings: [{ traitId: 'martial_arts', weight: 5 }, { traitId: 'action', weight: 4 }, { traitId: 'hype', weight: 2 }] },
  { tagName: 'Swordplay', type: 'structural', mappings: [{ traitId: 'swordplay', weight: 5 }, { traitId: 'action', weight: 4 }, { traitId: 'adventure', weight: 2 }] },
  { tagName: 'Guns', type: 'structural', mappings: [{ traitId: 'gunplay', weight: 5 }, { traitId: 'action', weight: 4 }, { traitId: 'crime', weight: 2 }] },
  { tagName: 'Military', type: 'primary', mappings: [{ traitId: 'military', weight: 5 }, { traitId: 'military_squad', weight: 4 }, { traitId: 'war', weight: 3 }, { traitId: 'action', weight: 3 }, { traitId: 'political', weight: 2 }] },
  { tagName: 'War', type: 'primary', mappings: [{ traitId: 'war', weight: 5 }, { traitId: 'war_campaign', weight: 5 }, { traitId: 'drama', weight: 4 }, { traitId: 'dark', weight: 3 }, { traitId: 'epic', weight: 2 }, { traitId: 'tragic', weight: 2 }] },
  { tagName: 'Strategy Game', type: 'structural', mappings: [{ traitId: 'tactical_combat', weight: 4 }, { traitId: 'mindgames_combat', weight: 3 }, { traitId: 'game_competition', weight: 3 }] },
  { tagName: 'Tournament', type: 'structural', mappings: [{ traitId: 'tournament_engine', weight: 5 }, { traitId: 'game_competition', weight: 4 }, { traitId: 'training_loop', weight: 3 }, { traitId: 'action', weight: 2 }, { traitId: 'hype', weight: 3 }] },
  { tagName: 'Superhero', type: 'primary', mappings: [{ traitId: 'superhero', weight: 5 }, { traitId: 'superpowers', weight: 5 }, { traitId: 'action', weight: 4 }, { traitId: 'hype', weight: 3 }] },
  { tagName: 'Super Power', type: 'structural', mappings: [{ traitId: 'superpowers', weight: 5 }, { traitId: 'action', weight: 3 }, { traitId: 'fantasy', weight: 2 }] },
  { tagName: 'Samurai', type: 'structural', mappings: [{ traitId: 'swordplay', weight: 4 }, { traitId: 'historical', weight: 3 }, { traitId: 'feudal_japan', weight: 4 }, { traitId: 'action', weight: 3 }] },
  { tagName: 'Ninja', type: 'structural', mappings: [{ traitId: 'martial_arts', weight: 4 }, { traitId: 'action', weight: 4 }, { traitId: 'feudal_japan', weight: 2 }] },
  { tagName: 'Pirates', type: 'structural', mappings: [{ traitId: 'adventure', weight: 4 }, { traitId: 'action', weight: 3 }, { traitId: 'ocean_island', weight: 3 }] },
  { tagName: 'Knights', type: 'structural', mappings: [{ traitId: 'fantasy_medieval', weight: 4 }, { traitId: 'action', weight: 3 }, { traitId: 'swordplay', weight: 3 }] },
  { tagName: 'Adventure', type: 'primary', mappings: [{ traitId: 'adventure', weight: 5 }, { traitId: 'quest_engine', weight: 3 }] },
];
