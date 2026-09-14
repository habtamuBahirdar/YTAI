#!/usr/bin/env node

/**
 * Fix Demo User Password Hash
 * Regenerates the correct bcryptjs hash for demo@addisdub.com
 */

const pg = require('pg');
const bcryptjs = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

const { Client } = pg;

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'addisdub_dev',
};

// Remove quotes if present
if (config.password && config.password.startsWith('"')) {
  config.password = config.password.slice(1, -1);
}

async function fixDemoUser() {
  const client = new Client(config);

  try {
    console.log('🔧 Fixing Demo User Password...\n');

    // Generate correct hash
    const correctHash = await bcryptjs.hash('demo123456', 10);
    console.log('✅ Generated correct password hash\n');

    // Connect to database
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check if demo user exists
    const userResult = await client.query(
      'SELECT id, email, password FROM "users" WHERE email = $1',
      ['demo@addisdub.com']
    );

    if (userResult.rows.length === 0) {
      console.log('❌ Demo user not found. Creating new user...\n');
      
      // Create new demo user
      const createResult = await client.query(
        'INSERT INTO "users" ("id", "email", "password", "name", "credits") VALUES ($1, $2, $3, $4, $5) RETURNING *',
        ['demo-user-1', 'demo@addisdub.com', correctHash, 'Demo User', 100]
      );
      
      console.log('✅ Demo user created:\n');
      console.log(`   Email: ${createResult.rows[0].email}`);
      console.log(`   Credits: ${createResult.rows[0].credits}`);
    } else {
      // Update existing user
      const updateResult = await client.query(
        'UPDATE "users" SET "password" = $1 WHERE email = $2 RETURNING *',
        [correctHash, 'demo@addisdub.com']
      );

      console.log('✅ Demo user password updated:\n');
      console.log(`   Email: ${updateResult.rows[0].email}`);
      console.log(`   Credits: ${updateResult.rows[0].credits}`);
      console.log(`   ID: ${updateResult.rows[0].id}`);
    }

    // Verify the hash works
    console.log('\n🧪 Verifying password...');
    const isValid = await bcryptjs.compare('demo123456', correctHash);
    if (isValid) {
      console.log('✅ Password verification passed!\n');
    } else {
      console.log('❌ Password verification failed!\n');
    }

    console.log('✨ Demo credentials are now ready:');
    console.log('   Email: demo@addisdub.com');
    console.log('   Password: demo123456\n');

  } catch (error) {
    console.error('❌ Error:', error.message, '\n');
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixDemoUser();
