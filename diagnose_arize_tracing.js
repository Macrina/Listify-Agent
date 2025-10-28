#!/usr/bin/env node

/**
 * Arize Tracing Diagnostic Tool
 * This script helps diagnose issues with Arize tracing
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables manually
function loadEnv() {
  const envFiles = ['.env', 'backend/.env'];
  for (const envFile of envFiles) {
    try {
      const envPath = resolve(__dirname, envFile);
      const envContent = readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
    } catch (e) {
      // File doesn't exist or can't be read
    }
  }
}

loadEnv();

console.log('🔍 Arize Tracing Diagnostic Tool');
console.log('=' .repeat(60));

// Check environment variables
console.log('\n1️⃣  Checking Environment Variables...');
const envVars = {
  'ARIZE_SPACE_ID': process.env.ARIZE_SPACE_ID,
  'ARIZE_API_KEY': process.env.ARIZE_API_KEY,
  'ARIZE_PROJECT_NAME': process.env.ARIZE_PROJECT_NAME || 'listify-agent',
  'ARIZE_ENDPOINT': process.env.ARIZE_ENDPOINT || 'https://otlp.arize.com/v1',
  'NODE_ENV': process.env.NODE_ENV
};

let hasAllVars = true;
for (const [key, value] of Object.entries(envVars)) {
  const hasValue = value && value !== '';
  const displayValue = key.includes('KEY') ? 
    (hasValue ? `${value.substring(0, 10)}...${value.substring(value.length - 10)}` : 'NOT SET') :
    (value || 'NOT SET');
  
  console.log(`${hasValue ? '✅' : '❌'} ${key}: ${displayValue}`);
  if ((key === 'ARIZE_SPACE_ID' || key === 'ARIZE_API_KEY') && !hasValue) {
    hasAllVars = false;
  }
}

if (!hasAllVars) {
  console.log('\n❌ Missing required environment variables!');
  console.log('   Please set ARIZE_SPACE_ID and ARIZE_API_KEY');
  process.exit(1);
}

// Test Arize configuration
console.log('\n2️⃣  Testing Arize Configuration...');
try {
  const { initializeArizeTracing, getArizeConfig } = await import('./backend/src/config/arize.js');
  
  const config = getArizeConfig();
  console.log('📊 Configuration:');
  console.log(`   Endpoint: ${config.endpoint}`);
  console.log(`   Project: ${config.projectName}`);
  console.log(`   Environment: ${config.environment}`);
  
  const { tracerProvider, tracer } = initializeArizeTracing();
  
  if (tracer) {
    console.log('✅ Arize tracing initialized successfully');
  } else {
    console.log('❌ Failed to initialize Arize tracing');
    process.exit(1);
  }
  
  // Create a test trace
  console.log('\n3️⃣  Creating Test Trace...');
  const testSpan = tracer.startSpan('diagnostic-test-span');
  testSpan.setAttribute('test.type', 'diagnostic');
  testSpan.setAttribute('test.environment', config.environment);
  testSpan.setAttribute('test.timestamp', new Date().toISOString());
  testSpan.setAttribute('service.name', config.projectName);
  testSpan.end();
  
  console.log('✅ Test span created');
  
  // Flush traces
  console.log('\n4️⃣  Flushing Traces to Arize...');
  const { flushTraces } = await import('./backend/src/config/arize.js');
  await flushTraces();
  
  console.log('✅ Traces flushed');
  
  // Final instructions
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Diagnostic Complete!');
  console.log('=' .repeat(60));
  console.log('\n✅ If you saw no errors above, your tracing should be working!');
  console.log('\n📈 Next Steps:');
  console.log('   1. Go to https://app.arize.com');
  console.log('   2. Select project: ' + config.projectName);
  console.log('   3. Navigate to "Traces" tab');
  console.log('   4. Look for span: "diagnostic-test-span"');
  console.log('   5. Set time range to "Last 15 minutes"');
  console.log('\n💡 Tip: If traces don\'t appear immediately, wait 1-2 minutes');
  console.log('');
  
} catch (error) {
  console.error('\n❌ Error during diagnostic:', error.message);
  console.error(error.stack);
  process.exit(1);
}
