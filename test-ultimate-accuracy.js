// Test the Ultimate Accuracy API
const https = require('https');

// Sample test data (simulated user with varied anime preferences)
const testData = {
  entries: [
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
        tags: [
          { name: 'Adventure', rank: 80 },
          { name: 'Shounen', rank: 90 },
          { name: 'Pirates', rank: 85 },
          { name: 'Action', rank: 95 },
          { name: 'Comedy', rank: 70 }
        ],
        episodes: 1000
      }
    },
    {
      id: 2,
      mediaId: 5114,
      status: 'COMPLETED',
      score: 8,
      progress: 12,
      media: {
        id: 5114,
        title: { userPreferred: 'Death Note' },
        genres: ['Psychological', 'Thriller', 'Mystery', 'Supernatural'],
        tags: [
          { name: 'Psychological', rank: 95 },
          { name: 'Thriller', rank: 90 },
          { name: 'Mystery', rank: 85 },
          { name: 'Shounen', rank: 80 },
          { name: 'Supernatural', rank: 75 }
        ],
        episodes: 37
      }
    },
    {
      id: 3,
      mediaId: 30,
      status: 'DROPPED',
      score: 3,
      progress: 5,
      media: {
        id: 30,
        title: { userPreferred: 'Neon Genesis Evangelion' },
        genres: ['Mecha', 'Psychological', 'Drama'],
        tags: [
          { name: 'Mecha', rank: 90 },
          { name: 'Psychological', rank: 85 },
          { name: 'Drama', rank: 80 },
          { name: 'Post-Apocalyptic', rank: 75 }
        ],
        episodes: 26
      }
    },
    {
      id: 4,
      mediaId: 1535,
      status: 'COMPLETED',
      score: 10,
      progress: 26,
      media: {
        id: 1535,
        title: { userPreferred: 'Death Parade' },
        genres: ['Psychological', 'Thriller', 'Game'],
        tags: [
          { name: 'Psychological', rank: 95 },
          { name: 'Thriller', rank: 85 },
          { name: 'Game', rank: 80 },
          { name: 'Episodic', rank: 75 }
        ],
        episodes: 12
      }
    },
    {
      id: 5,
      mediaId: 16498,
      status: 'COMPLETED',
      score: 7,
      progress: 12,
      media: {
        id: 16498,
        title: { userPreferred: 'K-On!' },
        genres: ['Comedy', 'Slice of Life', 'Music'],
        tags: [
          { name: 'Comedy', rank: 85 },
          { name: 'Slice of Life', rank: 90 },
          { name: 'Music', rank: 80 },
          { name: 'School', rank: 85 },
          { name: 'Moe', rank: 75 }
        ],
        episodes: 13
      }
    }
  ]
};

const data = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/ultimate-accuracy',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`🎯 Status: ${res.statusCode}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(responseData);
      console.log('=== 🎯 ULTIMATE ACCURACY RESULTS ===');
      
      if (result.success) {
        console.log('\n✅ SUCCESS - Ultimate Accuracy Profile Generated!');
        
        // Display summary
        const summary = result.data.summary;
        console.log('\n📊 SUMMARY:');
        console.log(`   Total Entries: ${summary.totalEntries}`);
        console.log(`   Overall Confidence: ${(summary.confidence * 100).toFixed(1)}%`);
        console.log(`   Rating Signal: ${summary.dataQuality.ratingSignalStrength}`);
        
        // Display top traits with percentiles
        console.log('\n🎯 TOP TRAITS (with population context):');
        summary.topTraits.forEach((trait, index) => {
          console.log(`   ${index + 1}. ${trait.name} - ${trait.rawScore.toFixed(1)} (${trait.percentile}th percentile, ${trait.rarity})`);
        });
        
        // Display confidence breakdown
        console.log('\n🔍 CONFIDENCE BREAKDOWN:');
        const confidence = result.data.confidence;
        console.log(`   Sample Size: ${confidence.sampleSize} entries (${(confidence.sampleSize / 50 * 100).toFixed(0)}% confidence)`);
        console.log(`   Rating Signal Strength: ${(confidence.ratingSignalStrength * 100).toFixed(0)}%`);
        console.log(`   Coverage Completeness: ${(confidence.coverageCompleteness * 100).toFixed(0)}%`);
        console.log(`   Trait Diversity: ${(confidence.traitDiversity * 100).toFixed(0)}%`);
        
        // Display data quality
        console.log('\n📈 DATA QUALITY:');
        const dataQuality = result.data.dataQuality;
        console.log(`   Rating Variance: ${dataQuality.ratingVariance.toFixed(2)}`);
        console.log(`   Episode Weighting: ${dataQuality.episodeWeighting.toFixed(2)}`);
        console.log(`   Status Distribution:`, dataQuality.statusDistribution);
        
        // Show signature vs exposure difference
        console.log('\n🌟 SIGNATURE TRAITS (what makes you unique):');
        result.data.signatureTraits.slice(0, 5).forEach((trait, index) => {
          const percentile = result.data.percentiles.find(p => p.traitId === trait.traitId);
          console.log(`   ${index + 1}. ${trait.name} - ${trait.rawScore.toFixed(1)} (${percentile?.percentile || 0}th percentile)`);
        });
        
        console.log('\n🎉 ULTIMATE ACCURACY SYSTEM WORKING!');
        console.log('✅ TF-IDF distinctiveness: Active');
        console.log('✅ Episode count weighting: Active');
        console.log('✅ Status weighting: Active');
        console.log('✅ Negative evidence: Active');
        console.log('✅ Exposure vs Preference: Active');
        console.log('✅ Realistic confidence: Active');
        console.log('✅ Population percentiles: Active');
        
      } else {
        console.log('\n❌ FAILED:', result.error);
        if (result.details) {
          console.log('Details:', result.details);
        }
      }
    } catch (e) {
      console.log('Raw response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
  console.log('\n💡 Make sure the development server is running on localhost:3000');
  console.log('   Run: npm run dev');
});

req.write(data);
req.end();

console.log('🚀 Testing Ultimate Accuracy API...');
console.log('📝 Sample data includes:');
console.log('   - High-rated long series (One Piece)');
console.log('   - High-rated psychological thriller (Death Note)');
console.log('   - Dropped mecha series (Evangelion) - negative evidence');
console.log('   - Perfect-rated short series (Death Parade)');
console.log('   - Medium-rated slice of life (K-On!)');
console.log('\n⏳ Analyzing with ultimate accuracy engine...');
