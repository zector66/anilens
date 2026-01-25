// Execute EXTREME MMR fix for worst offenders
const https = require('https');

const data = JSON.stringify({});

const options = {
  hostname: 'anilens.vercel.app',
  port: 443,
  path: '/api/admin/fix-younganime',
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
      console.log('=== EXTREME MMR FIX RESULTS ===');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('\n🎯 EXTREME MMR FIX SUCCESSFUL!');
        console.log('🔥 YoungAnimeDoctor should be FIXED now!');
        console.log('🎯 Refresh the leaderboard to see the changes!');
      } else {
        console.log('\n❌ Extreme MMR fix failed:', result.error);
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

console.log('🎯 Executing EXTREME MMR fix for worst offenders...');
