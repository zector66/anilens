import { createClient } from '@supabase/supabase-js';

// Supabase client for realtime multiplayer
// You need to set these environment variables:
// NEXT_PUBLIC_SUPABASE_URL - Your Supabase project URL
// NEXT_PUBLIC_SUPABASE_ANON_KEY - Your Supabase anon/public key

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Room states
export type RoomState = 'waiting' | 'ready' | 'playing' | 'finished';

// Player in a room
export interface RoomPlayer {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  currentQuestion: number;
  isReady: boolean;
  answers: number[];
}

// Multiplayer room
export interface MultiplayerRoom {
  id: string;
  code: string;
  hostId: string;
  state: RoomState;
  gameType: string;
  players: RoomPlayer[];
  questions: unknown[];
  settings: {
    questionCount: number;
    difficulty: string;
    timeLimit: string;
  };
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

// Generate a random 6-character room code
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a new multiplayer room
export async function createRoom(
  hostId: string,
  hostName: string,
  hostAvatar: string | undefined,
  gameType: string,
  settings: MultiplayerRoom['settings']
): Promise<MultiplayerRoom | null> {
  if (!supabase) {
    console.error('Supabase not configured');
    return null;
  }

  const room: MultiplayerRoom = {
    id: crypto.randomUUID(),
    code: generateRoomCode(),
    hostId,
    state: 'waiting',
    gameType,
    players: [
      {
        id: hostId,
        name: hostName,
        avatar: hostAvatar,
        score: 0,
        currentQuestion: 0,
        isReady: false,
        answers: [],
      },
    ],
    questions: [],
    settings,
    createdAt: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('multiplayer_rooms')
    .insert(room);

  if (error) {
    console.error('Failed to create room:', error);
    return null;
  }

  return room;
}

// Join an existing room by code
export async function joinRoom(
  code: string,
  playerId: string,
  playerName: string,
  playerAvatar?: string
): Promise<MultiplayerRoom | null> {
  if (!supabase) return null;

  // Find the room
  const { data: room, error: findError } = await supabase
    .from('multiplayer_rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('state', 'waiting')
    .single();

  if (findError || !room) {
    console.error('Room not found:', findError);
    return null;
  }

  // Check if player already in room
  const existingPlayer = room.players.find((p: RoomPlayer) => p.id === playerId);
  if (existingPlayer) {
    return room as MultiplayerRoom;
  }

  // Add player to room
  const newPlayer: RoomPlayer = {
    id: playerId,
    name: playerName,
    avatar: playerAvatar,
    score: 0,
    currentQuestion: 0,
    isReady: false,
    answers: [],
  };

  const updatedPlayers = [...room.players, newPlayer];

  const { error: updateError } = await supabase
    .from('multiplayer_rooms')
    .update({ players: updatedPlayers })
    .eq('id', room.id);

  if (updateError) {
    console.error('Failed to join room:', updateError);
    return null;
  }

  return { ...room, players: updatedPlayers } as MultiplayerRoom;
}

// Subscribe to room changes
export function subscribeToRoom(
  roomId: string,
  onUpdate: (room: MultiplayerRoom) => void
) {
  if (!supabase) return null;

  const channel = supabase
    .channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'multiplayer_rooms',
        filter: `id=eq.${roomId}`,
      },
      (payload) => {
        if (payload.new) {
          onUpdate(payload.new as MultiplayerRoom);
        }
      }
    )
    .subscribe();

  return channel;
}

// Update room data
export async function updateRoom(
  roomId: string,
  updates: Partial<MultiplayerRoom>
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('multiplayer_rooms')
    .update(updates)
    .eq('id', roomId);

  return !error;
}

// Update player state in room
export async function updatePlayerState(
  roomId: string,
  playerId: string,
  updates: Partial<RoomPlayer>
): Promise<boolean> {
  if (!supabase) return false;

  const { data: room, error: findError } = await supabase
    .from('multiplayer_rooms')
    .select('players')
    .eq('id', roomId)
    .single();

  if (findError || !room) return false;

  const updatedPlayers = room.players.map((p: RoomPlayer) =>
    p.id === playerId ? { ...p, ...updates } : p
  );

  const { error } = await supabase
    .from('multiplayer_rooms')
    .update({ players: updatedPlayers })
    .eq('id', roomId);

  return !error;
}

// Update room state
export async function updateRoomState(
  roomId: string,
  state: RoomState,
  additionalUpdates?: Partial<MultiplayerRoom>
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('multiplayer_rooms')
    .update({ state, ...additionalUpdates })
    .eq('id', roomId);

  return !error;
}

// Leave a room
export async function leaveRoom(roomId: string, playerId: string): Promise<boolean> {
  if (!supabase) return false;

  const { data: room, error: findError } = await supabase
    .from('multiplayer_rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  if (findError || !room) return false;

  // If host leaves, delete the room
  if (room.hostId === playerId) {
    const { error } = await supabase
      .from('multiplayer_rooms')
      .delete()
      .eq('id', roomId);
    return !error;
  }

  // Otherwise, remove player from room
  const updatedPlayers = room.players.filter((p: RoomPlayer) => p.id !== playerId);

  const { error } = await supabase
    .from('multiplayer_rooms')
    .update({ players: updatedPlayers })
    .eq('id', roomId);

  return !error;
}
