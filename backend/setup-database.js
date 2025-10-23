import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: join(__dirname, '../.env') });

const AGENTDB_API_BASE = 'https://api.agentdb.dev';

function getHeaders() {
  return {
    'Authorization': `Bearer ${process.env.AGENTDB_API_KEY}`,
    'X-Database-Token': process.env.AGENTDB_TOKEN,
    'Content-Type': 'application/json',
  };
}

async function executeQuery(query, params = []) {
  try {
    const response = await axios.post(
      `${AGENTDB_API_BASE}/query`,
      {
        database: process.env.AGENTDB_DB_NAME,
        query: query,
        params: params,
      },
      {
        headers: getHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error('Query error:', error.response?.data || error.message);
    throw error;
  }
}

async function setupDatabase() {
  console.log('🚀 Setting up AgentDB database...\n');

  try {
    // Test connection
    console.log('1️⃣  Testing connection to AgentDB...');
    await executeQuery('SELECT 1 as test');
    console.log('✅ Connection successful!\n');

    // Create lists table
    console.log('2️⃣  Creating lists table...');
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_type TEXT NOT NULL,
        source_metadata TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        item_count INTEGER DEFAULT 0
      )
    `);
    console.log('✅ Lists table created!\n');

    // Create list_items table
    console.log('3️⃣  Creating list_items table...');
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS list_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        list_id INTEGER NOT NULL,
        item_name TEXT NOT NULL,
        category TEXT DEFAULT 'other',
        quantity TEXT,
        priority TEXT DEFAULT 'medium',
        notes TEXT,
        status TEXT DEFAULT 'active',
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ List_items table created!\n');

    // Create indexes
    console.log('4️⃣  Creating indexes...');

    try {
      await executeQuery('CREATE INDEX IF NOT EXISTS idx_list_items_list_id ON list_items(list_id)');
      console.log('  ✅ Index on list_id created');
    } catch (e) {
      console.log('  ℹ️  Index on list_id already exists');
    }

    try {
      await executeQuery('CREATE INDEX IF NOT EXISTS idx_list_items_status ON list_items(status)');
      console.log('  ✅ Index on status created');
    } catch (e) {
      console.log('  ℹ️  Index on status already exists');
    }

    try {
      await executeQuery('CREATE INDEX IF NOT EXISTS idx_list_items_category ON list_items(category)');
      console.log('  ✅ Index on category created');
    } catch (e) {
      console.log('  ℹ️  Index on category already exists');
    }

    console.log('\n5️⃣  Verifying tables...');
    const tables = await executeQuery(`
      SELECT name FROM sqlite_master
      WHERE type='table'
      AND name IN ('lists', 'list_items')
      ORDER BY name
    `);
    console.log('  Tables found:', tables.rows.map(r => r.name).join(', '));

    console.log('\n✅ Database setup complete!\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('  Database: ' + process.env.AGENTDB_DB_NAME);
    console.log('  Tables: lists, list_items');
    console.log('  Indexes: 3 indexes created');
    console.log('═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    throw error;
  }
}

// Run setup
setupDatabase()
  .then(() => {
    console.log('✨ Setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });
