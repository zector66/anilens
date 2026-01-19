-- ============================================
-- BRACKET STATISTICS SYSTEM
-- Tracks wins/losses/appearances for entities
-- ============================================

-- A) Table: bracket_runs (prevents double counting)
create table if not exists public.bracket_runs (
  id uuid primary key,
  bracket_type text not null,        -- 'anime' | 'manga' | 'character'
  bracket_size int not null,         -- 16/32/64/128
  user_id int,                       -- optional: AniList user who ran the bracket
  created_at timestamptz default now(),
  processed_at timestamptz
);

create index if not exists bracket_runs_processed_idx
on public.bracket_runs (processed_at);

create index if not exists bracket_runs_user_idx
on public.bracket_runs (user_id);

-- B) Table: bracket_entity_stats (the "hall of fame" stats)
create table if not exists public.bracket_entity_stats (
  entity_type text not null,       -- 'anime' | 'manga' | 'character'
  entity_id int not null,          -- AniList mediaId or characterId
  wins_total int not null default 0,
  losses_total int not null default 0,
  appearances_total int not null default 0,
  championships_total int not null default 0,  -- times won the full bracket
  last_seen_at timestamptz,
  updated_at timestamptz default now(),
  primary key (entity_type, entity_id)
);

create index if not exists bracket_entity_stats_wins_idx
on public.bracket_entity_stats (entity_type, wins_total desc);

create index if not exists bracket_entity_stats_championships_idx
on public.bracket_entity_stats (entity_type, championships_total desc);

create index if not exists bracket_entity_stats_updated_idx
on public.bracket_entity_stats (updated_at desc);

-- C) Table: bracket_entity_stats_daily (for trending)
create table if not exists public.bracket_entity_stats_daily (
  day date not null,
  entity_type text not null,
  entity_id int not null,
  wins int not null default 0,
  losses int not null default 0,
  appearances int not null default 0,
  championships int not null default 0,
  updated_at timestamptz default now(),
  primary key (day, entity_type, entity_id)
);

create index if not exists bracket_entity_daily_day_idx
on public.bracket_entity_stats_daily (day desc, entity_type);

-- D) Create a type for match results
do $$ begin
  create type public.bracket_match_result as (
    entity_type text,
    winner_id int,
    loser_id int
  );
exception
  when duplicate_object then null;
end $$;

-- E) Create the processing function (atomic updates)
create or replace function public.process_bracket_results(
  p_run_id uuid,
  p_bracket_type text,
  p_bracket_size int,
  p_results public.bracket_match_result[],
  p_champion_id int default null,
  p_user_id int default null
)
returns jsonb
language plpgsql
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
  r public.bracket_match_result;
  v_already_processed boolean := false;
begin
  -- 1) Insert run if missing
  insert into public.bracket_runs (id, bracket_type, bracket_size, user_id)
  values (p_run_id, p_bracket_type, p_bracket_size, p_user_id)
  on conflict (id) do nothing;

  -- 2) Check if already processed
  select (processed_at is not null) into v_already_processed
  from public.bracket_runs where id = p_run_id;

  if v_already_processed then
    return jsonb_build_object('success', true, 'already_processed', true);
  end if;

  -- 3) Mark processed (lock by updating row)
  update public.bracket_runs
  set processed_at = now()
  where id = p_run_id;

  -- 4) Apply each match to global and daily aggregates
  foreach r in array p_results loop
    -- Winner: wins + appearance
    insert into public.bracket_entity_stats(entity_type, entity_id, wins_total, losses_total, appearances_total, last_seen_at)
    values (r.entity_type, r.winner_id, 1, 0, 1, now())
    on conflict (entity_type, entity_id) do update
      set wins_total = public.bracket_entity_stats.wins_total + 1,
          appearances_total = public.bracket_entity_stats.appearances_total + 1,
          last_seen_at = now(),
          updated_at = now();

    -- Loser: losses + appearance
    insert into public.bracket_entity_stats(entity_type, entity_id, wins_total, losses_total, appearances_total, last_seen_at)
    values (r.entity_type, r.loser_id, 0, 1, 1, now())
    on conflict (entity_type, entity_id) do update
      set losses_total = public.bracket_entity_stats.losses_total + 1,
          appearances_total = public.bracket_entity_stats.appearances_total + 1,
          last_seen_at = now(),
          updated_at = now();

    -- Daily Winner
    insert into public.bracket_entity_stats_daily(day, entity_type, entity_id, wins, losses, appearances)
    values (v_today, r.entity_type, r.winner_id, 1, 0, 1)
    on conflict (day, entity_type, entity_id) do update
      set wins = public.bracket_entity_stats_daily.wins + 1,
          appearances = public.bracket_entity_stats_daily.appearances + 1,
          updated_at = now();

    -- Daily Loser
    insert into public.bracket_entity_stats_daily(day, entity_type, entity_id, wins, losses, appearances)
    values (v_today, r.entity_type, r.loser_id, 0, 1, 1)
    on conflict (day, entity_type, entity_id) do update
      set losses = public.bracket_entity_stats_daily.losses + 1,
          appearances = public.bracket_entity_stats_daily.appearances + 1,
          updated_at = now();
  end loop;

  -- 5) If a champion was provided, increment their championship count
  if p_champion_id is not null then
    update public.bracket_entity_stats
    set championships_total = championships_total + 1,
        updated_at = now()
    where entity_type = p_bracket_type and entity_id = p_champion_id;

    -- Daily championship
    insert into public.bracket_entity_stats_daily(day, entity_type, entity_id, wins, losses, appearances, championships)
    values (v_today, p_bracket_type, p_champion_id, 0, 0, 0, 1)
    on conflict (day, entity_type, entity_id) do update
      set championships = public.bracket_entity_stats_daily.championships + 1,
          updated_at = now();
  end if;

  return jsonb_build_object('success', true, 'already_processed', false, 'matches_processed', array_length(p_results, 1));
end $$;

-- F) Enable RLS but allow anon to read stats (write via service role only)
alter table public.bracket_runs enable row level security;
alter table public.bracket_entity_stats enable row level security;
alter table public.bracket_entity_stats_daily enable row level security;

-- Read-only policies for anon
create policy "Anyone can read bracket_runs"
  on public.bracket_runs for select
  using (true);

create policy "Anyone can read bracket_entity_stats"
  on public.bracket_entity_stats for select
  using (true);

create policy "Anyone can read bracket_entity_stats_daily"
  on public.bracket_entity_stats_daily for select
  using (true);

-- Grant execute on RPC to service role (not anon)
revoke execute on function public.process_bracket_results from anon;
revoke execute on function public.process_bracket_results from authenticated;
