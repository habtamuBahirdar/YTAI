#!/usr/bin/env node

/**
 * Database Initialization Script - Complete Setup
 * 1. Creates database
 * 2. Creates schema
 * 3. Verifies installation
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Use individual credentials instead of URL
const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  database: 'postgres', // Connect to default postgres DB to create our DB
};

// Remove quotes if present
if (config.password && config.password.startsWith('"')) {
  config.password = config.password.slice(1, -1);
}

const DB_NAME = process.env.DB_NAME || 'addisdub_dev';

console.log(`📦 PostgreSQL Setup Script`);
console.log(`   Host: ${config.host}:${config.port}`);
console.log(`   User: ${config.user}`);
console.log(`   Target DB: ${DB_NAME}\n`);

function parseSqlStatements(sqlContent) {
  // Remove comments and split by semicolon
  const lines = sqlContent.split('\n');
  const statements = [];
  let currentStatement = '';

  for (const line of lines) {
    // Remove single-line comments
    const cleanedLine = line.replace(/--.*$/, '').trim();
    
    if (cleanedLine) {
      currentStatement += ' ' + cleanedLine;
      
      if (cleanedLine.endsWith(';')) {
        statements.push(currentStatement.replace(/;$/, '').trim());
        currentStatement = '';
      }
    }
  }

  // Add any remaining statement
  if (currentStatement.trim()) {
    statements.push(currentStatement.replace(/;$/, '').trim());
  }

  return statements.filter(stmt => stmt.length > 0);
}

async function setupDatabase() {
  let client = new Client(config);

  try {
    // Step 1: Connect to postgres DB to create our database
    console.log('Step 1: Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected\n');

    // Step 2: Create database if it doesn't exist
    console.log('Step 2: Creating database...');
    try {
      await client.query(`CREATE DATABASE "${DB_NAME}" OWNER postgres;`);
      console.log(`✅ Created database "${DB_NAME}"\n`);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`⚠️  Database "${DB_NAME}" already exists\n`);
      } else {
        throw error;
      }
    }

    // Close connection to postgres DB
    await client.end();

    // Step 3: Connect to our new database and create schema
    console.log('Step 3: Connecting to new database...');
    client = new Client({
      ...config,
      database: DB_NAME,
    });
    await client.connect();
    console.log(`✅ Connected to "${DB_NAME}"\n`);

    // Step 4: Execute schema
    console.log('Step 4: Creating schema...\n');
    const initSqlPath = path.join(__dirname, '../apps/web/prisma/init.sql');
    if (!fs.existsSync(initSqlPath)) {
      console.error(`❌ init.sql not found at ${initSqlPath}`);
      process.exit(1);
    }

    const initSql = fs.readFileSync(initSqlPath, 'utf8');
    const statements = parseSqlStatements(initSql);

    console.log(`Found ${statements.length} SQL statements to execute:\n`);

    let successCount = 0;
    let skipCount = 0;

    for (const statement of statements) {
      try {
        await client.query(statement);
        successCount++;
        const shortStmt = statement.substring(0, 50).replace(/\n/g, ' ');
        console.log(`  ✅ ${shortStmt}${statement.length > 50 ? '...' : ''}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          skipCount++;
          const shortStmt = statement.substring(0, 50).replace(/\n/g, ' ');
          console.log(`  ⚠️  ${shortStmt}${statement.length > 50 ? '...' : ''} (already exists)`);
        } else {
          console.error(`\n❌ Error executing: ${statement.substring(0, 50)}...`);
          console.error(`   ${error.message}`);
          throw error;
        }
      }
    }

    console.log(`\n✅ Schema creation: ${successCount} statements executed${skipCount > 0 ? ` (${skipCount} already existed)` : ''}\n`);

    // Step 5: Verify
    console.log('Step 5: Verifying tables...\n');
    const result = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    console.log('Tables created:');
    result.rows.forEach(row => {
      console.log(`  ✅ ${row.tablename}`);
    });

    const tables = ['users', 'dubbing_sessions', 'audio_segments', 'usage'];
    console.log('\nTable row counts:');
    for (const table of tables) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM "${table}";`);
        const count = countResult.rows[0].count;
        console.log(`  ${table}: ${count} rows`);
      } catch (e) {
        console.log(`  ${table}: (not found)`);
      }
    }

    console.log('\n🎉 Database setup complete!\n');
    console.log('Your database is ready for AddisDub.\n');
    console.log('Next: Phase 3 — Authentication');
    console.log('  Run: pnpm add -D prisma @prisma/client');
    console.log('  Then: pnpm prisma generate');

  } catch (error) {
    console.error('\n❌ Setup failed:');
    console.error(`Error: ${error.message}\n`);
    console.error('Troubleshooting:');
    console.error('  1. Verify PostgreSQL is running');
    console.error('  2. Check .env credentials:');
    console.error(`     DB_HOST=${process.env.DB_HOST}`);
    console.error(`     DB_PORT=${process.env.DB_PORT}`);
    console.error(`     DB_USERNAME=${process.env.DB_USERNAME}`);
    console.error(`     DB_NAME=${process.env.DB_NAME}`);
    console.error('  3. Try connecting manually with psql');
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase();
