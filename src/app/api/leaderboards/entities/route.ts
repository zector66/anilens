import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

type EntityType = "anime" | "manga" | "character";
type SortBy = "wins" | "championships" | "winrate";

export async function GET(req: Request) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);

  const entityType = (searchParams.get("type") ?? "anime") as EntityType;
  const minAppearances = Number(searchParams.get("min") ?? 10);
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
  const sortBy = (searchParams.get("sort") ?? "wins") as SortBy;

  // Validate entity type
  if (!["anime", "manga", "character"].includes(entityType)) {
    return NextResponse.json({ error: "Invalid entity type" }, { status: 400 });
  }

  try {
    let query = supabase
      .from("bracket_entity_stats")
      .select("entity_type, entity_id, wins_total, losses_total, appearances_total, championships_total, updated_at")
      .eq("entity_type", entityType)
      .gte("appearances_total", minAppearances);

    // Sort based on preference
    if (sortBy === "championships") {
      query = query.order("championships_total", { ascending: false });
    } else if (sortBy === "winrate") {
      // For winrate, we'll sort by wins but filter for meaningful sample size
      query = query.order("wins_total", { ascending: false });
    } else {
      query = query.order("wins_total", { ascending: false });
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error("Leaderboard fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate win rate and format response
    const items = (data ?? []).map((row) => ({
      entityType: row.entity_type,
      entityId: row.entity_id,
      wins: row.wins_total,
      losses: row.losses_total,
      appearances: row.appearances_total,
      championships: row.championships_total,
      winRate: row.appearances_total > 0 
        ? Math.round((row.wins_total / row.appearances_total) * 1000) / 10 
        : 0,
      updatedAt: row.updated_at,
    }));

    // If sorting by winrate, re-sort after calculating
    if (sortBy === "winrate") {
      items.sort((a, b) => b.winRate - a.winRate);
    }

    return NextResponse.json({ 
      items,
      meta: {
        entityType,
        minAppearances,
        sortBy,
        count: items.length,
      }
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("Leaderboard error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
