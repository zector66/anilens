// Show current MMR state without ROUND function
const https = require('https');

const data = JSON.stringify({
  password: 'cleanup_mmr_2025'
});

const options = {
  hostname: 'anilens.vercel.app',
  port: 443,
  path: '/api/leaderboard?limit=20',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(responseData);
      console.log('=== CURRENT LEADERBOARD STATE ===');
      if (result.success && result.leaderboard) {
        console.log('Top 20 players current MMR:');
        result.leaderboard.forEach((player, index) => {
          const mmrPerGame = player.games_played > 0 ? (player.rating / player.games_played).toFixed(2) : 'N/A';
          console.log(`${index + 1}. ${player.username}: ${player.rating} MMR (${player.games_played} games = ${mmrPerGame} MMR/game)`);
        });
        
        // Show potentially inflated accounts
        const inflated = result.leaderboard.filter(p => p.games_played > 0 && (p.rating / p.games_played) > 50);
        console.log(`\n🚨 Found ${inflated.length} potentially inflated accounts (>50 MMR/game):`);
        inflated.forEach(player => {
          const mmrPerGame = (player.rating / player.games_played).toFixed(2);
          console.log(`- ${player.username}: ${player.rating} MMR (${player.games_played} games = ${mmrPerGame} MMR/game)`);
        });
      } else {
        console.log('Failed to fetch leaderboard:', result);
      }
    } catch (e) {
      console.log('Raw response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.end();
