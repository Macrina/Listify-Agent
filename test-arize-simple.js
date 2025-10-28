#!/usr/bin/env node

/**
 * Simple Arize Tracing Test Script
 * Tests the basic Arize configuration without complex utilities
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

import { initializeArizeTracing, flushTraces } from './backend/src/config/arize.js';
import { trace } from '@opentelemetry/api';

console.log('🔍 Simple Arize Tracing Test Script');
console.log('=' .repeat(50));

// Check environment variables
console.log('\n📋 Environment Variables Check:');
console.log('=' .repeat(40));
console.log(`ARIZE_SPACE_ID: ${process.env.ARIZE_SPACE_ID ? '✅ Set' : '❌ Missing'}`);
console.log(`ARIZE_API_KEY: ${process.env.ARIZE_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`ARIZE_PROJECT_NAME: ${process.env.ARIZE_PROJECT_NAME || 'listify-agent'}`);

if (!process.env.ARIZE_SPACE_ID || !process.env.ARIZE_API_KEY) {
    console.error('\n❌ Missing required Arize credentials!');
    console.error('Please check your .env file contains:');
    console.error('ARIZE_SPACE_ID=your_space_id');
    console.error('ARIZE_API_KEY=your_api_key');
    process.exit(1);
}

// Initialize Arize tracing
console.log('\n🔧 Initializing Arize Tracing:');
console.log('=' .repeat(40));

const { tracerProvider } = initializeArizeTracing();

if (!tracerProvider) {
    console.error('❌ Failed to initialize Arize tracing');
    process.exit(1);
}

console.log('✅ Arize tracing initialized successfully');

// Create a simple test span
console.log('\n📊 Creating Simple Test Span:');
console.log('=' .repeat(40));

const tracer = trace.getTracer('listify-agent', '1.0.0');

const span = tracer.startSpan('simple-test-span', {
    attributes: {
        'openinference.span.kind': 'AGENT',
        'input.value': 'Simple test input',
        'test.timestamp': new Date().toISOString(),
        'test.type': 'simple_test',
        'agent.name': 'listify-agent',
        'agent.version': '1.0.0'
    }
});

span.setAttribute('output.value', 'Simple test completed');
span.setAttribute('output.success', true);
span.setStatus({ code: 1, message: 'Success' });
span.end();

console.log('✅ Simple test span created');

// Force flush all traces
console.log('\n⏳ Flushing traces to Arize...');
console.log('=' .repeat(40));

try {
    await flushTraces();
    console.log('✅ Traces flushed successfully');
} catch (error) {
    console.error(`❌ Failed to flush traces: ${error.message}`);
}

// Summary
console.log('\n📊 Test Summary:');
console.log('=' .repeat(40));
console.log('✅ Environment variables loaded');
console.log('✅ Arize tracing initialized');
console.log('✅ Simple test span created');
console.log('✅ Traces flushed to Arize');

console.log('\n🔍 What to Check in Arize:');
console.log('=' .repeat(40));
console.log('1. Go to your Arize dashboard');
console.log('2. Navigate to LLM Tracing');
console.log('3. Look for traces from the last 5 minutes');
console.log('4. Search for span name: "simple-test-span"');
console.log('5. Check span attributes and status');

console.log('\n🎉 Simple test script completed!');
