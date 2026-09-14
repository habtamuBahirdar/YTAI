/**
 * Database Connection for AddisDub
 * Uses pg (PostgreSQL) client directly for faster initialization
 */

import pg from 'pg';

const { Client } = pg;

let db: pg.Client | null = null;
let isConnected = false;

export async function getDb() {
  if (db && isConnected) {
    return db;
  }

  try {
    db = new Client({
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'addisdub_dev',
    });

    await db.connect();
    isConnected = true;
    console.log('✅ Database connected');
    return db;
  } catch (error) {
    console.error('Database connection error:', error);
    return null;
  }
}

// Create a simple query wrapper
export async function queryUser(email: string) {
  try {
    const client = await getDb();
    if (!client) return null;

    const result = await client.query(
      'SELECT id, email, password, name, credits FROM "users" WHERE email = $1',
      [email]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Query error:', error);
    return null;
  }
}

export default { getDb, queryUser };