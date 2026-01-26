/**
 * TRAIT UNIVERSE - The complete trait taxonomy for anime/manga taste analysis
 * 
 * This defines 100+ traits organized into categories:
 * 1. Genre DNA (root identity)
 * 2. Tone/Vibe (how it feels)
 * 3. Emotional Output (what it does to you)
 * 4. Plot Engine (how story moves)
 * 5. Narrative Complexity (mind traits)
 * 6. Setting (where + what world)
 * 7. Cast Composition (social dynamics)
 * 8. Combat/Power System
 * 9. Romance Configuration
 * 10. Comedy Types
 * 11. Content Intensity (warnings)
 * 12. Production/Format
 */

// ============================================================================
// TRAIT CATEGORIES
// ============================================================================

export type TraitCategory = 
  | 'genre_dna'
  | 'tone_vibe'
  | 'emotional_output'
  | 'plot_engine'
  | 'narrative_complexity'
  | 'setting'
  | 'cast_composition'
  | 'combat_power'
  | 'romance_config'
  | 'comedy_type'
  | 'content_intensity'
  | 'production_format';

export type ScoringChannel = 'identity' | 'vibe' | 'structure' | 'intensity';

// Role determines how a trait functions in the system
export type TraitRole = 'core' | 'modifier' | 'mechanic' | 'warning';

// Polarity for future "likes vs tolerates" analysis
export type TraitPolarity = 'positive' | 'negative' | 'neutral';

export interface TraitDefinition {
  id: string;
  name: string;
  category: TraitCategory;
  channel: ScoringChannel;
  description?: string;
  role?: TraitRole;           // core = identity, modifier = flavor, mechanic = structure, warning = content
  diminishRate?: number;      // Per-trait diminishing rate (default 0.15). Broad traits higher, rare traits lower.
  polarity?: TraitPolarity;   // For future preference vs tolerance analysis
}

// ============================================================================
// 1. GENRE DNA (Root Identity) - Channel: identity
// ============================================================================

export const GENRE_DNA_TRAITS: TraitDefinition[] = [
  // Broad genres diminish faster (0.25), specific genres slower (0.10-0.15)
  { id: 'action', name: 'Action', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.25 },
  { id: 'adventure', name: 'Adventure', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.22 },
  { id: 'comedy', name: 'Comedy', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.25 },
  { id: 'drama', name: 'Drama', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.25 },
  { id: 'romance', name: 'Romance', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.15 }, // Slower diminish for identity trait
  { id: 'slice_of_life', name: 'Slice of Life', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.20 },
  { id: 'fantasy', name: 'Fantasy', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.22 },
  { id: 'sci_fi', name: 'Sci-Fi', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.18 },
  { id: 'supernatural', name: 'Supernatural', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.20 },
  { id: 'mystery', name: 'Mystery', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.15 },
  { id: 'thriller', name: 'Thriller', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.15 },
  { id: 'horror', name: 'Horror', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.12 },
  { id: 'psychological', name: 'Psychological', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.12 },
  { id: 'crime', name: 'Crime', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.12 },
  { id: 'sports', name: 'Sports', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.12 },
  { id: 'mecha', name: 'Mecha', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.10 },
  { id: 'music', name: 'Music', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.10 },
  { id: 'mahou_shoujo', name: 'Mahou Shoujo', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.08 },
  { id: 'ecchi', name: 'Ecchi', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.15, polarity: 'negative' },
  { id: 'historical', name: 'Historical', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.12 },
  { id: 'military', name: 'Military', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.12 },
  { id: 'war', name: 'War', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.12 },
  { id: 'political', name: 'Political', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.10 },
  { id: 'superhero', name: 'Superhero', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.12 },
  { id: 'post_apocalyptic', name: 'Post-Apocalyptic', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.10 },
  { id: 'dystopian', name: 'Dystopian', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.10 },
  { id: 'cyberpunk', name: 'Cyberpunk', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.08 },
  { id: 'steampunk', name: 'Steampunk', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.08 },
  { id: 'space_opera', name: 'Space Opera', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.08 },
  { id: 'western', name: 'Western', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.06 },
  { id: 'noir', name: 'Noir', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.08 },
  { id: 'survival', name: 'Survival', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.12 },
  { id: 'game_competition', name: 'Game/Competition', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.12 },
  { id: 'isekai', name: 'Isekai', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.18 },
  { id: 'cultivation', name: 'Cultivation', category: 'genre_dna', channel: 'identity', role: 'core', diminishRate: 0.10 },
];

// ============================================================================
// 2. TONE / VIBE (How it feels) - Channel: vibe
// ============================================================================

export const TONE_VIBE_TRAITS: TraitDefinition[] = [
  // Modifiers that color the experience - moderate diminishing
  { id: 'wholesome', name: 'Wholesome/Healing', category: 'tone_vibe', channel: 'vibe', description: 'Iyashikei', role: 'modifier', diminishRate: 0.15, polarity: 'positive' },
  { id: 'cozy', name: 'Cozy/Comfort', category: 'tone_vibe', channel: 'vibe', role: 'modifier', diminishRate: 0.15, polarity: 'positive' },
  { id: 'chill', name: 'Chill/Low Stakes', category: 'tone_vibe', channel: 'vibe', role: 'modifier', diminishRate: 0.18 },
  { id: 'warm', name: 'Warm/Heartfelt', category: 'tone_vibe', channel: 'vibe', role: 'modifier', diminishRate: 0.15, polarity: 'positive' },
  { id: 'hopeful', name: 'Hopeful', category: 'tone_vibe', channel: 'vibe', role: 'modifier', diminishRate: 0.15 },
  { id: 'bittersweet', name: 'Bittersweet', category: 'tone_vibe', channel: 'vibe', role: 'modifier', diminishRate: 0.12 },
  { id: 'melancholic', name: 'Melancholic', category: 'tone_vibe', channel: 'vibe', role: 'modifier', diminishRate: 0.12 },
  { id: 'sad', name: 'Sad/Depressing', category: 'tone_vibe', channel: 'vibe', role: 'modifier', diminishRate: 0.12 },
  { id: 'tragic', name: 'Tragic', category: 'tone_vibe', channel: 'vibe', role: 'modifier', diminishRate: 0.10 },
  { id: 'dark', name: 'Dark', category: 'tone_vibe', channel: 'vibe', role: 'modifier', diminishRate: 0.15 },
  { id: 'grim', name: 'Grim', category: 'tone_vibe', channel: 'vibe', role: 'modifier', diminishRate: 0.12 },
  { id: 'edgy', name: 'Edgy', category: 'tone_vibe', channel: 'vibe', role: 'modifier', diminishRate: 0.15 },
  { id: 'gritty', name: 'Gritty/Realistic', category: 'tone_vibe', channel: 'vibe', role: 'modifier', diminishRate: 0.12 },
  { id: 'tense', name: 'Tense', category: 'tone_vibe', channel: 'vibe', role: 'modifier', diminishRate: 0.15 },
  { id: 'paranoid', name: 'Paranoid', category: 'tone_vibe', channel: 'vibe', role: 'modifier', diminishRate: 0.10 },
  { id: 'creepy', name: 'Creepy', category: 'tone_vibe', channel: 'vibe', role: 'modifier', diminishRate: 0.10 },
  { id: 'disturbing', name: 'Disturbing', category: 'tone_vibe', channel: 'vibe', role: 'modifier', diminishRate: 0.08 },
  { id: 'hype', name: 'Hype/Adrenaline', category: 'tone_vibe', channel: 'vibe', role: 'modifier', diminishRate: 0.20 },
  { id: 'epic', name: 'Epic/Grand', category: 'tone_vibe', channel: 'vibe', role: 'modifier', diminishRate: 0.15 },
  { id: 'romantic_vibes', name: 'Romantic Vibes', category: 'tone_vibe', channel: 'vibe', role: 'modifier', diminishRate: 0.18 },
  { id: 'cute', name: 'Cute/Moe', category: 'tone_vibe', channel: 'vibe', role: 'modifier', diminishRate: 0.18, polarity: 'positive' },
  { id: 'chaotic', name: 'Chaotic', category: 'tone_vibe', channel: 'vibe', role: 'modifier', diminishRate: 0.12 },
  { id: 'absurd', name: 'Absurd/Surreal', category: 'tone_vibe', channel: 'vibe', role: 'modifier', diminishRate: 0.10 },
  { id: 'satirical', name: 'Satirical', category: 'tone_vibe', channel: 'vibe', role: 'modifier', diminishRate: 0.08 },
  { id: 'meta', name: 'Meta/Self-aware', category: 'tone_vibe', channel: 'vibe', role: 'modifier', diminishRate: 0.08 },
  { id: 'cool_factor', name: 'Cool Factor', category: 'tone_vibe', channel: 'vibe', description: 'Style-driven swagger', role: 'modifier', diminishRate: 0.15 },
];

// ============================================================================
// 3. EMOTIONAL OUTPUT (What it does to you) - Channel: vibe
// ============================================================================

export const EMOTIONAL_OUTPUT_TRAITS: TraitDefinition[] = [
  { id: 'emotional_damage', name: 'Emotional Damage', category: 'emotional_output', channel: 'vibe' },
  { id: 'tearjerker', name: 'Tearjerker', category: 'emotional_output', channel: 'vibe' },
  { id: 'catharsis', name: 'Catharsis', category: 'emotional_output', channel: 'vibe' },
  { id: 'anxiety', name: 'Anxiety/Stress', category: 'emotional_output', channel: 'vibe' },
  { id: 'comfort_food', name: 'Comfort Food', category: 'emotional_output', channel: 'vibe' },
  { id: 'rage', name: 'Rage/Frustration', category: 'emotional_output', channel: 'vibe' },
  { id: 'shock', name: 'Shock/WTF', category: 'emotional_output', channel: 'vibe' },
  { id: 'awe', name: 'Awe/Wonder', category: 'emotional_output', channel: 'vibe' },
  { id: 'existential_dread', name: 'Existential Dread', category: 'emotional_output', channel: 'vibe' },
  { id: 'nostalgia', name: 'Nostalgia', category: 'emotional_output', channel: 'vibe' },
  { id: 'loneliness', name: 'Loneliness', category: 'emotional_output', channel: 'vibe' },
  { id: 'attachment', name: 'Attachment/Parasocial', category: 'emotional_output', channel: 'vibe' },
  { id: 'character_missing', name: '"I Miss These Characters"', category: 'emotional_output', channel: 'vibe' },
];

// ============================================================================
// 4. PLOT ENGINE (How story moves) - Channel: structure
// ============================================================================

export const PLOT_ENGINE_TRAITS: TraitDefinition[] = [
  { id: 'episodic', name: 'Episodic', category: 'plot_engine', channel: 'structure', description: 'Self-contained stories with new adventures each episode' },
  { id: 'serialized', name: 'Serialized/Long-Arc', category: 'plot_engine', channel: 'structure', description: 'Continuous story that builds over many episodes' },
  { id: 'monster_of_week', name: 'Monster-of-the-Week', category: 'plot_engine', channel: 'structure', description: 'New challenge or villain each episode with familiar heroes' },
  { id: 'mystery_box', name: 'Mystery Box', category: 'plot_engine', channel: 'structure', description: 'Story built around unanswered questions and gradual reveals' },
  { id: 'heist_structure', name: 'Heist Structure', category: 'plot_engine', channel: 'structure', description: 'Planning and executing a complex mission with a team' },
  { id: 'investigation_loop', name: 'Investigation Loop', category: 'plot_engine', channel: 'structure', description: 'Solving mysteries or crimes through clues and deduction' },
  { id: 'training_loop', name: 'Training/Improvement Loop', category: 'plot_engine', channel: 'structure', description: 'Characters getting stronger through practice and challenges' },
  { id: 'tournament_engine', name: 'Tournament Arc Engine', category: 'plot_engine', channel: 'structure', description: 'Competition format with multiple rounds and escalating opponents' },
  { id: 'quest_engine', name: 'Quest/Journey Engine', category: 'plot_engine', channel: 'structure', description: 'Adventure format with clear goals and destinations' },
  { id: 'war_campaign', name: 'War Campaign Engine', category: 'plot_engine', channel: 'structure', description: 'Large-scale conflicts with battles and strategy' },
  { id: 'scheme_engine', name: 'Politics/Scheme Engine', category: 'plot_engine', channel: 'structure', description: 'Complex plots involving manipulation, strategy, and power plays' },
  { id: 'revenge_engine', name: 'Revenge Engine', category: 'plot_engine', channel: 'structure', description: 'Story driven by seeking vengeance for past wrongs' },
  { id: 'survival_engine', name: 'Survival/Attrition Engine', category: 'plot_engine', channel: 'structure', description: 'Characters struggling to stay alive in harsh conditions' },
  { id: 'death_game_engine', name: 'Death Game Engine', category: 'plot_engine', channel: 'structure', description: 'Life-or-death competition with rules and consequences' },
  { id: 'romance_progression', name: 'Romance Progression Engine', category: 'plot_engine', channel: 'structure', description: 'Story focused on developing romantic relationships over time' },
  { id: 'sol_routine', name: 'Slice-of-Life Routine Engine', category: 'plot_engine', channel: 'structure', description: 'Everyday life situations and character interactions' },
  { id: 'workplace_routine', name: 'Workplace Routine Engine', category: 'plot_engine', channel: 'structure', description: 'Story centered around professional life and workplace dynamics' },
  { id: 'escalation_engine', name: 'Escalation Engine', category: 'plot_engine', channel: 'structure', description: 'Stakes and conflicts keep getting more intense over time' },
];

// ============================================================================
// 5. NARRATIVE COMPLEXITY (Mind traits) - Channel: structure
// ============================================================================

export const NARRATIVE_COMPLEXITY_TRAITS: TraitDefinition[] = [
  { id: 'philosophical', name: 'Philosophical', category: 'narrative_complexity', channel: 'structure', description: 'Explores deep questions about life, morality, and human nature' },
  { id: 'existential', name: 'Existential', category: 'narrative_complexity', channel: 'structure', description: 'Deals with meaning, purpose, and the human condition' },
  { id: 'mindfuck', name: 'Mindfuck', category: 'narrative_complexity', channel: 'structure', description: 'Reality-bending stories that challenge your perception and understanding' },
  { id: 'psychological_warfare', name: 'Psychological Warfare', category: 'narrative_complexity', channel: 'structure' },
  { id: 'unreliable_narrator', name: 'Unreliable Narrator', category: 'narrative_complexity', channel: 'structure' },
  { id: 'nonlinear', name: 'Nonlinear Timeline', category: 'narrative_complexity', channel: 'structure' },
  { id: 'achronological', name: 'Achronological Order', category: 'narrative_complexity', channel: 'structure' },
  { id: 'multiple_timelines', name: 'Multiple Timelines', category: 'narrative_complexity', channel: 'structure' },
  { id: 'time_loop', name: 'Time Loop', category: 'narrative_complexity', channel: 'structure' },
  { id: 'time_travel', name: 'Time Travel', category: 'narrative_complexity', channel: 'structure' },
  { id: 'parallel_worlds', name: 'Parallel Worlds', category: 'narrative_complexity', channel: 'structure' },
  { id: 'memory_manipulation', name: 'Memory Manipulation', category: 'narrative_complexity', channel: 'structure' },
  { id: 'identity_crisis', name: 'Identity Crisis', category: 'narrative_complexity', channel: 'structure' },
  { id: 'fourth_wall', name: 'Meta/4th Wall', category: 'narrative_complexity', channel: 'structure' },
  { id: 'denpa', name: 'Denpa', category: 'narrative_complexity', channel: 'structure', description: 'Signal noise insanity' },
  { id: 'abstract_symbolism', name: 'Abstract Symbolism', category: 'narrative_complexity', channel: 'structure' },
];

// ============================================================================
// 6. SETTING TRAITS (Where + what world) - Channel: identity
// ============================================================================

export const SETTING_TRAITS: TraitDefinition[] = [
  { id: 'modern_urban', name: 'Modern Urban', category: 'setting', channel: 'identity' },
  { id: 'modern_rural', name: 'Modern Rural', category: 'setting', channel: 'identity' },
  { id: 'small_town', name: 'Small Town', category: 'setting', channel: 'identity' },
  { id: 'big_city', name: 'Big City', category: 'setting', channel: 'identity' },
  { id: 'school_world', name: 'School World', category: 'setting', channel: 'identity' },
  { id: 'college_world', name: 'College World', category: 'setting', channel: 'identity' },
  { id: 'workplace_world', name: 'Workplace World', category: 'setting', channel: 'identity' },
  { id: 'showbiz', name: 'Showbiz/Idol Industry', category: 'setting', channel: 'identity' },
  { id: 'food_world', name: 'Restaurant/Food World', category: 'setting', channel: 'identity' },
  { id: 'medical_world', name: 'Hospital/Medical World', category: 'setting', channel: 'identity' },
  { id: 'legal_world', name: 'Courtroom/Legal World', category: 'setting', channel: 'identity' },
  { id: 'prison_world', name: 'Prison World', category: 'setting', channel: 'identity' },
  { id: 'military_base', name: 'Military Base', category: 'setting', channel: 'identity' },
  { id: 'battlefield', name: 'Battlefield', category: 'setting', channel: 'identity' },
  { id: 'space_setting', name: 'Space Setting', category: 'setting', channel: 'identity' },
  { id: 'space_colony', name: 'Space Colony', category: 'setting', channel: 'identity' },
  { id: 'alien_planet', name: 'Alien Planet', category: 'setting', channel: 'identity' },
  { id: 'cyber_city', name: 'Cyber City', category: 'setting', channel: 'identity' },
  { id: 'fantasy_medieval', name: 'Fantasy Medieval', category: 'setting', channel: 'identity' },
  { id: 'ancient_world', name: 'Ancient World', category: 'setting', channel: 'identity' },
  { id: 'feudal_japan', name: 'Feudal Japan', category: 'setting', channel: 'identity' },
  { id: 'victorian', name: 'Victorian/Industrial', category: 'setting', channel: 'identity' },
  { id: 'desert', name: 'Desert', category: 'setting', channel: 'identity' },
  { id: 'arctic', name: 'Snow/Arctic', category: 'setting', channel: 'identity' },
  { id: 'ocean_island', name: 'Ocean/Island', category: 'setting', channel: 'identity' },
  { id: 'underground', name: 'Underground', category: 'setting', channel: 'identity' },
  { id: 'post_apoc_ruins', name: 'Post-Apocalyptic Ruins', category: 'setting', channel: 'identity' },
  { id: 'dystopia_setting', name: 'Dystopia', category: 'setting', channel: 'identity' },
  { id: 'virtual_mmo', name: 'Virtual World/MMO', category: 'setting', channel: 'identity' },
  { id: 'afterlife', name: 'Afterlife/Spirit World', category: 'setting', channel: 'identity' },
  { id: 'alt_universe', name: 'Alternate Universe', category: 'setting', channel: 'identity' },
];

// ============================================================================
// 7. CAST COMPOSITION / SOCIAL DYNAMICS - Channel: structure
// ============================================================================

export const CAST_COMPOSITION_TRAITS: TraitDefinition[] = [
  { id: 'ensemble_cast', name: 'Ensemble Cast', category: 'cast_composition', channel: 'structure' },
  { id: 'duo_focus', name: 'Duo Focus', category: 'cast_composition', channel: 'structure' },
  { id: 'large_party', name: 'Large Party/Guild', category: 'cast_composition', channel: 'structure' },
  { id: 'found_family', name: 'Found Family', category: 'cast_composition', channel: 'structure' },
  { id: 'family_drama', name: 'Family Drama', category: 'cast_composition', channel: 'structure' },
  { id: 'romance_duo', name: 'Romance Duo Focus', category: 'cast_composition', channel: 'structure' },
  { id: 'rivalry_core', name: 'Rivalry Core', category: 'cast_composition', channel: 'structure' },
  { id: 'mentor_student', name: 'Mentor/Student', category: 'cast_composition', channel: 'structure' },
  { id: 'misfits', name: 'Misfits/Outcasts', category: 'cast_composition', channel: 'structure' },
  { id: 'antihero', name: 'Antihero Lead', category: 'cast_composition', channel: 'structure' },
  { id: 'villain_protag', name: 'Villain Protagonist', category: 'cast_composition', channel: 'structure' },
  { id: 'morally_gray', name: 'Morally Gray Ensemble', category: 'cast_composition', channel: 'structure' },
  { id: 'kids_cast', name: 'Kids Cast', category: 'cast_composition', channel: 'structure' },
  { id: 'teen_cast', name: 'Teen Cast', category: 'cast_composition', channel: 'structure' },
  { id: 'adult_cast', name: 'Adult Cast', category: 'cast_composition', channel: 'structure' },
  { id: 'workplace_adults', name: 'Workplace Adults', category: 'cast_composition', channel: 'structure' },
  { id: 'military_squad', name: 'Military Squad', category: 'cast_composition', channel: 'structure' },
  { id: 'criminal_gang', name: 'Criminal Gang', category: 'cast_composition', channel: 'structure' },
  { id: 'detective_pair', name: 'Detective Pair', category: 'cast_composition', channel: 'structure' },
  { id: 'power_trio', name: 'Power Trio', category: 'cast_composition', channel: 'structure', description: 'Shounen core' },
];

// ============================================================================
// 8. COMBAT / POWER SYSTEM TRAITS - Channel: identity
// ============================================================================

export const COMBAT_POWER_TRAITS: TraitDefinition[] = [
  { id: 'magic_system', name: 'Magic System Focus', category: 'combat_power', channel: 'identity' },
  { id: 'superpowers', name: 'Superpowers Focus', category: 'combat_power', channel: 'identity' },
  { id: 'martial_arts', name: 'Martial Arts Focus', category: 'combat_power', channel: 'identity' },
  { id: 'swordplay', name: 'Swordplay Focus', category: 'combat_power', channel: 'identity' },
  { id: 'gunplay', name: 'Gunplay Focus', category: 'combat_power', channel: 'identity' },
  { id: 'tactical_combat', name: 'Tactical Combat Focus', category: 'combat_power', channel: 'identity' },
  { id: 'mindgames_combat', name: 'Strategy/Mindgames Combat', category: 'combat_power', channel: 'identity' },
  { id: 'summons', name: 'Summons/Companions', category: 'combat_power', channel: 'identity' },
  { id: 'monster_taming', name: 'Monster Taming', category: 'combat_power', channel: 'identity' },
  { id: 'transformation', name: 'Transformation Focus', category: 'combat_power', channel: 'identity' },
  { id: 'mecha_combat', name: 'Mecha Combat Focus', category: 'combat_power', channel: 'identity' },
  { id: 'kaiju_scale', name: 'Kaiju Scale Combat', category: 'combat_power', channel: 'identity' },
  { id: 'cultivation_power', name: 'Cultivation/Wuxia Power', category: 'combat_power', channel: 'identity' },
  { id: 'rpg_mechanics', name: 'Dungeon/RPG Mechanics', category: 'combat_power', channel: 'identity' },
  { id: 'skill_trees', name: 'Skill Trees/Levels', category: 'combat_power', channel: 'identity' },
  { id: 'necromancy', name: 'Necromancy', category: 'combat_power', channel: 'identity' },
  { id: 'curses', name: 'Curses', category: 'combat_power', channel: 'identity' },
  { id: 'exorcism', name: 'Exorcism', category: 'combat_power', channel: 'identity' },
  { id: 'vampires', name: 'Vampires', category: 'combat_power', channel: 'identity' },
  { id: 'werewolves', name: 'Werewolves', category: 'combat_power', channel: 'identity' },
  { id: 'youkai', name: 'Youkai', category: 'combat_power', channel: 'identity' },
  { id: 'angels', name: 'Angels', category: 'combat_power', channel: 'identity' },
  { id: 'demons', name: 'Demons', category: 'combat_power', channel: 'identity' },
  { id: 'gods', name: 'Gods/Mythic Entities', category: 'combat_power', channel: 'identity' },
];

// ============================================================================
// 9. ROMANCE CONFIGURATION TRAITS - Channel: structure
// ============================================================================

export const ROMANCE_CONFIG_TRAITS: TraitDefinition[] = [
  // Romance Structure (how the romance is configured)
  { id: 'romance_primary', name: 'Romance Primary', category: 'romance_config', channel: 'structure', description: 'Romance is the main focus of the story' },
  { id: 'romance_secondary', name: 'Romance Secondary', category: 'romance_config', channel: 'structure', description: 'Romance is a subplot but still significant' },
  { id: 'slow_burn', name: 'Slow Burn', category: 'romance_config', channel: 'structure', description: 'Romance develops gradually over time' },
  { id: 'fast_burn', name: 'Fast Burn', category: 'romance_config', channel: 'structure', description: 'Romance develops quickly and intensely' },
  { id: 'love_triangle', name: 'Love Triangle', category: 'romance_config', channel: 'structure' },
  { id: 'harem', name: 'Harem', category: 'romance_config', channel: 'structure' },
  { id: 'reverse_harem', name: 'Reverse Harem', category: 'romance_config', channel: 'structure' },
  { id: 'poly', name: 'Poly', category: 'romance_config', channel: 'structure' },
  { id: 'age_gap', name: 'Age Gap', category: 'romance_config', channel: 'structure' },
  { id: 'childhood_friends', name: 'Childhood Friends', category: 'romance_config', channel: 'structure' },
  { id: 'enemies_to_lovers', name: 'Enemies to Lovers', category: 'romance_config', channel: 'structure' },
  { id: 'fake_dating', name: 'Fake Dating', category: 'romance_config', channel: 'structure' },
  { id: 'arranged_marriage', name: 'Arranged Marriage', category: 'romance_config', channel: 'structure' },
  { id: 'cohabitation', name: 'Cohabitation', category: 'romance_config', channel: 'structure' },
  { id: 'unrequited', name: 'Unrequited Love', category: 'romance_config', channel: 'structure' },
  { id: 'forbidden_romance', name: 'Forbidden Romance', category: 'romance_config', channel: 'structure' },
  { id: 'bl', name: 'BL', category: 'romance_config', channel: 'structure' },
  { id: 'yuri', name: 'Yuri', category: 'romance_config', channel: 'structure' },
  
  // Romantic Voltage (emotional intensity of romance) - NEW
  { id: 'romantic_voltage_high', name: 'High Romantic Voltage', category: 'romance_config', channel: 'vibe', description: 'Intense, passionate romantic moments', diminishRate: 0.15 },
  { id: 'romantic_voltage_low', name: 'Low Romantic Voltage', category: 'romance_config', channel: 'vibe', description: 'Subtle, understated romantic connection', diminishRate: 0.15 },
  { id: 'emotionally_intimate', name: 'Emotionally Intimate', category: 'romance_config', channel: 'vibe', description: 'Deep emotional connection and vulnerability', diminishRate: 0.12 },
  
  // Romantic Vibe (emotional tone of romance) - NEW
  { id: 'romantic_vibe_warm', name: 'Warm Romance', category: 'romance_config', channel: 'vibe', description: 'Cozy, heartwarming romantic feelings', diminishRate: 0.15 },
  { id: 'romantic_vibe_bittersweet', name: 'Bittersweet Romance', category: 'romance_config', channel: 'vibe', description: 'Romance mixed with sadness or sacrifice', diminishRate: 0.12 },
  { id: 'romantic_vibe_tragic', name: 'Tragic Romance', category: 'romance_config', channel: 'vibe', description: 'Romance that ends in tragedy or heartbreak', diminishRate: 0.10 },
  { id: 'romantic_vibe_messy', name: 'Messy Romance', category: 'romance_config', channel: 'vibe', description: 'Complicated, drama-filled romantic situations', diminishRate: 0.12 },
];

// ============================================================================
// 10. COMEDY TYPES - Channel: vibe
// ============================================================================

export const COMEDY_TYPE_TRAITS: TraitDefinition[] = [
  { id: 'slapstick', name: 'Slapstick', category: 'comedy_type', channel: 'vibe' },
  { id: 'deadpan', name: 'Deadpan', category: 'comedy_type', channel: 'vibe' },
  { id: 'situational', name: 'Situational Comedy', category: 'comedy_type', channel: 'vibe' },
  { id: 'romcom', name: 'Romantic Comedy', category: 'comedy_type', channel: 'vibe' },
  { id: 'parody', name: 'Parody', category: 'comedy_type', channel: 'vibe' },
  { id: 'satire', name: 'Satire', category: 'comedy_type', channel: 'vibe' },
  { id: 'surreal_comedy', name: 'Surreal Comedy', category: 'comedy_type', channel: 'vibe' },
  { id: 'dark_comedy', name: 'Dark Comedy', category: 'comedy_type', channel: 'vibe' },
  { id: 'cringe_comedy', name: 'Cringe Comedy', category: 'comedy_type', channel: 'vibe' },
  { id: 'meta_comedy', name: 'Meta Comedy', category: 'comedy_type', channel: 'vibe' },
];

// ============================================================================
// 11. CONTENT INTENSITY TRAITS (Warnings) - Channel: intensity
// ============================================================================

export const CONTENT_INTENSITY_TRAITS: TraitDefinition[] = [
  // Warning traits - low diminish rate since these are significant signals
  { id: 'violence_level', name: 'Violence Level', category: 'content_intensity', channel: 'intensity', role: 'warning', diminishRate: 0.12, polarity: 'negative' },
  { id: 'gore_level', name: 'Gore Level', category: 'content_intensity', channel: 'intensity', role: 'warning', diminishRate: 0.08, polarity: 'negative' },
  { id: 'body_horror', name: 'Body Horror', category: 'content_intensity', channel: 'intensity', role: 'warning', diminishRate: 0.06, polarity: 'negative' },
  { id: 'torture', name: 'Torture', category: 'content_intensity', channel: 'intensity', role: 'warning', diminishRate: 0.05, polarity: 'negative' },
  { id: 'suicide_themes', name: 'Suicide Themes', category: 'content_intensity', channel: 'intensity', role: 'warning', diminishRate: 0.05, polarity: 'negative' },
  { id: 'bullying', name: 'Bullying', category: 'content_intensity', channel: 'intensity', role: 'warning', diminishRate: 0.08, polarity: 'negative' },
  { id: 'sexual_content', name: 'Sexual Content Level', category: 'content_intensity', channel: 'intensity', role: 'warning', diminishRate: 0.10, polarity: 'negative' },
  { id: 'nudity', name: 'Nudity', category: 'content_intensity', channel: 'intensity', role: 'warning', diminishRate: 0.12, polarity: 'negative' },
  { id: 'fetish_density', name: 'Fetish Density', category: 'content_intensity', channel: 'intensity', role: 'warning', diminishRate: 0.08, polarity: 'negative' },
  { id: 'substance_use', name: 'Substance Use', category: 'content_intensity', channel: 'intensity', role: 'warning', diminishRate: 0.08, polarity: 'negative' },
  { id: 'abuse_themes', name: 'Abuse/Trauma Themes', category: 'content_intensity', channel: 'intensity', role: 'warning', diminishRate: 0.05, polarity: 'negative' },
  { id: 'psychological_abuse', name: 'Psychological Abuse', category: 'content_intensity', channel: 'intensity', role: 'warning', diminishRate: 0.05, polarity: 'negative' },
  // NEW: Cruelty-specific traits for better differentiation
  { id: 'humiliation', name: 'Humiliation', category: 'content_intensity', channel: 'intensity', role: 'warning', diminishRate: 0.05, polarity: 'negative' },
  { id: 'despair', name: 'Despair', category: 'content_intensity', channel: 'intensity', role: 'warning', diminishRate: 0.06, polarity: 'negative' },
];

// ============================================================================
// 12. PRODUCTION / FORMAT TRAITS - Channel: identity (separate)
// ============================================================================

export const PRODUCTION_FORMAT_TRAITS: TraitDefinition[] = [
  { id: 'format_tv', name: 'TV', category: 'production_format', channel: 'identity' },
  { id: 'format_movie', name: 'Movie', category: 'production_format', channel: 'identity' },
  { id: 'format_ova', name: 'OVA/ONA', category: 'production_format', channel: 'identity' },
  { id: 'short_episodes', name: 'Short Episodes', category: 'production_format', channel: 'identity' },
  { id: 'long_episodes', name: 'Long Episodes', category: 'production_format', channel: 'identity' },
  { id: 'anthology', name: 'Anthology', category: 'production_format', channel: 'identity' },
  { id: 'multiple_seasons', name: 'Multiple Seasons', category: 'production_format', channel: 'identity' },
  { id: 'standalone', name: 'Standalone', category: 'production_format', channel: 'identity' },
  { id: 'adaptation', name: 'Adaptation', category: 'production_format', channel: 'identity' },
  { id: 'original', name: 'Original', category: 'production_format', channel: 'identity' },
  { id: 'experimental_art', name: 'Experimental Artstyle', category: 'production_format', channel: 'identity' },
  { id: 'oldschool', name: 'Oldschool Aesthetic', category: 'production_format', channel: 'identity' },
  { id: 'high_animation', name: 'High Animation Priority', category: 'production_format', channel: 'identity' },
  { id: 'cgi_heavy', name: 'CGI Heavy', category: 'production_format', channel: 'identity' },
  { id: 'music_video', name: 'Music Video DNA', category: 'production_format', channel: 'identity' },
];

// ============================================================================
// ALL TRAITS COMBINED
// ============================================================================

export const ALL_TRAITS: TraitDefinition[] = [
  ...GENRE_DNA_TRAITS,
  ...TONE_VIBE_TRAITS,
  ...EMOTIONAL_OUTPUT_TRAITS,
  ...PLOT_ENGINE_TRAITS,
  ...NARRATIVE_COMPLEXITY_TRAITS,
  ...SETTING_TRAITS,
  ...CAST_COMPOSITION_TRAITS,
  ...COMBAT_POWER_TRAITS,
  ...ROMANCE_CONFIG_TRAITS,
  ...COMEDY_TYPE_TRAITS,
  ...CONTENT_INTENSITY_TRAITS,
  ...PRODUCTION_FORMAT_TRAITS,
];

export const TRAIT_BY_ID = new Map(ALL_TRAITS.map(t => [t.id, t]));

export const TRAITS_BY_CATEGORY: Record<TraitCategory, TraitDefinition[]> = {
  genre_dna: GENRE_DNA_TRAITS,
  tone_vibe: TONE_VIBE_TRAITS,
  emotional_output: EMOTIONAL_OUTPUT_TRAITS,
  plot_engine: PLOT_ENGINE_TRAITS,
  narrative_complexity: NARRATIVE_COMPLEXITY_TRAITS,
  setting: SETTING_TRAITS,
  cast_composition: CAST_COMPOSITION_TRAITS,
  combat_power: COMBAT_POWER_TRAITS,
  romance_config: ROMANCE_CONFIG_TRAITS,
  comedy_type: COMEDY_TYPE_TRAITS,
  content_intensity: CONTENT_INTENSITY_TRAITS,
  production_format: PRODUCTION_FORMAT_TRAITS,
};

export const TRAITS_BY_CHANNEL: Record<ScoringChannel, TraitDefinition[]> = {
  identity: ALL_TRAITS.filter(t => t.channel === 'identity'),
  vibe: ALL_TRAITS.filter(t => t.channel === 'vibe'),
  structure: ALL_TRAITS.filter(t => t.channel === 'structure'),
  intensity: ALL_TRAITS.filter(t => t.channel === 'intensity'),
};

// Total trait count
export const TOTAL_TRAIT_COUNT = ALL_TRAITS.length;
