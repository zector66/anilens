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

// Helper to convert snake_case DB row to camelCase app model
function dbRowToRoom(row: Record<string, unknown>): MultiplayerRoom | null {
  // Defensive check - realtime payloads may be incomplete
  if (!row || !row.id || !row.players) {
    console.warn('Invalid room data received:', row);
    return null;
  }
  
  return {
    id: row.id as string,
    code: row.code as string,
    hostId: row.host_id as string,
    state: row.state as RoomState,
    gameType: row.game_type as string,
    players: (row.players as RoomPlayer[]) || [],
    questions: (row.questions as unknown[]) || [],
    settings: row.settings as MultiplayerRoom['settings'],
    createdAt: row.created_at as string,
    startedAt: row.started_at as string | undefined,
    finishedAt: row.finished_at as string | undefined,
  };
}

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

  const roomId = crypto.randomUUID();
  const roomCode = generateRoomCode();
  const createdAt = new Date().toISOString();
  
  const players: RoomPlayer[] = [
    {
      id: hostId,
      name: hostName,
      avatar: hostAvatar,
      score: 0,
      currentQuestion: 0,
      isReady: false,
      answers: [],
    },
  ];

  // Insert with snake_case column names for Supabase
  const { error } = await supabase
    .from('multiplayer_rooms')
    .insert({
      id: roomId,
      code: roomCode,
      host_id: hostId,
      state: 'waiting',
      game_type: gameType,
      players: players,
      questions: [],
      settings: settings,
      created_at: createdAt,
    });
  
  // Return camelCase for the app
  const room: MultiplayerRoom = {
    id: roomId,
    code: roomCode,
    hostId,
    state: 'waiting',
    gameType,
    players,
    questions: [],
    settings,
    createdAt,
  };

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
  const { data: dbRoom, error: findError } = await supabase
    .from('multiplayer_rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('state', 'waiting')
    .single();

  if (findError || !dbRoom) {
    console.error('Room not found:', findError);
    return null;
  }

  const room = dbRowToRoom(dbRoom);
  if (!room) return null;

  // Check if player already in room
  const existingPlayer = room.players.find((p: RoomPlayer) => p.id === playerId);
  if (existingPlayer) {
    return room;
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

  return { ...room, players: updatedPlayers };
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
          const room = dbRowToRoom(payload.new as Record<string, unknown>);
          if (room) onUpdate(room);
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

  // Convert camelCase to snake_case for DB
  const dbUpdates: Record<string, unknown> = { state };
  if (additionalUpdates) {
    if (additionalUpdates.startedAt) dbUpdates.started_at = additionalUpdates.startedAt;
    if (additionalUpdates.finishedAt) dbUpdates.finished_at = additionalUpdates.finishedAt;
    if (additionalUpdates.questions) dbUpdates.questions = additionalUpdates.questions;
    if (additionalUpdates.players) dbUpdates.players = additionalUpdates.players;
  }

  const { error } = await supabase
    .from('multiplayer_rooms')
    .update(dbUpdates)
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

  const mappedRoom = dbRowToRoom(room);
  if (!mappedRoom) return false;

  // If host leaves, delete the room
  if (mappedRoom.hostId === playerId) {
    const { error } = await supabase
      .from('multiplayer_rooms')
      .delete()
      .eq('id', roomId);
    return !error;
  }

  // Otherwise, remove player from room
  const updatedPlayers = mappedRoom.players.filter((p: RoomPlayer) => p.id !== playerId);

  const { error } = await supabase
    .from('multiplayer_rooms')
    .update({ players: updatedPlayers })
    .eq('id', roomId);

  return !error;
}
