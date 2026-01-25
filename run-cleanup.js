const https = require('https');

const data = JSON.stringify({
  password: 'cleanup_mmr_2025'
});

const options = {
  hostname: 'anilens.vercel.app',
  port: 443,
  path: '/api/admin/cleanup-mmr',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
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
      console.log('=== MMR CLEANUP RESULTS ===');
      console.log(JSON.stringify(result, null, 2));
    } catch (e) {
      console.log('Raw response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.write(data);
req.end();
