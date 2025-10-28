#!/usr/bin/env node

/**
 * Production Trace Test - Real API Calls
 * This script makes actual API calls to the production/local backend to generate real traces
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

import fetch from 'node-fetch';
import fs from 'fs';

// Configuration
const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const TEST_IMAGE_PATH = path.join(__dirname, 'test-image.png');

console.log('🧪 Production Trace Test - Real API Calls');
console.log('=' .repeat(60));
console.log(`📍 Backend URL: ${BASE_URL}`);
console.log(`📸 Test Image: ${TEST_IMAGE_PATH}`);
console.log('');

async function testHealthCheck() {
  console.log('1️⃣  Testing Health Check...');
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();
    console.log('✅ Health Check:', data);
    return true;
  } catch (error) {
    console.error('❌ Health Check failed:', error.message);
    return false;
  }
}

async function testImageAnalysis() {
  console.log('\n2️⃣  Testing Image Analysis (with real trace)...');
  
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    console.error(`❌ Test image not found: ${TEST_IMAGE_PATH}`);
    return false;
  }
  
  try {
    const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH);
    const formData = new FormData();
    
    // Create a Blob from the buffer
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    formData.append('image', blob, 'test-image.png');
    
    console.log('📤 Uploading image...');
    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Image Analysis successful!');
      console.log(`📊 Items extracted: ${data.items?.length || 0}`);
      
      if (data.items && data.items.length > 0) {
        console.log('📋 Sample items:');
        data.items.slice(0, 3).forEach((item, i) => {
          console.log(`   ${i + 1}. ${item.item_name} (${item.category})`);
        });
      }
      
      return true;
    } else {
      console.error('❌ Image Analysis failed:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Image Analysis error:', error.message);
    return false;
  }
}

async function testTextAnalysis() {
  console.log('\n3️⃣  Testing Text Analysis (with real trace)...');
  
  const testText = `
  Shopping List:
  - Milk (2 gallons)
  - Bread (white)
  - Eggs (1 dozen)
  - Apples (5 lbs)
  - Coffee
  `;
  
  try {
    console.log('📤 Sending text for analysis...');
    const response = await fetch(`${BASE_URL}/api/analyze-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: testText }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Text Analysis successful!');
      console.log(`📊 Items extracted: ${data.items?.length || 0}`);
      
      if (data.items && data.items.length > 0) {
        console.log('📋 Sample items:');
        data.items.slice(0, 3).forEach((item, i) => {
          console.log(`   ${i + 1}. ${item.item_name} (${item.category})`);
        });
      }
      
      return true;
    } else {
      console.error('❌ Text Analysis failed:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Text Analysis error:', error.message);
    return false;
  }
}

async function testLinkAnalysis() {
  console.log('\n4️⃣  Testing Link Analysis (with real trace)...');
  
  const testUrl = 'https://example.com'; // Replace with a valid URL
  
  try {
    console.log(`📤 Analyzing link: ${testUrl}`);
    const response = await fetch(`${BASE_URL}/api/analyze-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: testUrl }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Link Analysis successful!');
      console.log(`📊 Items extracted: ${data.items?.length || 0}`);
      
      if (data.items && data.items.length > 0) {
        console.log('📋 Sample items:');
        data.items.slice(0, 3).forEach((item, i) => {
          console.log(`   ${i + 1}. ${item.item_name} (${item.category})`);
        });
      }
      
      return true;
    } else {
      console.error('❌ Link Analysis failed:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Link Analysis error:', error.message);
    return false;
  }
}

async function testGetLists() {
  console.log('\n5️⃣  Testing Get Lists...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/lists`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Get Lists successful!');
      console.log(`📊 Total lists: ${data.lists?.length || 0}`);
      return true;
    } else {
      console.error('❌ Get Lists failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Get Lists error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting production trace tests...\n');
  
  const results = {
    healthCheck: await testHealthCheck(),
    imageAnalysis: await testImageAnalysis(),
    textAnalysis: await testTextAnalysis(),
    linkAnalysis: await testLinkAnalysis(),
    getLists: await testGetLists(),
  };
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Test Results Summary:');
  console.log('=' .repeat(60));
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;
  
  for (const [test, passed] of Object.entries(results)) {
    console.log(`${passed ? '✅' : '❌'} ${test}`);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log(`Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests > 0) {
    console.log('\n✅ Traces have been sent to Arize!');
    console.log('📊 Check your Arize dashboard for the following traces:');
    console.log('   - listify-agent.image-analysis');
    console.log('   - openai.vision.completion');
    console.log('   - listify-agent.text-analysis');
    console.log('   - listify-agent.link-analysis');
    console.log('   - openai.text.completion');
  }
  
  console.log('\n🎉 Production trace test completed!\n');
}

runTests().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

