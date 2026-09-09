#!/usr/bin/env node

/**
 * Add password column to users table
 */

import pg from 'pg';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'addisdub_dev',
};

if (config.password && config.password.startsWith('"')) {
  config.password = config.password.slice(1, -1);
}

async function addPasswordColumn() {
  const client = new Client(config);

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    console.log('Adding password column to users table...');
    await client.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password" TEXT;
    `);
    console.log('✅ Password column added\n');

    // Insert demo user
    console.log('Inserting demo user...');
    await client.query(`
      INSERT INTO "users" ("id", "email", "password", "name", "credits") 
      VALUES ('demo-user-1', 'demo@addisdub.com', '$2a$10$W3l8fHvWCKDDDz.P6IGNN.CjHCmRZAGLPsLp7Xe3Kpx1AkfILEi8K', 'Demo User', 100)
      ON CONFLICT ("email") DO NOTHING;
    `);
    console.log('✅ Demo user created\n');

    console.log('🎉 Migration complete!');
    console.log('\nDemo credentials:');
    console.log('  Email: demo@addisdub.com');
    console.log('  Password: demo123456');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

addPasswordColumn();
