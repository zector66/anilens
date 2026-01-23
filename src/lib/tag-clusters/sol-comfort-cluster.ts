import type { TagDefinition } from '../tag-types';

export const SOL_COMFORT_CLUSTER: TagDefinition[] = [
  { tagName: 'Slice of Life', type: 'primary', mappings: [{ traitId: 'slice_of_life', weight: 5 }, { traitId: 'sol_routine', weight: 4 }, { traitId: 'chill', weight: 3 }] },
  { tagName: 'Iyashikei', type: 'primary', mappings: [{ traitId: 'wholesome', weight: 5 }, { traitId: 'cozy', weight: 5 }, { traitId: 'chill', weight: 4 }, { traitId: 'slice_of_life', weight: 4 }, { traitId: 'comfort_food', weight: 4 }] },
  { tagName: 'Cute Girls Doing Cute Things', type: 'structural', mappings: [{ traitId: 'cute', weight: 5 }, { traitId: 'cozy', weight: 4 }, { traitId: 'comedy', weight: 2 }, { traitId: 'slice_of_life', weight: 3 }] },
  { tagName: 'Cute Boys Doing Cute Things', type: 'structural', mappings: [{ traitId: 'cute', weight: 5 }, { traitId: 'cozy', weight: 4 }, { traitId: 'comedy', weight: 2 }, { traitId: 'slice_of_life', weight: 3 }] },
  { tagName: 'Family Life', type: 'structural', mappings: [{ traitId: 'warm', weight: 4 }, { traitId: 'slice_of_life', weight: 4 }, { traitId: 'family_drama', weight: 3 }] },
  { tagName: 'Parenthood', type: 'structural', mappings: [{ traitId: 'warm', weight: 4 }, { traitId: 'drama', weight: 2 }, { traitId: 'slice_of_life', weight: 3 }, { traitId: 'family_drama', weight: 3 }] },
  { tagName: 'Food', type: 'flavor', mappings: [{ traitId: 'food_world', weight: 4 }, { traitId: 'cozy', weight: 3 }, { traitId: 'slice_of_life', weight: 3 }] },
  { tagName: 'Cooking', type: 'primary', mappings: [{ traitId: 'food_world', weight: 5 }, { traitId: 'slice_of_life', weight: 3 }, { traitId: 'game_competition', weight: 2 }, { traitId: 'cozy', weight: 2 }] },
  { tagName: 'Work', type: 'structural', mappings: [{ traitId: 'workplace_world', weight: 5 }, { traitId: 'workplace_routine', weight: 4 }, { traitId: 'slice_of_life', weight: 3 }, { traitId: 'adult_cast', weight: 2 }] },
  { tagName: 'Office Lady', type: 'flavor', mappings: [{ traitId: 'workplace_world', weight: 4 }, { traitId: 'comedy', weight: 2 }, { traitId: 'adult_cast', weight: 3 }] },
  { tagName: 'Countryside', type: 'flavor', mappings: [{ traitId: 'modern_rural', weight: 4 }, { traitId: 'cozy', weight: 3 }, { traitId: 'wholesome', weight: 2 }] },
  { tagName: 'Camping', type: 'flavor', mappings: [{ traitId: 'cozy', weight: 4 }, { traitId: 'wholesome', weight: 4 }, { traitId: 'slice_of_life', weight: 3 }] },
  { tagName: 'Pets', type: 'flavor', mappings: [{ traitId: 'cozy', weight: 3 }, { traitId: 'wholesome', weight: 3 }, { traitId: 'cute', weight: 2 }] },
  { tagName: 'Animals', type: 'flavor', mappings: [{ traitId: 'cozy', weight: 2 }, { traitId: 'wholesome', weight: 2 }] },
  { tagName: 'Cafe', type: 'flavor', mappings: [{ traitId: 'cozy', weight: 3 }, { traitId: 'slice_of_life', weight: 3 }, { traitId: 'food_world', weight: 2 }] },
  { tagName: 'Gardening', type: 'flavor', mappings: [{ traitId: 'cozy', weight: 4 }, { traitId: 'wholesome', weight: 3 }, { traitId: 'slice_of_life', weight: 3 }] },
  { tagName: 'Episodic', type: 'structural', mappings: [{ traitId: 'episodic', weight: 5 }, { traitId: 'sol_routine', weight: 2 }] },
  { tagName: 'Daily Life', type: 'structural', mappings: [{ traitId: 'slice_of_life', weight: 4 }, { traitId: 'sol_routine', weight: 4 }] },
];
