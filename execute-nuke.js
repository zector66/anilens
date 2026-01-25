// Execute NUKE MMR fix
const https = require('https');

const data = JSON.stringify({});

const options = {
  hostname: 'anilens.vercel.app',
  port: 443,
  path: '/api/admin/nuke-mmr',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`💥 Status: ${res.statusCode}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(responseData);
      console.log('=== 💥 MMR NUKE RESULTS ===');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('\n💥 MMR NUKE SUCCESSFUL!');
        console.log('🔥 YoungAnimeDoctor should be FINALLY FIXED!');
        console.log('🎯 Refresh the leaderboard to see the changes!');
      } else {
        console.log('\n❌ MMR Nuke failed:', result.error);
      }
    } catch (e) {
      console.log('Raw response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.write(data);
req.end();

console.log('💥 Executing MMR NUKE...');
