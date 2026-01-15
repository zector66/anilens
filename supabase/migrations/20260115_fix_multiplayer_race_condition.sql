-- Migration: Fix multiplayer race condition
-- Purpose: Create atomic RPC function for updating player state in multiplayer rooms
-- Created: 2026-01-15

-- Drop function if it exists
DROP FUNCTION IF EXISTS update_player_state_atomic(UUID, TEXT, JSONB);

-- Create atomic player state update function
CREATE OR REPLACE FUNCTION update_player_state_atomic(
    p_room_id UUID,
    p_player_id TEXT,
    p_updates JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_players JSONB;
    v_player JSONB;
    v_updated_players JSONB;
    v_found BOOLEAN := FALSE;
BEGIN
    -- Get current players array with row lock to prevent concurrent modifications
    SELECT players INTO v_players
    FROM multiplayer_rooms
    WHERE id = p_room_id
    FOR UPDATE;
    
    -- Check if room exists
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Build updated players array
    v_updated_players := '[]'::jsonb;
    
    -- Iterate through players and update the matching one
    FOR v_player IN SELECT * FROM jsonb_array_elements(v_players)
    LOOP
        IF v_player->>'id' = p_player_id THEN
            -- Merge updates into this player
            v_player := v_player || p_updates;
            v_found := TRUE;
        END IF;
        
        -- Add player to updated array
        v_updated_players := v_updated_players || jsonb_build_array(v_player);
    END LOOP;
    
    -- Only update if player was found
    IF NOT v_found THEN
        RETURN FALSE;
    END IF;
    
    -- Atomically update the players array
    UPDATE multiplayer_rooms
    SET players = v_updated_players
    WHERE id = p_room_id;
    
    RETURN TRUE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_player_state_atomic(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION update_player_state_atomic(UUID, TEXT, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION update_player_state_atomic(UUID, TEXT, JSONB) TO service_role;

-- Add comment
COMMENT ON FUNCTION update_player_state_atomic IS 'Atomically updates a single player state in a multiplayer room, preventing race conditions';
