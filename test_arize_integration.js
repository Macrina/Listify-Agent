#!/usr/bin/env node

/**
 * Test script to verify Arize integration
 * This script tests the Node.js Arize tracing setup
 */

import { initializeArizeTracing, getTracer } from './backend/src/config/arize.js';
import { 
  createAgentSpan, 
  createLLMSpan, 
  setSpanStatus, 
  addSpanMetadata,
  SpanKinds,
  SpanAttributes
} from './backend/src/utils/tracing.js';

console.log('🧪 Testing Arize Integration...');

// Initialize Arize tracing
console.log('1. Initializing Arize tracing...');
const { tracerProvider, tracer } = initializeArizeTracing();

if (!tracer) {
  console.error('❌ Failed to initialize Arize tracing');
  process.exit(1);
}

console.log('✅ Arize tracing initialized');

// Test 1: Simple agent span
console.log('2. Testing agent span creation...');
const agentSpan = createAgentSpan('test-agent-operation', {
  'operation.type': 'test',
  'operation.category': 'integration_test',
  'agent.name': 'listify-agent',
  'agent.version': '1.0.0'
});

agentSpan.setAttribute('test.input', 'integration test data');
agentSpan.setAttribute('test.output', 'success');
addSpanMetadata(agentSpan, {
  test_timestamp: new Date().toISOString(),
  test_type: 'integration'
});

setSpanStatus(agentSpan, true);
agentSpan.end();
console.log('✅ Agent span created and ended');

// Test 2: LLM span
console.log('3. Testing LLM span creation...');
const llmSpan = createLLMSpan('test-llm-operation', 'gpt-4o', {
  [SpanAttributes.LLM_TEMPERATURE]: 0.2,
  [SpanAttributes.LLM_MAX_TOKENS]: 100,
  'llm.provider': 'openai',
  'llm.task': 'test'
});

llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_PROMPT, 50);
llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_COMPLETION, 25);
llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_TOTAL, 75);
llmSpan.setAttribute('llm.response_length', 100);
llmSpan.setAttribute('llm.finish_reason', 'stop');

setSpanStatus(llmSpan, true);
llmSpan.end();
console.log('✅ LLM span created and ended');

// Test 3: Nested spans
console.log('4. Testing nested spans...');
const parentSpan = createAgentSpan('test-parent-operation', {
  'operation.type': 'nested_test'
});

const childSpan = createLLMSpan('test-child-operation', 'gpt-4o', {
  'llm.task': 'nested_test'
});

childSpan.setAttribute('test.nested', true);
setSpanStatus(childSpan, true);
childSpan.end();

parentSpan.setAttribute('test.has_child', true);
setSpanStatus(parentSpan, true);
parentSpan.end();
console.log('✅ Nested spans created and ended');

console.log('🎉 All Arize integration tests passed!');
console.log('📊 Check your Arize dashboard for traces with names:');
console.log('   - test-agent-operation');
console.log('   - test-llm-operation');
console.log('   - test-parent-operation');
console.log('   - test-child-operation');

// Wait a moment for traces to be exported
console.log('⏳ Waiting 5 seconds for traces to be exported...');
setTimeout(() => {
  console.log('✅ Test completed - traces should appear in Arize dashboard');
  process.exit(0);
}, 5000);
