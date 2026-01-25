/**
 * TEST SCRIPT FOR ULTIMATE ACCURACY V2
 * 
 * Tests the fixes for "Gintama everywhere" problem:
 * ✅ Per-title spread normalization
 * ✅ Centered preference weighting  
 * ✅ Core vs Modifier caps
 * ✅ Enhanced debug tracing
 * ✅ Exposure vs Preference split
 */

const http = require('http');

// Sample data that would trigger "Gintama everywhere" problem
const sampleData = [
  {
    id: 1,
    mediaId: 21,
    status: 'COMPLETED',
    score: 9,
    progress: 24,
    media: {
      id: 21,
      title: { userPreferred: 'One Piece' },
      genres: ['Action', 'Adventure', 'Comedy', 'Drama'],
      episodes: 1000,
      tags: [
        { name: 'Adventure', rank: 80 },
        { name: 'Shounen', rank: 90 },
        { name: 'Pirates', rank: 85 },
        { name: 'Action', rank: 95 },
        { name: 'Comedy', rank: 70 },
        { name: 'Long-running', rank: 85 },
        { name: 'Friendship', rank: 80 },
        { name: 'Power System', rank: 75 }
      ]
    }
  },
  {
    id: 2,
    mediaId: 9777,
    status: 'COMPLETED',
    score: 7, // Medium rating - should not dominate
    progress: 201,
    media: {
      id: 9777,
      title: { userPreferred: 'Gintama' },
      genres: ['Action', 'Comedy', 'Parody', 'Sci-Fi'],
      episodes: 201,
      tags: [
        // This is the "tag explosion" that causes the problem
        { name: 'Comedy', rank: 95 },
        { name: 'Parody', rank: 90 },
        { name: 'Satire', rank: 85 },
        { name: 'Absurd', rank: 80 },
        { name: 'Ensemble Cast', rank: 85 },
        { name: 'Action', rank: 75 },
        { name: 'Emotional Whiplash', rank: 70 },
        { name: 'Tragedy Arcs', rank: 65 },
        { name: 'Meta Humor', rank: 90 },
        { name: 'Breaking Fourth Wall', rank: 85 },
        { name: 'Slice of Life', rank: 80 },
        { name: 'Shounen', rank: 70 },
        { name: 'Training Arcs', rank: 60 },
        { name: 'Character Development', rank: 75 },
        { name: 'Episodic', rank: 85 },
        { name: 'Gag Humor', rank: 88 },
        { name: 'Reference Humor', rank: 82 },
        { name: 'Samurai', rank: 70 },
        { name: 'Aliens', rank: 65 },
        { name: 'Time Travel', rank: 55 },
        { name: 'Alternate Universe', rank: 60 }
        // 20+ tags! This should trigger the spread normalization
      ]
    }
  },
  {
    id: 3,
    mediaId: 5114,
    status: 'COMPLETED',
    score: 10, // High rating - should be top contributor
    progress: 37,
    media: {
      id: 5114,
      title: { userPreferred: 'Death Note' },
      genres: ['Psychological', 'Thriller', 'Mystery'],
      episodes: 37,
      tags: [
        { name: 'Psychological', rank: 95 },
        { name: 'Thriller', rank: 90 },
        { name: 'Mystery', rank: 85 },
        { name: 'Shounen', rank: 80 },
        { name: 'Supernatural', rank: 75 },
        { name: 'Detective', rank: 85 },
        { name: 'Morally Ambiguous', rank: 90 }
        // Focused tags - should benefit from spread normalization
      ]
    }
  },
  {
    id: 4,
    mediaId: 30,
    status: 'DROPPED',
    score: 3, // Low rating - should have reduced influence
    progress: 5,
    media: {
      id: 30,
      title: { userPreferred: 'Neon Genesis Evangelion' },
      genres: ['Mecha', 'Psychological', 'Drama'],
      episodes: 26,
      tags: [
        { name: 'Mecha', rank: 90 },
        { name: 'Psychological', rank: 85 },
        { name: 'Drama', rank: 80 },
        { name: 'Post-Apocalyptic', rank: 75 },
        { name: 'Existential', rank: 88 }
      ]
    }
  },
  {
    id: 5,
    mediaId: 1535,
    status: 'COMPLETED',
    score: 8,
    progress: 12,
    media: {
      id: 1535,
      title: { userPreferred: 'Death Parade' },
      genres: ['Psychological', 'Thriller', 'Game'],
      episodes: 12,
      tags: [
        { name: 'Psychological', rank: 95 },
        { name: 'Thriller', rank: 85 },
        { name: 'Game', rank: 80 },
        { name: 'Episodic', rank: 75 },
        { name: 'Afterlife', rank: 90 },
        { name: 'Moral Dilemma', rank: 85 }
      ]
    }
  }
];

function makeRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/ultimate-accuracy-v2',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function runTest() {
  console.log('🎯 TESTING ULTIMATE ACCURACY V2');
  console.log('=====================================');
  console.log('Testing fixes for "Gintama everywhere" problem...\n');

  try {
    console.log('📤 Sending test data...');
    console.log(`   - ${sampleData.length} entries`);
    console.log(`   - Gintama: ${sampleData[1].media.tags.length} tags (tag explosion!)`);
    console.log(`   - Death Note: ${sampleData[2].media.tags.length} tags (focused)`);
    console.log(`   - Rating spread: ${sampleData.map(e => e.score).join(', ')}\n`);

    const result = await makeRequest({ entries: sampleData });

    if (!result.success) {
      console.error('❌ API call failed:', result.error);
      process.exit(1);
    }

    console.log('✅ SUCCESS! Ultimate Accuracy V2 Results:\n');

    // Overall metrics
    const profile = result.data;
    console.log('📊 OVERALL METRICS:');
    console.log(`   Overall Confidence: ${Math.round(profile.confidence.overall * 100)}%`);
    console.log(`   Sample Size: ${profile.confidence.sampleSize}`);
    console.log(`   Rating Signal Strength: ${Math.round(profile.confidence.ratingSignalStrength * 100)}%`);
    console.log(`   Coverage Completeness: ${Math.round(profile.confidence.coverageCompleteness * 100)}%`);
    console.log(`   Trait Diversity: ${Math.round(profile.confidence.traitDiversity * 100)}%\n`);

    // Data quality
    console.log('🔍 DATA QUALITY:');
    console.log(`   Rating Variance: ${profile.dataQuality.ratingVariance.toFixed(2)}`);
    console.log(`   Episode Weighting: ${profile.dataQuality.episodeWeighting.toFixed(2)}`);
    console.log(`   Tag Density: ${profile.dataQuality.tagDensity.toFixed(1)} tags/show`);
    console.log(`   Trait Spread: ${profile.dataQuality.traitSpread.toFixed(1)} traits/title\n`);

    // Signature traits
    console.log('🌟 SIGNATURE TRAITS (Top 5):');
    profile.signatureTraits.slice(0, 5).forEach((trait, i) => {
      console.log(`   ${i + 1}. ${trait.name}: ${trait.normalizedScore} (signature: ${Math.round(trait.signatureScore || 0)})`);
    });
    console.log('');

    // Check for problematic titles
    const warnings = result.warnings;
    console.log('⚠️  PROBLEMATIC TITLES DETECTED:');
    if (warnings.problematicTitles === 0) {
      console.log('   ✅ No problematic titles found! The fixes are working.');
    } else {
      console.log(`   ❌ Found ${warnings.problematicTitles} problematic titles:`);
      warnings.titles.forEach(({title, traitCount}) => {
        console.log(`      - ${title}: contributing to ${traitCount} traits`);
      });
    }
    console.log('');

    // Compare Exposure vs Preference profiles
    console.log('🔄 EXPOSURE vs PREFERENCE COMPARISON:');
    const exposureTop = profile.exposureProfile.topTraits.slice(0, 3);
    const preferenceTop = profile.preferenceProfile.topTraits.slice(0, 3);
    
    console.log('   Exposure Top 3 (what you watched):');
    exposureTop.forEach((trait, i) => {
      console.log(`     ${i + 1}. ${trait.name}: ${trait.normalizedScore}`);
    });
    
    console.log('   Preference Top 3 (what you love):');
    preferenceTop.forEach((trait, i) => {
      console.log(`     ${i + 1}. ${trait.name}: ${trait.normalizedScore}`);
    });
    console.log('');

    // Check if Gintama is dominating (the main test)
    console.log('🎯 "GINTAMA EVERYWHERE" TEST:');
    const gintamaContributions = [];
    
    profile.exposureProfile.topTraits.forEach(trait => {
      const contributors = trait.topContributors || [];
      const gintamaContrib = contributors.find(c => c.mediaId === 9777);
      if (gintamaContrib) {
        gintamaContributions.push({
          trait: trait.name,
          contribution: gintamaContrib.rawContribution,
          share: gintamaContrib.shareOfTrait
        });
      }
    });
    
    if (gintamaContributions.length > 10) {
      console.log(`   ❌ Gintama still contributing to ${gintamaContributions.length} traits`);
      console.log('   Top contributions:');
      gintamaContributions
        .sort((a, b) => b.contribution - a.contribution)
        .slice(0, 5)
        .forEach(({trait, contribution, share}) => {
          console.log(`     - ${trait}: ${contribution.toFixed(2)} (${Math.round((share || 0) * 100)}%)`);
        });
    } else {
      console.log(`   ✅ SUCCESS! Gintama only contributing to ${gintamaContributions.length} traits`);
      console.log('   The spread normalization fix is working!');
    }
    console.log('');

    // Show V2 improvements
    console.log('🚀 V2 IMPROVEMENTS APPLIED:');
    result.meta.fixes.forEach((fix, i) => {
      console.log(`   ${i + 1}. ✅ ${fix}`);
    });
    console.log('');

    console.log('🎉 TEST COMPLETE! The V2 system should solve the "Gintama everywhere" problem.');

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    console.log('\n💡 Make sure the development server is running on localhost:3000');
    console.log('   Run: npm run dev');
    process.exit(1);
  }
}

// Run the test
runTest();
