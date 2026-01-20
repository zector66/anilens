import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

type EntityType = "anime" | "manga" | "character" | "openings" | "endings";

interface DailyRow {
  day: string;
  entity_type: string;
  entity_id: number;
  wins: number;
  losses: number;
  appearances: number;
  championships: number;
}

export async function GET(req: Request) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);

  const entityType = (searchParams.get("type") ?? "anime") as EntityType;
  const days = Math.min(Math.max(Number(searchParams.get("days") ?? 7), 1), 90);
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
  const minAppearances = Number(searchParams.get("min") ?? 3);

  // Validate entity type
  if (!["anime", "manga", "character", "openings", "endings"].includes(entityType)) {
    return NextResponse.json({ error: "Invalid entity type" }, { status: 400 });
  }

  try {
    const start = new Date();
    start.setDate(start.getDate() - days);
    const startDate = start.toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("bracket_entity_stats_daily")
      .select("day, entity_type, entity_id, wins, losses, appearances, championships")
      .eq("entity_type", entityType)
      .gte("day", startDate)
      .order("day", { ascending: false });

    if (error) {
      console.error("Trending fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Aggregate by entity
    const map = new Map<number, {
      entityId: number;
      wins: number;
      losses: number;
      appearances: number;
      championships: number;
      daysActive: Set<string>;
    }>();

    for (const row of (data ?? []) as DailyRow[]) {
      const id = row.entity_id;
      const prev = map.get(id) ?? {
        entityId: id,
        wins: 0,
        losses: 0,
        appearances: 0,
        championships: 0,
        daysActive: new Set<string>(),
      };
      prev.wins += row.wins ?? 0;
      prev.losses += row.losses ?? 0;
      prev.appearances += row.appearances ?? 0;
      prev.championships += row.championships ?? 0;
      prev.daysActive.add(row.day);
      map.set(id, prev);
    }

    // Filter and sort
    const items = [...map.values()]
      .filter(item => item.appearances >= minAppearances)
      .map(item => ({
        entityType,
        entityId: item.entityId,
        wins: item.wins,
        losses: item.losses,
        appearances: item.appearances,
        championships: item.championships,
        winRate: item.appearances > 0
          ? Math.round((item.wins / item.appearances) * 1000) / 10
          : 0,
        daysActive: item.daysActive.size,
      }))
      .sort((a, b) => b.wins - a.wins)
      .slice(0, limit);

    return NextResponse.json({
      items,
      meta: {
        entityType,
        days,
        minAppearances,
        count: items.length,
        startDate,
      }
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("Trending error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
