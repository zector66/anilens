import type { TagDefinition } from '../tag-types';

export const ROMANCE_CLUSTER: TagDefinition[] = [
  // Core Romance tags with expanded trait coverage
  { tagName: 'Romance', type: 'primary', mappings: [
    { traitId: 'romance', weight: 5 }, 
    { traitId: 'romance_primary', weight: 4 }, 
    { traitId: 'romantic_voltage_high', weight: 3 },
    { traitId: 'emotionally_intimate', weight: 3 }
  ]},
  
  // Romantic structure variations
  { tagName: 'Love Triangle', type: 'structural', mappings: [
    { traitId: 'love_triangle', weight: 5 }, 
    { traitId: 'romance', weight: 4 }, 
    { traitId: 'romantic_vibe_messy', weight: 4 },
    { traitId: 'drama', weight: 3 }, 
    { traitId: 'anxiety', weight: 2 }
  ]},
  { tagName: 'Harem', type: 'primary', mappings: [{ traitId: 'harem', weight: 5 }, { traitId: 'romance', weight: 3 }, { traitId: 'comedy', weight: 2 }, { traitId: 'ecchi', weight: 2 }] },
  { tagName: 'Reverse Harem', type: 'primary', mappings: [{ traitId: 'reverse_harem', weight: 5 }, { traitId: 'romance', weight: 3 }, { traitId: 'comedy', weight: 2 }] },
  { tagName: 'Boys\' Love', type: 'primary', mappings: [
    { traitId: 'bl', weight: 5 }, 
    { traitId: 'romance', weight: 4 }, 
    { traitId: 'emotionally_intimate', weight: 3 },
    { traitId: 'drama', weight: 2 }
  ]},
  { tagName: 'Yuri', type: 'primary', mappings: [
    { traitId: 'yuri', weight: 5 }, 
    { traitId: 'romance', weight: 4 }, 
    { traitId: 'emotionally_intimate', weight: 3 },
    { traitId: 'drama', weight: 2 }
  ]},
  { tagName: 'Age Gap', type: 'flavor', mappings: [{ traitId: 'age_gap', weight: 5 }, { traitId: 'romance', weight: 3 }, { traitId: 'drama', weight: 2 }] },
  { tagName: 'Arranged Marriage', type: 'structural', mappings: [
    { traitId: 'arranged_marriage', weight: 5 }, 
    { traitId: 'romance', weight: 3 }, 
    { traitId: 'slow_burn', weight: 3 },
    { traitId: 'drama', weight: 3 }
  ]},
  { tagName: 'Childhood Friends', type: 'flavor', mappings: [
    { traitId: 'childhood_friends', weight: 5 }, 
    { traitId: 'romance', weight: 3 }, 
    { traitId: 'romantic_vibe_warm', weight: 3 },
    { traitId: 'nostalgia', weight: 2 }
  ]},
  { tagName: 'Unrequited Love', type: 'structural', mappings: [
    { traitId: 'unrequited', weight: 5 }, 
    { traitId: 'romance', weight: 3 }, 
    { traitId: 'romantic_vibe_bittersweet', weight: 4 },
    { traitId: 'emotional_damage', weight: 4 }, 
    { traitId: 'melancholic', weight: 3 }
  ]},
  { tagName: 'Love Polygon', type: 'structural', mappings: [
    { traitId: 'love_triangle', weight: 4 }, 
    { traitId: 'romance', weight: 4 }, 
    { traitId: 'romantic_vibe_messy', weight: 3 },
    { traitId: 'drama', weight: 3 }
  ]},
  { tagName: 'Polyamory', type: 'structural', mappings: [{ traitId: 'poly', weight: 5 }, { traitId: 'romance', weight: 4 }] },
  { tagName: 'Forbidden Love', type: 'structural', mappings: [
    { traitId: 'forbidden_romance', weight: 5 }, 
    { traitId: 'romance', weight: 4 }, 
    { traitId: 'romantic_vibe_tragic', weight: 4 },
    { traitId: 'drama', weight: 4 }, 
    { traitId: 'tragic', weight: 2 }
  ]},
  { tagName: 'Teacher/Student Relationship', type: 'structural', mappings: [{ traitId: 'forbidden_romance', weight: 4 }, { traitId: 'romance', weight: 4 }, { traitId: 'age_gap', weight: 3 }] },
  
  // Romantic pace/style
  { tagName: 'Slow Romance', type: 'structural', mappings: [
    { traitId: 'slow_burn', weight: 5 },
    { traitId: 'romance', weight: 3 },
    { traitId: 'romantic_voltage_low', weight: 3 }
  ]},
  { tagName: 'Primarily Romance', type: 'structural', mappings: [
    { traitId: 'romance_primary', weight: 5 },
    { traitId: 'romance', weight: 4 },
    { traitId: 'romantic_voltage_high', weight: 3 }
  ]},
  
  // Demographics
  { tagName: 'Primarily Female Cast', type: 'flavor', mappings: [{ traitId: 'cute', weight: 2 }] },
  { tagName: 'Primarily Male Cast', type: 'flavor', mappings: [{ traitId: 'bl', weight: 1 }] },
  { tagName: 'Female Protagonist', type: 'flavor', mappings: [] },
  { tagName: 'Male Protagonist', type: 'flavor', mappings: [] },
  { tagName: 'Shoujo', type: 'structural', mappings: [
    { traitId: 'romance', weight: 3 }, 
    { traitId: 'romantic_vibe_warm', weight: 3 },
    { traitId: 'emotionally_intimate', weight: 2 },
    { traitId: 'drama', weight: 2 }
  ]},
  { tagName: 'Shounen', type: 'structural', mappings: [{ traitId: 'action', weight: 2 }, { traitId: 'hype', weight: 2 }, { traitId: 'training_loop', weight: 2 }] },
  { tagName: 'Josei', type: 'structural', mappings: [
    { traitId: 'romance', weight: 2 }, 
    { traitId: 'adult_cast', weight: 3 }, 
    { traitId: 'romantic_vibe_bittersweet', weight: 2 },
    { traitId: 'drama', weight: 2 }
  ]},
  { tagName: 'Seinen', type: 'structural', mappings: [{ traitId: 'adult_cast', weight: 2 }, { traitId: 'dark', weight: 1 }] },
];
