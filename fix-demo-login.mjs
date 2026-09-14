import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

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

async function updateDemoUser() {
  const client = new Client(config);
  
  try {
    console.log('🔄 Updating demo user password...\n');
    
    await client.connect();
    
    // Correct bcryptjs hash for 'demo123456'
    const correctHash = '$2b$10$1JNuJEo9BwuqIA6PHO/b9.l1e3.G.lnis6Mpc1KjPneZFUPLvMJZC';
    
    const result = await client.query(
      'UPDATE "users" SET "password" = $1 WHERE email = $2 RETURNING id, email, credits',
      [correctHash, 'demo@addisdub.com']
    );
    
    if (result.rows.length === 0) {
      console.log('⚠️  Demo user not found, creating...\n');
      
      const createResult = await client.query(
        'INSERT INTO "users" ("id", "email", "password", "name", "credits") VALUES ($1, $2, $3, $4, $5) RETURNING id, email, credits',
        ['demo-user-1', 'demo@addisdub.com', correctHash, 'Demo User', 100]
      );
      
      const user = createResult.rows[0];
      console.log('✅ Demo user created:\n');
      console.log(`   Email: ${user.email}`);
      console.log(`   Credits: ${user.credits}`);
    } else {
      const user = result.rows[0];
      console.log('✅ Demo user password updated:\n');
      console.log(`   Email: ${user.email}`);
      console.log(`   Credits: ${user.credits}`);
      console.log(`   ID: ${user.id}`);
    }
    
    console.log('\n✨ Ready to login with:');
    console.log('   Email: demo@addisdub.com');
    console.log('   Password: demo123456\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

updateDemoUser();
