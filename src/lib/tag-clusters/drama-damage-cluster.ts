import type { TagDefinition } from '../tag-types';

export const DRAMA_DAMAGE_CLUSTER: TagDefinition[] = [
  { tagName: 'Drama', type: 'primary', mappings: [{ traitId: 'drama', weight: 5 }, { traitId: 'emotional_damage', weight: 2 }] },
  { tagName: 'Coming of Age', type: 'primary', mappings: [{ traitId: 'drama', weight: 4 }, { traitId: 'training_loop', weight: 3 }, { traitId: 'emotional_damage', weight: 3 }, { traitId: 'teen_cast', weight: 3 }] },
  { tagName: 'Tragedy', type: 'primary', mappings: [{ traitId: 'tragic', weight: 5 }, { traitId: 'emotional_damage', weight: 5 }, { traitId: 'dark', weight: 3 }, { traitId: 'tearjerker', weight: 4 }] },
  { tagName: 'Depression', type: 'structural', mappings: [{ traitId: 'emotional_damage', weight: 4 }, { traitId: 'psychological', weight: 3 }, { traitId: 'melancholic', weight: 4 }, { traitId: 'sad', weight: 4 }] },
  { tagName: 'Suicide', type: 'content', mappings: [{ traitId: 'suicide_themes', weight: 5 }, { traitId: 'emotional_damage', weight: 5 }, { traitId: 'dark', weight: 5 }] },
  { tagName: 'Bullying', type: 'content', mappings: [{ traitId: 'bullying', weight: 5 }, { traitId: 'drama', weight: 4 }, { traitId: 'emotional_damage', weight: 4 }, { traitId: 'rage', weight: 2 }] },
  { tagName: 'Abuse', type: 'content', mappings: [{ traitId: 'abuse_themes', weight: 5 }, { traitId: 'drama', weight: 4 }, { traitId: 'dark', weight: 4 }] },
  { tagName: 'Trauma', type: 'structural', mappings: [{ traitId: 'abuse_themes', weight: 4 }, { traitId: 'drama', weight: 4 }, { traitId: 'emotional_damage', weight: 4 }, { traitId: 'psychological', weight: 3 }] },
  { tagName: 'Rehabilitation', type: 'structural', mappings: [{ traitId: 'catharsis', weight: 4 }, { traitId: 'hopeful', weight: 3 }, { traitId: 'drama', weight: 3 }] },
  { tagName: 'Revenge', type: 'primary', mappings: [{ traitId: 'revenge_engine', weight: 5 }, { traitId: 'dark', weight: 2 }, { traitId: 'drama', weight: 2 }, { traitId: 'rage', weight: 3 }] },
  { tagName: 'Death', type: 'structural', mappings: [{ traitId: 'emotional_damage', weight: 4 }, { traitId: 'tragic', weight: 3 }, { traitId: 'dark', weight: 2 }] },
  { tagName: 'Loss', type: 'structural', mappings: [{ traitId: 'emotional_damage', weight: 4 }, { traitId: 'melancholic', weight: 4 }, { traitId: 'tearjerker', weight: 3 }] },
  { tagName: 'Grief', type: 'structural', mappings: [{ traitId: 'emotional_damage', weight: 5 }, { traitId: 'sad', weight: 4 }, { traitId: 'tearjerker', weight: 4 }] },
  { tagName: 'Terminal Illness', type: 'structural', mappings: [{ traitId: 'emotional_damage', weight: 5 }, { traitId: 'tragic', weight: 4 }, { traitId: 'tearjerker', weight: 5 }] },
  { tagName: 'Disability', type: 'structural', mappings: [{ traitId: 'drama', weight: 3 }, { traitId: 'emotional_damage', weight: 2 }] },
  { tagName: 'Healing', type: 'structural', mappings: [{ traitId: 'catharsis', weight: 4 }, { traitId: 'hopeful', weight: 4 }, { traitId: 'warm', weight: 3 }] },
];
