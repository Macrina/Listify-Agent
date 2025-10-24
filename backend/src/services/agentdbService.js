/**
 * Smart AgentDB Service
 * Automatically detects if real AgentDB credentials are available
 * Falls back to mock service if not configured
 */

import { agentdbConfig } from '../config/agentdb.js';

// Force using real AgentDB service for testing
console.log('🔧 FIXING REAL AGENTDB SERVICE');
const serviceModule = await import('./agentdbRealDatabaseService.js');

// Export all functions from the selected service
export const {
  saveListItems,
  getLists,
  getListItems,
  updateListItem,
  deleteListItem,
  searchListItems,
  getStatistics,
  executeQuery,
} = serviceModule;