// Execute AGGRESSIVE MMR fix
const https = require('https');

const data = JSON.stringify({});

const options = {
  hostname: 'anilens.vercel.app',
  port: 443,
  path: '/api/admin/aggressive-mmr-fix',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`🔥 Status: ${res.statusCode}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(responseData);
      console.log('=== AGGRESSIVE MMR FIX RESULTS ===');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('\n🔥 AGGRESSIVE MMR FIX SUCCESSFUL!');
        console.log('🎯 Refresh the leaderboard to see the changes!');
      } else {
        console.log('\n❌ Aggressive MMR fix failed:', result.error);
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

console.log('🔥 Executing AGGRESSIVE MMR fix...');
