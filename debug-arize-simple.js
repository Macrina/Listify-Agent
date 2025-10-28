#!/usr/bin/env node

/**
 * Simple Arize Tracing Debug Script
 * Uses the existing working configuration from the backend
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

import { initializeArizeTracing, flushTraces } from './backend/src/config/arize.js';
import { 
  createAgentSpan, 
  createLLMSpan, 
  addLLMInputMessages,
  addLLMOutputMessages,
  setSpanStatus, 
  addSpanMetadata,
  addGraphAttributes,
  SpanAttributes
} from './backend/src/utils/tracing.js';

console.log('🔍 Simple Arize Tracing Debug Script');
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

// Initialize Arize tracing using existing configuration
console.log('\n🔧 Initializing Arize Tracing:');
console.log('=' .repeat(40));

const { tracerProvider, tracer } = initializeArizeTracing();

if (!tracerProvider) {
    console.error('❌ Failed to initialize Arize tracing');
    process.exit(1);
}

console.log('✅ Arize tracing initialized successfully');

// Create comprehensive test traces using existing utilities
console.log('\n📊 Creating Comprehensive Test Traces:');
console.log('=' .repeat(40));

// Test 1: Agent span
console.log('1️⃣ Creating agent span...');
const agentSpan = createAgentSpan('debug-agent-span', {
    'operation.type': 'debug_test',
    'operation.category': 'testing',
    'agent.name': 'debug-agent',
    'agent.version': '1.0.0',
    'service.name': 'listify-agent',
    'service.version': '1.0.0'
});
addGraphAttributes(agentSpan, 'debug_agent', null, 'Debug Agent');

agentSpan.setAttribute('input.value', 'Debug test input');
agentSpan.setAttribute('test.timestamp', new Date().toISOString());
agentSpan.setAttribute('test.type', 'comprehensive_debug');

// Test 2: LLM span
console.log('2️⃣ Creating LLM span...');
const llmSpan = createLLMSpan('debug-llm-span', 'gpt-4o-mini', 'Debug test prompt', {
    [SpanAttributes.LLM_TEMPERATURE]: 0.7,
    [SpanAttributes.LLM_MAX_TOKENS]: 1000,
    'llm.provider': 'openai',
    'llm.task': 'debug_testing',
    'llm.response_format': 'text'
}, agentSpan);
addGraphAttributes(llmSpan, 'debug_llm', 'debug_agent', 'Debug LLM');

// Add LLM data
const messages = [
    { role: 'user', content: 'This is a debug test message' }
];
addLLMInputMessages(llmSpan, messages);
llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_PROMPT, 10);
llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_COMPLETION, 8);
llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_TOTAL, 18);
llmSpan.setAttribute('llm.response_length', 35);
llmSpan.setAttribute('llm.finish_reason', 'stop');

// Add output messages
addLLMOutputMessages(llmSpan, [
    { role: 'assistant', content: 'This is a debug test response' }
]);
setSpanStatus(llmSpan, true);
llmSpan.end();

// Test 3: Tool span
console.log('3️⃣ Creating tool span...');
const toolSpan = createAgentSpan('debug-tool-span', {
    'operation.type': 'tool_execution',
    'operation.category': 'testing',
    'tool.name': 'debug-tool',
    'tool.version': '1.0.0'
}, agentSpan);
addGraphAttributes(toolSpan, 'debug_tool', 'debug_agent', 'Debug Tool');

toolSpan.setAttribute('tool.arguments', JSON.stringify({ query: 'debug test' }));
toolSpan.setAttribute('tool.output', JSON.stringify({ result: 'debug completed' }));
setSpanStatus(toolSpan, true);
toolSpan.end();

// Test 4: Error span
console.log('4️⃣ Creating error span...');
const errorSpan = createAgentSpan('debug-error-span', {
    'operation.type': 'error_test',
    'operation.category': 'testing',
    'error.type': 'simulated'
}, agentSpan);
addGraphAttributes(errorSpan, 'debug_error', 'debug_agent', 'Debug Error');

errorSpan.setAttribute('input.value', 'Error test input');
errorSpan.setAttribute('error.message', 'Simulated error for testing');
errorSpan.setAttribute('error.code', 'DEBUG_ERROR');
setSpanStatus(errorSpan, false);
errorSpan.end();

// Complete agent span
agentSpan.setAttribute('output.value', 'Debug traces created successfully');
agentSpan.setAttribute('output.success', true);
agentSpan.setAttribute('output.trace_count', 4);
setSpanStatus(agentSpan, true);
agentSpan.end();

console.log('✅ All test spans created');

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
console.log('\n📊 Debug Summary:');
console.log('=' .repeat(40));
console.log('✅ Environment variables loaded');
console.log('✅ Arize tracing initialized');
console.log('✅ 4 comprehensive test spans created');
console.log('✅ Traces flushed to Arize');

console.log('\n🔍 What to Check in Arize:');
console.log('=' .repeat(40));
console.log('1. Go to your Arize dashboard');
console.log('2. Navigate to LLM Tracing');
console.log('3. Look for traces from the last 5 minutes');
console.log('4. Search for these span names:');
console.log('   - debug-agent-span');
console.log('   - debug-llm-span');
console.log('   - debug-tool-span');
console.log('   - debug-error-span');
console.log('5. Check span attributes and relationships');

console.log('\n🚨 If traces still don\'t appear:');
console.log('=' .repeat(40));
console.log('1. Verify your Arize credentials are correct');
console.log('2. Check if your Arize space is active');
console.log('3. Ensure you have the correct permissions');
console.log('4. Wait 2-3 minutes for traces to appear');
console.log('5. Check Arize dashboard filters (time range, etc.)');
console.log('6. Contact Arize support if issues persist');

console.log('\n🎉 Debug script completed!');
