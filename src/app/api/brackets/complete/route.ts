import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

type BracketMatch = {
  entityType: "anime" | "manga" | "character";
  winnerId: number;
  loserId: number;
};

interface RequestBody {
  runId: string;
  bracketType: "anime" | "manga" | "character";
  bracketSize: number;
  matches: BracketMatch[];
  championId?: number;
  userId?: number;
}

export async function POST(req: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = (await req.json()) as RequestBody;

    // Validation
    if (!body.runId || !body.bracketType || !body.bracketSize || !body.matches?.length) {
      return NextResponse.json(
        { error: "Missing required fields: runId, bracketType, bracketSize, matches" },
        { status: 400 }
      );
    }

    // Enforce minimum bracket size (reduced to 8 for testing)
    if (body.bracketSize < 8) {
      return NextResponse.json(
        { error: "Bracket size must be at least 8" },
        { status: 400 }
      );
    }

    // Validate bracket type
    if (!["anime", "manga", "character"].includes(body.bracketType)) {
      return NextResponse.json(
        { error: "Invalid bracket type. Must be anime, manga, or character" },
        { status: 400 }
      );
    }

    // Convert to the Postgres composite type array
    const pgResults = body.matches.map((m) => ({
      entity_type: m.entityType,
      winner_id: m.winnerId,
      loser_id: m.loserId,
    }));

    const { data, error } = await supabaseAdmin.rpc("process_bracket_results", {
      p_run_id: body.runId,
      p_bracket_type: body.bracketType,
      p_bracket_size: body.bracketSize,
      p_results: pgResults,
      p_champion_id: body.championId ?? null,
      p_user_id: body.userId ?? null,
    });

    if (error) {
      console.error("Bracket processing error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      ...data 
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("Bracket complete error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
