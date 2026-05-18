import postgres from 'postgres';

async function migrate() {
  const OLD_DB_URL = 'postgresql://neondb_owner:npg_X6Psxz4BVkLi@ep-dawn-mouse-ad04bowk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';
  const NEW_DB_URL = 'postgres://postgres.nubnfwfkbivbevfmmjfc:hh1zp6U93Na5DXpK@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require';

  const oldSql = postgres(OLD_DB_URL, { ssl: 'require' });
  const newSql = postgres(NEW_DB_URL, { ssl: 'require' });

  try {
    console.log('--- Starting Migration ---');

    const users = await oldSql([ 'SELECT * FROM users' ]);
    console.log(Found  users.);
    
    if (users.length > 0) {
      for (const user of users) {
        await newSql([ 
          'INSERT INTO users (anilist_id, username, avatar_url, created_at) VALUES (', 
          user.anilist_id, ',', user.username, ',', user.avatar_url, ',', user.created_at, ') ON CONFLICT (anilist_id) DO UPDATE SET username = EXCLUDED.username, avatar_url = EXCLUDED.avatar_url'
        ]);
      }
    }

    const newUserMap = new Map();
    const allNewUsers = await newSql([ 'SELECT id, anilist_id FROM users' ]);
    allNewUsers.forEach(u => newUserMap.set(u.anilist_id, u.id));

    const ratings = await oldSql([ 'SELECT * FROM player_ratings' ]);
    if (ratings.length > 0) {
      for (const r of ratings) {
        const originalUser = users.find(u => u.id === r.user_id);
        if (!originalUser) continue;
        const newUserId = newUserMap.get(originalUser.anilist_id);
        if (!newUserId) continue;

        await newSql([
          'INSERT INTO player_ratings (user_id, game_type, rating, games_played, wins, best_streak, current_streak, last_played, created_at, updated_at) VALUES (',
          newUserId, ',', r.game_type, ',', r.rating, ',', r.games_played, ',', r.wins, ',', r.best_streak, ',', (r.current_streak || 0), ',', (r.last_played || null), ',', r.created_at, ',', r.updated_at, ') ON CONFLICT DO NOTHING'
        ]);
      }
    }

    const sessions = await oldSql([ 'SELECT * FROM game_sessions' ]);
    if (sessions.length > 0) {
      for (const s of sessions) {
        const originalUser = users.find(u => u.id === s.user_id);
        if (!originalUser) continue;
        const newUserId = newUserMap.get(originalUser.anilist_id);
        if (!newUserId) continue;

        await newSql([
          'INSERT INTO game_sessions (user_id, game_type, score, max_score, questions_count, correct_count, difficulty, rating_change, created_at) VALUES (',
          newUserId, ',', s.game_type, ',', s.score, ',', (s.max_score || 0), ',', (s.questions_count || 0), ',', (s.correct_count || 0), ',', s.difficulty, ',', (s.rating_change || 0), ',', s.created_at, ') ON CONFLICT DO NOTHING'
        ]);
      }
    }

    console.log('--- Migration Completed ---');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await oldSql.end();
    await newSql.end();
  }
}

migrate();