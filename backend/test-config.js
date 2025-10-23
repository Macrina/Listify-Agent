import dotenv from 'dotenv';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

console.log('🧪 Testing Listify Agent Configuration\n');

// Test 1: Check environment variables
console.log('1️⃣  Checking environment variables...');
const requiredVars = [
  'OPENAI_API_KEY',
  'AGENTDB_API_KEY',
  'AGENTDB_TOKEN',
  'AGENTDB_DB_NAME'
];

let allVarsPresent = true;
for (const varName of requiredVars) {
  if (process.env[varName] && process.env[varName] !== `your_${varName.toLowerCase()}_here`) {
    console.log(`  ✅ ${varName} is set`);
  } else {
    console.log(`  ❌ ${varName} is missing or not configured`);
    allVarsPresent = false;
  }
}

if (!allVarsPresent) {
  console.log('\n❌ Please configure all required environment variables in .env file');
  process.exit(1);
}

console.log('  ✅ All environment variables are set!\n');

// Test 2: Test OpenAI API
console.log('2️⃣  Testing OpenAI API connection...');
async function testOpenAI() {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'user',
            content: 'Say "OpenAI connection successful!"'
          }
        ],
        max_tokens: 20
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('  ✅ OpenAI API is working!');
    console.log(`  📝 Response: ${response.data.choices[0].message.content}\n`);
    return true;
  } catch (error) {
    console.log('  ❌ OpenAI API error:', error.response?.data?.error?.message || error.message);
    return false;
  }
}

// Test 3: Test AgentDB
console.log('3️⃣  Testing AgentDB connection...');
async function testAgentDB() {
  try {
    const response = await axios.post(
      'https://api.agentdb.dev/query',
      {
        database: process.env.AGENTDB_DB_NAME,
        query: 'SELECT 1 as test, datetime("now") as current_time',
        params: []
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.AGENTDB_API_KEY}`,
          'X-Database-Token': process.env.AGENTDB_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('  ✅ AgentDB connection is working!');
    console.log(`  📝 Database: ${process.env.AGENTDB_DB_NAME}`);
    console.log(`  📝 Server time: ${response.data.rows[0].current_time}\n`);
    return true;
  } catch (error) {
    console.log('  ❌ AgentDB error:', error.response?.data?.message || error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  const openaiOk = await testOpenAI();
  const agentdbOk = await testAgentDB();

  console.log('═══════════════════════════════════════════════════');
  if (openaiOk && agentdbOk) {
    console.log('✅ All tests passed! Your configuration is ready.');
    console.log('═══════════════════════════════════════════════════\n');
    console.log('Next steps:');
    console.log('  1. Run: npm run install:all');
    console.log('  2. Run: node backend/setup-database.js');
    console.log('  3. Run: npm run dev\n');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please check your configuration.');
    console.log('═══════════════════════════════════════════════════\n');
    process.exit(1);
  }
}

runTests();
