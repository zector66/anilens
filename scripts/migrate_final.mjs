import postgres from 'postgres';

async function migrate() {
  const oldSql = postgres('postgresql://neondb_owner:npg_X6Psxz4BVkLi@ep-dawn-mouse-ad04bowk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require');
  const newSql = postgres('postgres://postgres.nubnfwfkbivbevfmmjfc:hh1zp6U93Na5DXpK@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require');

  try {
    console.log('Fetching users...');
    const users = await oldSql`SELECT * FROM users`;
    console.log('Migrating', users.length, 'users...');

    for (const u of users) {
      await newSql`
        INSERT INTO users (anilist_id, username, avatar_url, created_at)
        VALUES (${u.anilist_id}, ${u.username}, ${u.avatar_url}, ${u.created_at})
        ON CONFLICT (anilist_id) DO NOTHING
      `;
    }

    console.log('Users done');

    const hasIdColumn = users.length > 0 && 'id' in users[0];

    const oldUserMap = new Map();
    if (hasIdColumn) {
      users.forEach(u => oldUserMap.set(u.id, u.anilist_id));
    } else {
      // If no id column, assume foreign keys use anilist_id directly
      users.forEach(u => oldUserMap.set(u.anilist_id, u.anilist_id));
    }

    const newUserMap = new Map();
    try {
      const res = await newSql`SELECT id, anilist_id FROM users`;
      res.forEach(u => newUserMap.set(u.anilist_id, u.id));
    } catch {
      // Fallback: target users table uses anilist_id as PK
      const res = await newSql`SELECT anilist_id FROM users`;
      res.forEach(u => newUserMap.set(u.anilist_id, u.anilist_id));
    }

    const ratings = await oldSql`SELECT * FROM player_ratings`;
    console.log('Migrating', ratings.length, 'ratings...');

    for (const r of ratings) {
      const oldAnilistId = oldUserMap.get(r.user_id);
      if (!oldAnilistId) continue;
      const nId = newUserMap.get(oldAnilistId);
      if (!nId) continue;

      await newSql`
        INSERT INTO player_ratings (user_id, game_type, rating, games_played, wins, best_streak, current_streak, last_played, created_at)
        VALUES (${nId}, ${r.game_type}, ${r.rating}, ${r.games_played}, ${r.wins}, ${r.best_streak}, ${r.current_streak || 0}, ${r.last_played}, ${r.created_at})
        ON CONFLICT DO NOTHING
      `;
    }

    console.log('Ratings done');

    const sessions = await oldSql`SELECT * FROM game_sessions`;
    console.log('Migrating', sessions.length, 'sessions...');

    for (const s of sessions) {
      const oldAnilistId = oldUserMap.get(s.user_id);
      if (!oldAnilistId) continue;
      const nId = newUserMap.get(oldAnilistId);
      if (!nId) continue;

      await newSql`
        INSERT INTO game_sessions (user_id, game_type, score, max_score, questions_count, correct_count, difficulty, rating_change, created_at)
        VALUES (${nId}, ${s.game_type}, ${s.score}, ${s.max_score || 0}, ${s.questions_count || 0}, ${s.correct_count || 0}, ${s.difficulty}, ${s.rating_change || 0}, ${s.created_at})
        ON CONFLICT DO NOTHING
      `;
    }

    console.log('Sessions done. Migration complete!');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await oldSql.end();
    await newSql.end();
  }
}

migrate();