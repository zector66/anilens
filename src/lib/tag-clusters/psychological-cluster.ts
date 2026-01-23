import type { TagDefinition } from '../tag-types';

export const PSYCHOLOGICAL_CLUSTER: TagDefinition[] = [
  { tagName: 'Mind Games', type: 'structural', mappings: [{ traitId: 'psychological', weight: 4 }, { traitId: 'psychological_warfare', weight: 4 }, { traitId: 'thriller', weight: 3 }, { traitId: 'mindgames_combat', weight: 3 }] },
  { tagName: 'Achronological Order', type: 'structural', mappings: [{ traitId: 'achronological', weight: 5 }, { traitId: 'nonlinear', weight: 5 }, { traitId: 'mindfuck', weight: 3 }] },
  { tagName: 'Non-linear', type: 'structural', mappings: [{ traitId: 'nonlinear', weight: 5 }, { traitId: 'mindfuck', weight: 2 }] },
  { tagName: 'Unreliable Narrator', type: 'structural', mappings: [{ traitId: 'unreliable_narrator', weight: 5 }, { traitId: 'mindfuck', weight: 4 }, { traitId: 'mystery', weight: 3 }, { traitId: 'psychological', weight: 4 }] },
  { tagName: 'Meta', type: 'structural', mappings: [{ traitId: 'meta', weight: 5 }, { traitId: 'fourth_wall', weight: 5 }, { traitId: 'comedy', weight: 2 }, { traitId: 'mindfuck', weight: 2 }] },
  { tagName: 'Parody', type: 'structural', mappings: [{ traitId: 'parody', weight: 5 }, { traitId: 'comedy', weight: 4 }, { traitId: 'meta', weight: 2 }] },
  { tagName: 'Satire', type: 'structural', mappings: [{ traitId: 'satire', weight: 5 }, { traitId: 'satirical', weight: 5 }, { traitId: 'political', weight: 2 }, { traitId: 'comedy', weight: 3 }] },
  { tagName: 'Surreal Comedy', type: 'structural', mappings: [{ traitId: 'surreal_comedy', weight: 5 }, { traitId: 'absurd', weight: 4 }, { traitId: 'comedy', weight: 4 }, { traitId: 'chaotic', weight: 3 }] },
  { tagName: 'Denpa', type: 'primary', mappings: [{ traitId: 'denpa', weight: 5 }, { traitId: 'psychological', weight: 5 }, { traitId: 'mindfuck', weight: 5 }, { traitId: 'disturbing', weight: 4 }] },
  { tagName: 'Philosophy', type: 'structural', mappings: [{ traitId: 'philosophical', weight: 5 }, { traitId: 'existential', weight: 3 }] },
  { tagName: 'Existential', type: 'structural', mappings: [{ traitId: 'existential', weight: 5 }, { traitId: 'existential_dread', weight: 3 }, { traitId: 'philosophical', weight: 3 }] },
  { tagName: 'Memory Manipulation', type: 'structural', mappings: [{ traitId: 'memory_manipulation', weight: 5 }, { traitId: 'mindfuck', weight: 4 }, { traitId: 'psychological', weight: 3 }] },
  { tagName: 'Amnesia', type: 'structural', mappings: [{ traitId: 'memory_manipulation', weight: 4 }, { traitId: 'mystery', weight: 3 }, { traitId: 'identity_crisis', weight: 3 }] },
  { tagName: 'Dreams', type: 'structural', mappings: [{ traitId: 'mindfuck', weight: 3 }, { traitId: 'psychological', weight: 2 }, { traitId: 'absurd', weight: 2 }] },
  { tagName: 'Dissociative Identities', type: 'structural', mappings: [{ traitId: 'psychological', weight: 5 }, { traitId: 'identity_crisis', weight: 5 }, { traitId: 'mindfuck', weight: 3 }] },
  { tagName: 'Alternate Timeline', type: 'structural', mappings: [{ traitId: 'multiple_timelines', weight: 5 }, { traitId: 'mindfuck', weight: 3 }, { traitId: 'parallel_worlds', weight: 3 }] },
  { tagName: 'Parallel Universe', type: 'structural', mappings: [{ traitId: 'parallel_worlds', weight: 5 }, { traitId: 'mindfuck', weight: 2 }, { traitId: 'sci_fi', weight: 2 }] },
];
