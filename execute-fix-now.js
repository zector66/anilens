// Execute MMR fix RIGHT NOW
const https = require('https');

const data = JSON.stringify({});

const options = {
  hostname: 'anilens.vercel.app',
  port: 443,
  path: '/api/admin/fix-mmr-direct',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`🚀 Status: ${res.statusCode}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(responseData);
      console.log('=== MMR FIX EXECUTION RESULTS ===');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('\n✅ MMR FIX SUCCESSFUL!');
        console.log('🎯 Refresh the leaderboard to see the changes!');
      } else {
        console.log('\n❌ MMR fix failed:', result.error);
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

console.log('🔧 Executing MMR fix...');
