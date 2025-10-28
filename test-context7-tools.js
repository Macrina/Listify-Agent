#!/usr/bin/env node

/**
 * Simple Context7 MCP Tools Test
 * 
 * Tests what tools are available in Context7 MCP
 */

import { spawn } from 'child_process';

async function testContext7Tools() {
  console.log('🔍 Testing Context7 MCP Tools...');
  console.log('=' .repeat(50));

  const process = spawn('npx', ['@upstash/context7-mcp'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let responseCount = 0;

  process.stdout.on('data', (data) => {
    console.log('STDOUT:', data.toString());
    responseCount++;
  });

  process.stderr.on('data', (data) => {
    console.log('STDERR:', data.toString());
  });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Request available tools
  const toolsRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  };

  console.log('📤 Sending tools/list request...');
  process.stdin.write(JSON.stringify(toolsRequest) + '\n');

  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Try a different method - maybe it's resources/list
  const resourcesRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'resources/list',
    params: {}
  };

  console.log('📤 Sending resources/list request...');
  process.stdin.write(JSON.stringify(resourcesRequest) + '\n');

  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Try prompts/list
  const promptsRequest = {
    jsonrpc: '2.0',
    id: 3,
    method: 'prompts/list',
    params: {}
  };

  console.log('📤 Sending prompts/list request...');
  process.stdin.write(JSON.stringify(promptsRequest) + '\n');

  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 3000));

  process.kill();
  
  console.log(`\n✅ Test completed. Received ${responseCount} responses.`);
}

testContext7Tools().catch(error => {
  console.error('❌ Test failed:', error);
});
