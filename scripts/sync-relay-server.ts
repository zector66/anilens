// ============================================
// Miruro Sync Relay Server
// Deploy to Deno Deploy: paste this into the playground at dash.deno.com
// Local: deno run --allow-net sync-relay-server.ts
// ============================================
// IMPORTANT: Deno Deploy Playground expects a top-level Deno.serve() call.
// Just paste everything below into the playground and hit Deploy.

// Simple in-memory room store (resets on server restart)
const rooms = new Map<string, Set<WebSocket>>();

function handleWs(ws: WebSocket, roomId: string) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  const room = rooms.get(roomId)!;
  room.add(ws);

  console.log(`[${roomId}] Client connected. Total: ${room.size}`);

  ws.onmessage = (event) => {
    // Broadcast to all OTHER clients in the same room
    for (const client of room) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(event.data);
      }
    }
  };

  ws.onclose = () => {
    room.delete(ws);
    console.log(`[${roomId}] Client disconnected. Total: ${room.size}`);
    if (room.size === 0) {
      rooms.delete(roomId);
    }
  };
}

// Deno Deploy entrypoint
Deno.serve((req) => {
  const url = new URL(req.url);

  // CORS preflight
  if (req.method === 'OPTIONS') {
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

    if (req.headers.get('upgrade') !== 'websocket') {
      return new Response('Expected websocket', { status: 400 });
    }

    const { socket, response } = Deno.upgradeWebSocket(req);
    handleWs(socket, roomId);

    // Add CORS headers to the upgrade response
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
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
});

