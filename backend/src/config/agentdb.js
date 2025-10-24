/**
 * AgentDB Configuration
 * Automatically detects if credentials are available
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../../.env') });

export const agentdbConfig = {
  mcpUrl: process.env.AGENTDB_MCP_URL || 'https://mcp.agentdb.dev/LW-aEoVKYL',
  apiKey: process.env.AGENTDB_API_KEY || 'dummy-key-for-build',
  dbName: process.env.AGENTDB_DB_NAME || 'listify-agent'
};