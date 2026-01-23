/**
 * TRAIT COVERAGE AUDIT SCRIPT
 * 
 * Run with: npx ts-node scripts/audit-trait-coverage.ts
 * 
 * Reports:
 * 1. Unmapped tags (tags from AniList not in our mappings)
 * 2. Dead traits (traits that never receive contributions)
 * 3. Low-weight tags (mapped but only with weight 1 traces)
 * 4. Tags mapped to 0 traits (potential bugs)
 */

import { ALL_TAG_DEFINITIONS, TAG_MAP } from '../src/lib/tag-mappings';
import { ALL_TRAITS, TRAIT_BY_ID } from '../src/lib/trait-universe';

// Known AniList tags (from fetch-anilist-tags.js output)
// This should be populated from the actual AniList API
const ANILIST_TAGS = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 'Horror',
  'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance',
  'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller',
  'Gore', 'Blood', 'Violence', 'Nudity', 'Sexual Content', 'Drugs',
  'Isekai', 'Time Travel', 'Time Loop', 'Reincarnation', 'Memory Manipulation',
  'Love Triangle', 'Harem', 'Reverse Harem', 'Age Gap', 'Childhood Friends',
  'School', 'College', 'Work', 'Military', 'Police', 'Crime', 'Survival',
  'Post-Apocalyptic', 'Dystopia', 'Cyberpunk', 'Steampunk', 'Space',
  'Historical', 'Samurai', 'Martial Arts', 'Swordplay', 'Guns',
  'Magic', 'Super Power', 'Vampire', 'Werewolf', 'Zombie', 'Demon',
  'Angel', 'Ghost', 'Youkai', 'Monster', 'Dragon', 'Gods',
  'Tournament', 'Training', 'Revenge', 'War', 'Politics', 'Conspiracy',
  'Detective', 'Investigation', 'Heist', 'Death Game', 'Battle Royale',
  'Parody', 'Satire', 'Slapstick', 'Dark Comedy', 'Romantic Comedy',
  'Coming of Age', 'Family Life', 'Slice of Life', 'Cooking', 'Music',
  'Idol', 'Band', 'Acting', 'Art', 'Photography', 'Writing',
  'Sports', 'Football', 'Basketball', 'Baseball', 'Tennis', 'Swimming',
  'Cute Girls Doing Cute Things', 'Cute Boys Doing Cute Things',
  'Boys\' Love', 'Girls\' Love', 'Shounen', 'Shoujo', 'Seinen', 'Josei',
  'Anthology', 'Episodic', 'Non-linear', 'Multiple Timelines', 'Flashback',
  'Unreliable Narrator', 'Fourth Wall', 'Meta', 'Deconstruction',
  'Tragedy', 'Melancholy', 'Bittersweet', 'Uplifting', 'Healing',
  'Suspense', 'Paranoia', 'Isolation', 'Abuse', 'Bullying', 'Suicide',
  'Body Horror', 'Cosmic Horror', 'Psychological Horror', 'Splatter',
  'Fanservice', 'Ecchi', 'Hentai', 'Yuri', 'Yaoi',
  // Add more as needed from anilist-tags-output.json
];

interface AuditResult {
  unmappedTags: string[];
  deadTraits: string[];
  lowWeightTags: { tag: string; maxWeight: number }[];
  zeroTraitTags: string[];
  traitCoverage: { traitId: string; tagCount: number }[];
  summary: {
    totalAniListTags: number;
    mappedTags: number;
    unmappedTags: number;
    totalTraits: number;
    activeTraits: number;
    deadTraits: number;
    coveragePercent: number;
  };
}

function auditCoverage(): AuditResult {
  const result: AuditResult = {
    unmappedTags: [],
    deadTraits: [],
    lowWeightTags: [],
    zeroTraitTags: [],
    traitCoverage: [],
    summary: {
      totalAniListTags: 0,
      mappedTags: 0,
      unmappedTags: 0,
      totalTraits: 0,
      activeTraits: 0,
      deadTraits: 0,
      coveragePercent: 0,
    },
  };

  // 1. Find unmapped tags
  const mappedTagNames = new Set(ALL_TAG_DEFINITIONS.map(t => t.tagName.toLowerCase()));
  for (const tag of ANILIST_TAGS) {
    if (!mappedTagNames.has(tag.toLowerCase())) {
      result.unmappedTags.push(tag);
    }
  }

  // 2. Count trait contributions from mappings
  const traitContributionCount = new Map<string, number>();
  for (const trait of ALL_TRAITS) {
    traitContributionCount.set(trait.id, 0);
  }

  for (const tagDef of ALL_TAG_DEFINITIONS) {
    for (const mapping of tagDef.mappings) {
      const current = traitContributionCount.get(mapping.traitId) || 0;
      traitContributionCount.set(mapping.traitId, current + 1);
    }
  }

  // 3. Find dead traits (never mapped to)
  for (const [traitId, count] of Array.from(traitContributionCount.entries())) {
    if (count === 0) {
      result.deadTraits.push(traitId);
    }
    result.traitCoverage.push({ traitId, tagCount: count });
  }

  // 4. Find low-weight tags (only weight 1 traces)
  for (const tagDef of ALL_TAG_DEFINITIONS) {
    const maxWeight = Math.max(...tagDef.mappings.map(m => m.weight));
    if (maxWeight === 1) {
      result.lowWeightTags.push({ tag: tagDef.tagName, maxWeight });
    }
    if (tagDef.mappings.length === 0) {
      result.zeroTraitTags.push(tagDef.tagName);
    }
  }

  // Sort trait coverage by count ascending (least covered first)
  result.traitCoverage.sort((a, b) => a.tagCount - b.tagCount);

  // Calculate summary
  result.summary = {
    totalAniListTags: ANILIST_TAGS.length,
    mappedTags: ALL_TAG_DEFINITIONS.length,
    unmappedTags: result.unmappedTags.length,
    totalTraits: ALL_TRAITS.length,
    activeTraits: ALL_TRAITS.length - result.deadTraits.length,
    deadTraits: result.deadTraits.length,
    coveragePercent: Math.round((ALL_TAG_DEFINITIONS.length / ANILIST_TAGS.length) * 100),
  };

  return result;
}

function printReport(result: AuditResult): void {
  console.log('\n========================================');
  console.log('   TRAIT COVERAGE AUDIT REPORT');
  console.log('========================================\n');

  console.log('📊 SUMMARY');
  console.log('----------------------------------------');
  console.log(`Total AniList Tags:    ${result.summary.totalAniListTags}`);
  console.log(`Mapped Tags:           ${result.summary.mappedTags}`);
  console.log(`Unmapped Tags:         ${result.summary.unmappedTags}`);
  console.log(`Tag Coverage:          ${result.summary.coveragePercent}%`);
  console.log('');
  console.log(`Total Traits:          ${result.summary.totalTraits}`);
  console.log(`Active Traits:         ${result.summary.activeTraits}`);
  console.log(`Dead Traits:           ${result.summary.deadTraits}`);
  console.log('');

  if (result.unmappedTags.length > 0) {
    console.log('\n❌ UNMAPPED TAGS (need mappings)');
    console.log('----------------------------------------');
    result.unmappedTags.slice(0, 20).forEach(tag => console.log(`  - ${tag}`));
    if (result.unmappedTags.length > 20) {
      console.log(`  ... and ${result.unmappedTags.length - 20} more`);
    }
  }

  if (result.deadTraits.length > 0) {
    console.log('\n⚠️  DEAD TRAITS (never receive contributions)');
    console.log('----------------------------------------');
    result.deadTraits.forEach(trait => console.log(`  - ${trait}`));
  }

  if (result.lowWeightTags.length > 0) {
    console.log('\n🔍 LOW WEIGHT TAGS (only weight 1 traces)');
    console.log('----------------------------------------');
    result.lowWeightTags.slice(0, 10).forEach(({ tag }) => console.log(`  - ${tag}`));
    if (result.lowWeightTags.length > 10) {
      console.log(`  ... and ${result.lowWeightTags.length - 10} more`);
    }
  }

  if (result.zeroTraitTags.length > 0) {
    console.log('\n🐛 ZERO TRAIT TAGS (mapped but no traits - BUG!)');
    console.log('----------------------------------------');
    result.zeroTraitTags.forEach(tag => console.log(`  - ${tag}`));
  }

  console.log('\n📈 LEAST COVERED TRAITS (need more tag mappings)');
  console.log('----------------------------------------');
  result.traitCoverage.slice(0, 15).forEach(({ traitId, tagCount }) => {
    const trait = TRAIT_BY_ID.get(traitId);
    console.log(`  ${tagCount.toString().padStart(2)} tags → ${trait?.name || traitId}`);
  });

  console.log('\n========================================\n');
}

// Run audit
const result = auditCoverage();
printReport(result);

export { auditCoverage, AuditResult };
