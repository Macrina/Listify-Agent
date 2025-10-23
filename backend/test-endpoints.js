import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

console.log('🔍 Testing AgentDB API Endpoints\n');

console.log('Your AgentDB Configuration:');
console.log('  API Key:', process.env.AGENTDB_API_KEY?.substring(0, 20) + '...');
console.log('  Token:', process.env.AGENTDB_TOKEN);
console.log('  DB Name:', process.env.AGENTDB_DB_NAME);
console.log('  MCP URL:', process.env.AGENTDB_MCP_URL);
console.log('');

// Try different API endpoints
const endpoints = [
  'https://api.agentdb.dev/query',
  'https://api.agentdb.dev/v1/query',
  'https://api.agentdb.dev/execute',
  `https://mcp.agentdb.dev/eq1MHpX-qn/query`,
  `https://mcp.agentdb.dev/eq1MHpX-qn/execute`,
];

async function testEndpoint(url, method = 'POST') {
  console.log(`Testing: ${url}`);

  const headers = {
    'Authorization': `Bearer ${process.env.AGENTDB_API_KEY}`,
    'X-Database-Token': process.env.AGENTDB_TOKEN,
    'Content-Type': 'application/json',
  };

  const body = {
    database: process.env.AGENTDB_DB_NAME,
    query: 'SELECT 1 as test',
    params: []
  };

  try {
    const response = await axios({
      method: method,
      url: url,
      headers: headers,
      data: body,
      timeout: 5000
    });

    console.log(`  ✅ SUCCESS! Status: ${response.status}`);
    console.log(`  Response:`, JSON.stringify(response.data, null, 2));
    console.log('');
    return true;
  } catch (error) {
    console.log(`  ❌ Failed: ${error.response?.status || error.code}`);
    if (error.response?.data) {
      console.log(`  Error:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.log(`  Message:`, error.message);
    }
    console.log('');
    return false;
  }
}

async function testAll() {
  console.log('═══════════════════════════════════════════════════\n');

  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }

  console.log('═══════════════════════════════════════════════════\n');
  console.log('💡 If all failed, the issue might be:');
  console.log('   1. AgentDB database not created yet');
  console.log('   2. Different API structure than expected');
  console.log('   3. Need to use MCP protocol instead of REST');
  console.log('');
  console.log('📖 Check AgentDB documentation for correct API usage');
}

testAll();
