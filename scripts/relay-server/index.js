const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 8787;
const rooms = new Map();

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

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
  const url = new URL(req.url, 'http://localhost');
  const roomId = url.searchParams.get('room');

  if (!roomId) {
    ws.close(1008, 'Missing room ID');
    return;
  }

  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  const room = rooms.get(roomId);
  room.add(ws);

  console.log(`[${roomId}] Client joined. Room size: ${room.size}`);

  ws.on('message', (data) => {
    const msg = data.toString();
    for (const client of room) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    }
  });

  ws.on('close', () => {
    room.delete(ws);
    console.log(`[${roomId}] Client left. Room size: ${room.size}`);
    if (room.size === 0) {
      rooms.delete(roomId);
    }
  });

  ws.on('error', (err) => {
    console.error(`[${roomId}] WebSocket error:`, err.message);
  });
});

server.listen(PORT, () => {
  console.log(`Miruro Sync Relay running on port ${PORT}`);
});
