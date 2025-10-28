#!/usr/bin/env node

/**
 * Context7 MCP Test Script
 * 
 * Tests the Context7 MCP integration functionality
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';

async function testContext7Integration() {
  console.log('🔍 Testing Context7 MCP Integration...');
  console.log('=' .repeat(50));

  try {
    // Test 1: Check Context7 status
    console.log('\n1. Testing Context7 Status...');
    const statusResponse = await fetch(`${BASE_URL}/api/context7/status`);
    const statusData = await statusResponse.json();
    
    if (statusResponse.ok) {
      console.log('✅ Context7 Status:', statusData);
    } else {
      console.log('❌ Context7 Status Error:', statusData);
    }

    // Test 2: Search for React documentation
    console.log('\n2. Testing React Documentation Search...');
    const searchResponse = await fetch(`${BASE_URL}/api/context7/search?q=react hooks&limit=5`);
    const searchData = await searchResponse.json();
    
    if (searchResponse.ok) {
      console.log('✅ Search Results:', searchData);
    } else {
      console.log('❌ Search Error:', searchData);
    }

    // Test 3: Get specific library documentation
    console.log('\n3. Testing Library Documentation...');
    const docsResponse = await fetch(`${BASE_URL}/api/context7/docs/react`);
    const docsData = await docsResponse.json();
    
    if (docsResponse.ok) {
      console.log('✅ Documentation Results:', docsData);
    } else {
      console.log('❌ Documentation Error:', docsData);
    }

    // Test 4: Get code examples
    console.log('\n4. Testing Code Examples...');
    const examplesResponse = await fetch(`${BASE_URL}/api/context7/examples?topic=useState&language=javascript`);
    const examplesData = await examplesResponse.json();
    
    if (examplesResponse.ok) {
      console.log('✅ Examples Results:', examplesData);
    } else {
      console.log('❌ Examples Error:', examplesData);
    }

    // Test 5: Get React-specific docs
    console.log('\n5. Testing React-Specific Documentation...');
    const reactResponse = await fetch(`${BASE_URL}/api/context7/react/useState`);
    const reactData = await reactResponse.json();
    
    if (reactResponse.ok) {
      console.log('✅ React Docs Results:', reactData);
    } else {
      console.log('❌ React Docs Error:', reactData);
    }

    console.log('\n✅ Context7 MCP Integration Test Completed!');
    console.log('📊 Check the results above for any errors');
    console.log('🔍 If Context7 is not initialized, make sure to:');
    console.log('   1. Set CONTEXT7_API_KEY in backend/.env');
    console.log('   2. Restart the backend server');
    console.log('   3. Check the MCP configuration in ~/.cursor/mcp.json');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure the backend server is running');
    console.log('   2. Check if Context7 MCP is properly installed');
    console.log('   3. Verify the API key configuration');
  }
}

// Run the test
testContext7Integration().catch(error => {
  console.error('❌ Test script error:', error);
});
