// Miruro Sync Relay — Cloudflare Worker
// Go to workers.cloudflare.com → Create Worker → paste this → Deploy
// Free tier includes 100,000 requests/day

const rooms = new Map();

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        },
      });
    }

    // WebSocket upgrade
    if (url.pathname === '/') {
      const roomId = url.searchParams.get('room');
      if (!roomId) {
        return new Response('Missing ?room=ROOM_ID', { status: 400 });
      }

      const upgradeHeader = request.headers.get('Upgrade');
      if (!upgradeHeader || upgradeHeader !== 'websocket') {
        return new Response('Expected websocket', { status: 400 });
      }

      const pair = new WebSocketPair();
      const client = pair.client;
      const server = pair.server;
      handleWs(server, roomId);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    // Health check
    return new Response(JSON.stringify({
      status: 'ok',
      rooms: rooms.size,
      connections: Array.from(rooms.values()).reduce((a, b) => a + b.size, 0),
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};

function handleWs(ws, roomId) {
  ws.accept();

  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  const room = rooms.get(roomId);
  room.add(ws);

  ws.addEventListener('message', (event) => {
    for (const client of room) {
      if (client !== ws && client.readyState === 1) {
        client.send(event.data);
      }
    }
  });

  ws.addEventListener('close', () => {
    room.delete(ws);
    if (room.size === 0) {
      rooms.delete(roomId);
    }
  });
}
