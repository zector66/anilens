// Miruro Sync Relay — Node.js Server
// Run this on YOUR computer, both of you connect to it
//
// Setup:
//   1. Install Node.js: https://nodejs.org (LTS version)
//   2. Open terminal in this folder
//   3. Run: npx wss@latest -p 8787
//      (this auto-installs a WebSocket server)
//
// OR if you prefer no dependencies, save this file and run:
//   node sync-server-node.js
//
// Then update the userscript WS_URL to: ws://YOUR_IP:8787
// (Replace YOUR_IP with your computer's local IP, e.g., 192.168.1.42)

const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 8787;
const rooms = new Map();

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'ok',
    rooms: rooms.size,
    connections: Array.from(rooms.values()).reduce((a, b) => a + b.size, 0),
  }));
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://localhost`);
  const roomId = url.searchParams.get('room');
  
  if (!roomId) {
    ws.close();
    return;
  }
  
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  const room = rooms.get(roomId);
  room.add(ws);
  
  console.log(`[${roomId}] Client connected. Room size: ${room.size}`);
  
  ws.on('message', (data) => {
    for (const client of room) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  });
  
  ws.on('close', () => {
    room.delete(ws);
    console.log(`[${roomId}] Client disconnected. Room size: ${room.size}`);
    if (room.size === 0) {
      rooms.delete(roomId);
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n=== Miruro Sync Server running on port ${PORT} ===`);
  console.log(`\nIf running locally, update the userscript WS_URL to:`);
  console.log(`  ws://localhost:${PORT}`);
  console.log(`\nFor your girlfriend to connect from another computer, use your local IP:`);
  console.log(`  ws://YOUR_LOCAL_IP:${PORT}`);
  console.log(`  (Find your IP: Windows = ipconfig, Mac/Linux = ifconfig)`);
  console.log(`\nPress Ctrl+C to stop\n`);
});
