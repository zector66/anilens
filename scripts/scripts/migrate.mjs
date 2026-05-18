import postgres from 'postgres';

async function migrate() {
  const OLD_DB_URL = 'postgresql://neondb_owner:npg_X6Psxz4BVkLi@ep-dawn-mouse-ad04bowk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';
  const NEW_DB_URL = 'postgres://postgres.nubnfwfkbivbevfmmjfc:hh1zp6U93Na5DXpK@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require';

  const oldSql = postgres(OLD_DB_URL, { ssl: 'require' });
  const newSql = postgres(NEW_DB_URL, { ssl: 'require' });

  try {
    console.log('--- Starting Migration: Neon -> Supabase ---');

    console.log('Fetching users from Neon...');
    const users = await oldSqlSELECT * FROM users;
    console.log(Found  users.);
    
    if (users.length > 0) {
      for (const user of users) {
        await newSql
          INSERT INTO users (anilist_id, username, avatar_url, created_at)
          VALUES (, , , )
          ON CONFLICT (anilist_id) DO UPDATE SET
            username = EXCLUDED.username,
            avatar_url = EXCLUDED.avatar_url
        ;
      }
      console.log('Users migrated.');
    }

    const newUserMap = new Map();
    const allNewUsers = await newSqlSELECT id, anilist_id FROM users;
    allNewUsers.forEach(u => newUserMap.set(u.anilist_id, u.id));

    console.log('Fetching player_ratings from Neon...');
    const ratings = await oldSqlSELECT * FROM player_ratings;
    console.log(Found  ratings.);

    if (ratings.length > 0) {
      for (const r of ratings) {
        const originalUser = users.find(u => u.id === r.user_id);
        if (!originalUser) continue;
        
        const newUserId = newUserMap.get(originalUser.anilist_id);
        if (!newUserId) continue;

        await newSql
          INSERT INTO player_ratings (user_id, game_type, rating, games_played, wins, best_streak, current_streak, last_played, created_at, updated_at)
          VALUES (
            , 
            , 
            , 
            , 
            , 
            , 
            , 
            , 
            , 
            
          )
          ON CONFLICT DO NOTHING
        ;
      }
      console.log('Player ratings migrated.');
    }

    console.log('Fetching game_sessions from Neon...');
    const sessions = await oldSqlSELECT * FROM game_sessions;
    console.log(Found  sessions.);

    if (sessions.length > 0) {
      for (const s of sessions) {
        const originalUser = users.find(u => u.id === s.user_id);
        if (!originalUser) continue;
        
        const newUserId = newUserMap.get(originalUser.anilist_id);
        if (!newUserId) continue;

        await newSql
          INSERT INTO game_sessions (user_id, game_type, score, max_score, questions_count, correct_count, difficulty, rating_change, created_at)
          VALUES (
            , 
            , 
            , 
            , 
            , 
            , 
            , 
            , 
            
          )
          ON CONFLICT DO NOTHING
        ;
      }
      console.log('Game sessions migrated.');
    }

    console.log('--- Migration Completed Successfully ---');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await oldSql.end();
    await newSql.end();
  }
}

migrate();