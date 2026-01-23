import type { TagDefinition } from '../tag-types';

export const SCIFI_CLUSTER: TagDefinition[] = [
  { tagName: 'Cyberpunk', type: 'primary', mappings: [{ traitId: 'cyberpunk', weight: 5 }, { traitId: 'sci_fi', weight: 5 }, { traitId: 'dystopian', weight: 4 }, { traitId: 'noir', weight: 2 }, { traitId: 'cyber_city', weight: 4 }] },
  { tagName: 'Steampunk', type: 'primary', mappings: [{ traitId: 'steampunk', weight: 5 }, { traitId: 'sci_fi', weight: 4 }, { traitId: 'fantasy', weight: 2 }, { traitId: 'victorian', weight: 4 }] },
  { tagName: 'Mecha', type: 'primary', mappings: [{ traitId: 'mecha', weight: 5 }, { traitId: 'mecha_combat', weight: 5 }, { traitId: 'sci_fi', weight: 4 }, { traitId: 'military', weight: 3 }, { traitId: 'action', weight: 3 }] },
  { tagName: 'Robots', type: 'structural', mappings: [{ traitId: 'sci_fi', weight: 4 }, { traitId: 'action', weight: 2 }] },
  { tagName: 'Artificial Intelligence', type: 'structural', mappings: [{ traitId: 'sci_fi', weight: 5 }, { traitId: 'philosophical', weight: 3 }, { traitId: 'existential', weight: 2 }] },
  { tagName: 'Cyborg', type: 'structural', mappings: [{ traitId: 'sci_fi', weight: 4 }, { traitId: 'action', weight: 2 }, { traitId: 'cyberpunk', weight: 2 }] },
  { tagName: 'Space', type: 'structural', mappings: [{ traitId: 'sci_fi', weight: 4 }, { traitId: 'space_setting', weight: 5 }, { traitId: 'adventure', weight: 2 }] },
  { tagName: 'Space Opera', type: 'primary', mappings: [{ traitId: 'space_opera', weight: 5 }, { traitId: 'sci_fi', weight: 5 }, { traitId: 'space_setting', weight: 5 }, { traitId: 'epic', weight: 4 }, { traitId: 'war', weight: 2 }, { traitId: 'adventure', weight: 3 }] },
  { tagName: 'Time Travel', type: 'primary', mappings: [{ traitId: 'time_travel', weight: 5 }, { traitId: 'sci_fi', weight: 4 }, { traitId: 'mystery', weight: 2 }, { traitId: 'mindfuck', weight: 2 }] },
  { tagName: 'Time Loop', type: 'primary', mappings: [{ traitId: 'time_loop', weight: 5 }, { traitId: 'thriller', weight: 3 }, { traitId: 'mindfuck', weight: 3 }, { traitId: 'mystery', weight: 2 }] },
  { tagName: 'Time Manipulation', type: 'primary', mappings: [{ traitId: 'time_travel', weight: 4 }, { traitId: 'time_loop', weight: 3 }, { traitId: 'sci_fi', weight: 3 }, { traitId: 'fantasy', weight: 2 }] },
  { tagName: 'Virtual World', type: 'primary', mappings: [{ traitId: 'virtual_mmo', weight: 5 }, { traitId: 'sci_fi', weight: 3 }, { traitId: 'isekai', weight: 2 }, { traitId: 'rpg_mechanics', weight: 3 }] },
  { tagName: 'Augmented Reality', type: 'structural', mappings: [{ traitId: 'sci_fi', weight: 4 }, { traitId: 'psychological', weight: 2 }, { traitId: 'modern_urban', weight: 2 }] },
  { tagName: 'Aliens', type: 'structural', mappings: [{ traitId: 'sci_fi', weight: 4 }, { traitId: 'space_setting', weight: 2 }, { traitId: 'horror', weight: 2 }] },
  { tagName: 'Post-Apocalyptic', type: 'primary', mappings: [{ traitId: 'post_apocalyptic', weight: 5 }, { traitId: 'post_apoc_ruins', weight: 5 }, { traitId: 'survival', weight: 4 }, { traitId: 'dark', weight: 3 }] },
  { tagName: 'Dystopia', type: 'primary', mappings: [{ traitId: 'dystopian', weight: 5 }, { traitId: 'dystopia_setting', weight: 5 }, { traitId: 'political', weight: 3 }, { traitId: 'thriller', weight: 2 }, { traitId: 'dark', weight: 3 }] },
  { tagName: 'Sci-Fi', type: 'primary', mappings: [{ traitId: 'sci_fi', weight: 5 }] },
  { tagName: 'Futuristic', type: 'structural', mappings: [{ traitId: 'sci_fi', weight: 4 }, { traitId: 'cyber_city', weight: 2 }] },
  { tagName: 'Anti-Gravity', type: 'flavor', mappings: [{ traitId: 'sci_fi', weight: 3 }] },
  { tagName: 'Tokusatsu', type: 'structural', mappings: [{ traitId: 'superhero', weight: 3 }, { traitId: 'action', weight: 3 }, { traitId: 'kaiju_scale', weight: 2 }] },
];
