import type { TagDefinition } from '../tag-types';

export const SETTING_CAST_CLUSTER: TagDefinition[] = [
  // Settings
  { tagName: 'School', type: 'flavor', mappings: [{ traitId: 'school_world', weight: 5 }, { traitId: 'teen_cast', weight: 2 }] },
  { tagName: 'School Club', type: 'flavor', mappings: [{ traitId: 'school_world', weight: 3 }, { traitId: 'slice_of_life', weight: 2 }] },
  { tagName: 'College', type: 'flavor', mappings: [{ traitId: 'college_world', weight: 5 }, { traitId: 'adult_cast', weight: 2 }] },
  { tagName: 'Hospital', type: 'flavor', mappings: [{ traitId: 'medical_world', weight: 5 }, { traitId: 'drama', weight: 2 }] },
  { tagName: 'Prison', type: 'flavor', mappings: [{ traitId: 'prison_world', weight: 5 }, { traitId: 'crime', weight: 4 }, { traitId: 'dark', weight: 3 }] },
  { tagName: 'Urban', type: 'flavor', mappings: [{ traitId: 'modern_urban', weight: 3 }, { traitId: 'big_city', weight: 2 }] },
  { tagName: 'Rural', type: 'flavor', mappings: [{ traitId: 'modern_rural', weight: 3 }, { traitId: 'small_town', weight: 2 }, { traitId: 'cozy', weight: 1 }] },
  { tagName: 'Beach', type: 'flavor', mappings: [{ traitId: 'ocean_island', weight: 2 }] },
  { tagName: 'Historical', type: 'structural', mappings: [{ traitId: 'historical', weight: 5 }, { traitId: 'ancient_world', weight: 2 }] },
  { tagName: 'Feudal Japan', type: 'structural', mappings: [{ traitId: 'feudal_japan', weight: 5 }, { traitId: 'historical', weight: 4 }] },
  { tagName: 'Afterlife', type: 'structural', mappings: [{ traitId: 'afterlife', weight: 5 }, { traitId: 'supernatural', weight: 3 }] },
  { tagName: 'Otaku Culture', type: 'flavor', mappings: [{ traitId: 'modern_urban', weight: 2 }, { traitId: 'comedy', weight: 2 }, { traitId: 'meta', weight: 2 }] },
  { tagName: 'Bar', type: 'flavor', mappings: [{ traitId: 'adult_cast', weight: 2 }, { traitId: 'slice_of_life', weight: 2 }] },
  
  // Cast Composition
  { tagName: 'Ensemble Cast', type: 'structural', mappings: [{ traitId: 'ensemble_cast', weight: 5 }] },
  { tagName: 'Found Family', type: 'structural', mappings: [{ traitId: 'found_family', weight: 5 }, { traitId: 'warm', weight: 3 }, { traitId: 'emotional_damage', weight: 2 }] },
  { tagName: 'Anti-Hero', type: 'structural', mappings: [{ traitId: 'antihero', weight: 5 }, { traitId: 'dark', weight: 2 }, { traitId: 'morally_gray', weight: 3 }] },
  { tagName: 'Villain Protagonist', type: 'structural', mappings: [{ traitId: 'villain_protag', weight: 5 }, { traitId: 'dark', weight: 4 }, { traitId: 'psychological', weight: 2 }] },
  { tagName: 'Otaku', type: 'flavor', mappings: [{ traitId: 'comedy', weight: 2 }, { traitId: 'meta', weight: 2 }] },
  { tagName: 'NEET', type: 'flavor', mappings: [{ traitId: 'comedy', weight: 2 }, { traitId: 'slice_of_life', weight: 2 }] },
  { tagName: 'Kids', type: 'flavor', mappings: [{ traitId: 'kids_cast', weight: 5 }] },
  { tagName: 'Adult Cast', type: 'structural', mappings: [{ traitId: 'adult_cast', weight: 5 }, { traitId: 'workplace_adults', weight: 2 }] },
  { tagName: 'Age Regression', type: 'flavor', mappings: [{ traitId: 'fantasy', weight: 2 }, { traitId: 'comedy', weight: 2 }] },
  { tagName: 'Gyaru', type: 'flavor', mappings: [{ traitId: 'romance', weight: 2 }, { traitId: 'comedy', weight: 2 }] },
  { tagName: 'Delinquent', type: 'flavor', mappings: [{ traitId: 'crime', weight: 2 }, { traitId: 'teen_cast', weight: 2 }, { traitId: 'action', weight: 2 }] },
  { tagName: 'Tsundere', type: 'flavor', mappings: [{ traitId: 'romance', weight: 2 }, { traitId: 'comedy', weight: 2 }] },
  { tagName: 'Kuudere', type: 'flavor', mappings: [{ traitId: 'romance', weight: 2 }] },
  { tagName: 'Yandere', type: 'flavor', mappings: [{ traitId: 'psychological', weight: 3 }, { traitId: 'horror', weight: 2 }, { traitId: 'romance', weight: 2 }] },
  { tagName: 'Tomboy', type: 'flavor', mappings: [{ traitId: 'romance', weight: 1 }] },
];
