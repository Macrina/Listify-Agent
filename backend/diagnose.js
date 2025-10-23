import dotenv from 'dotenv';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

console.log('🔍 Detailed Diagnostic Test\n');

// Test OpenAI with more details
console.log('🤖 Testing OpenAI API...');
console.log('   API Key format:', process.env.OPENAI_API_KEY?.substring(0, 20) + '...');

async function testOpenAIDetailed() {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 5
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('   ✅ OpenAI API working!\n');
    return true;
  } catch (error) {
    console.log('   ❌ OpenAI Error Details:');
    console.log('   Status:', error.response?.status);
    console.log('   Error:', JSON.stringify(error.response?.data, null, 2));
    console.log('');
    return false;
  }
}

// Test AgentDB with more details
console.log('🗄️  Testing AgentDB API...');
console.log('   API Key format:', process.env.AGENTDB_API_KEY?.substring(0, 30) + '...');
console.log('   Token:', process.env.AGENTDB_TOKEN);
console.log('   Database:', process.env.AGENTDB_DB_NAME);

async function testAgentDBDetailed() {
  try {
    const response = await axios.post(
      'https://api.agentdb.dev/query',
      {
        database: process.env.AGENTDB_DB_NAME,
        query: 'SELECT 1 as test',
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
    console.log('   ✅ AgentDB API working!');
    console.log('   Response:', JSON.stringify(response.data, null, 2));
    console.log('');
    return true;
  } catch (error) {
    console.log('   ❌ AgentDB Error Details:');
    console.log('   Status:', error.response?.status);
    console.log('   Status Text:', error.response?.statusText);
    console.log('   Error:', JSON.stringify(error.response?.data, null, 2));
    console.log('   Request URL:', error.config?.url);
    console.log('');
    return false;
  }
}

async function runDiagnostics() {
  await testOpenAIDetailed();
  await testAgentDBDetailed();
}

runDiagnostics();
