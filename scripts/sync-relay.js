// Miruro Sync Relay Server (JavaScript)
// Paste this into Deno Deploy Playground at dash.deno.com

const rooms = new Map();

function handleWs(ws, roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  const room = rooms.get(roomId);
  room.add(ws);

  ws.onmessage = (event) => {
    for (const client of room) {
      if (client !== ws && client.readyState === 1) {
        client.send(event.data);
      }
    }
  };

  ws.onclose = () => {
    room.delete(ws);
    if (room.size === 0) {
      rooms.delete(roomId);
    }
  };
}

Deno.serve((req) => {
  const url = new URL(req.url);

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
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  }

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
