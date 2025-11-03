#!/usr/bin/env node

/**
 * Test Arize Tracing in Production
 * This script tests if Arize tracing is working on the production server
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const PRODUCTION_URL = 'https://listify-agent.onrender.com';

async function testProductionTraces() {
  console.log('🔍 Testing Arize Tracing in Production...');
  console.log('==================================================');
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await fetch(`${PRODUCTION_URL}/api/health`);
    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthResponse.status} ${healthResponse.statusText}`);
    }
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.message);
    
    // Test 2: Text analysis (should generate traces)
    console.log('\n2️⃣ Testing text analysis (should generate Arize traces)...');
    const textResponse = await fetch(`${PRODUCTION_URL}/api/analyze-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Buy milk, eggs, bread, and cheese for dinner'
      })
    });
    
    const textData = await textResponse.json();
    if (textData.success && textData.data) {
      console.log('✅ Text analysis successful:', textData.message || 'Items extracted');
      console.log('📊 Items extracted:', textData.data.itemCount || 0);
    } else {
      console.log('⚠️  Text analysis response:', textData.message || textData.error || 'Unknown response');
    }
    
    // Test 3: Link analysis (should generate traces)
    console.log('\n3️⃣ Testing link analysis (should generate Arize traces)...');
    const linkResponse = await fetch(`${PRODUCTION_URL}/api/analyze-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://example.com'
      })
    });
    
    const linkData = await linkResponse.json();
    if (linkData.success) {
      console.log('✅ Link analysis successful:', linkData.message || 'Analysis completed');
      if (linkData.data) {
        console.log('📊 Items extracted:', linkData.data.itemCount || 0);
      }
    } else {
      console.log('⚠️  Link analysis response:', linkData.message || linkData.error || 'Unknown response');
    }
    
    console.log('\n🎯 Production API calls completed!');
    console.log('📊 Check your Arize dashboard for traces from these requests:');
    console.log('   🔍 Look for spans related to:');
    console.log('   - Text analysis API calls');
    console.log('   - Link analysis API calls');
    console.log('   - OpenAI API calls');
    console.log('   🔍 Time Range: Last 5 minutes');
    console.log('   🔍 Project: listify-agent');
    
  } catch (error) {
    console.error('❌ Error testing production traces:', error.message);
  }
}

// Run the test
testProductionTraces();