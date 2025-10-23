import dotenv from 'dotenv';

dotenv.config();

if (!process.env.AGENTDB_API_KEY) {
  console.error('ERROR: AGENTDB_API_KEY is not set in environment variables');
  process.exit(1);
}

if (!process.env.AGENTDB_TOKEN) {
  console.error('ERROR: AGENTDB_TOKEN is not set in environment variables');
  process.exit(1);
}

export const agentdbConfig = {
  apiKey: process.env.AGENTDB_API_KEY,
  token: process.env.AGENTDB_TOKEN,
  dbName: process.env.AGENTDB_DB_NAME || 'listify-agent',
  mcpUrl: process.env.AGENTDB_MCP_URL,
};

export default agentdbConfig;
