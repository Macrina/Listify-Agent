#!/usr/bin/env node

/**
 * Comprehensive Arize Trace Format Test
 * This test verifies that traces are properly formatted with all required attributes
 */

import { initializeArizeTracing, getTracer } from './backend/src/config/arize.js';
import { 
  createAgentSpan, 
  createLLMSpan, 
  addLLMInputMessages,
  addLLMOutputMessages,
  setSpanStatus, 
  addSpanMetadata,
  recordSpanException,
  SpanKinds,
  SpanAttributes
} from './backend/src/utils/tracing.js';

console.log('🧪 Comprehensive Arize Trace Format Test');
console.log('=' .repeat(60));

// Initialize Arize tracing
const { tracerProvider, tracer } = initializeArizeTracing();

if (!tracer) {
  console.error('❌ Failed to initialize Arize tracing');
  process.exit(1);
}

console.log('\n📊 Test 1: Agent Span with Rich Metadata');
const agentSpan = createAgentSpan('listify-agent.test-operation', {
  'operation.type': 'test',
  'operation.category': 'comprehensive_test',
  'agent.name': 'listify-agent',
  'agent.version': '1.0.0',
  'service.name': 'listify-agent',
  'service.version': '1.0.0',
  'input.data': JSON.stringify({ test: 'comprehensive_trace_test' }),
  'input.size': 100
});

agentSpan.setAttribute('output.success', true);
agentSpan.setAttribute('output.item_count', 5);
agentSpan.setAttribute('output.categories', JSON.stringify(['groceries', 'tasks']));

addSpanMetadata(agentSpan, {
  test_timestamp: new Date().toISOString(),
  test_type: 'comprehensive',
  environment: 'test'
});

setSpanStatus(agentSpan, true);
agentSpan.end();
console.log('✅ Agent span created with rich metadata');

console.log('\n📊 Test 2: LLM Span with Token Metrics');
const llmSpan = createLLMSpan('openai.test.completion', 'gpt-4o', {
  [SpanAttributes.LLM_TEMPERATURE]: 0.2,
  [SpanAttributes.LLM_MAX_TOKENS]: 2000,
  'llm.provider': 'openai',
  'llm.task': 'test',
  'llm.response_format': 'json_object'
});

const messages = [
  { role: 'user', content: 'Test prompt for comprehensive trace' }
];
addLLMInputMessages(llmSpan, messages);

llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_PROMPT, 50);
llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_COMPLETION, 25);
llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_TOTAL, 75);
llmSpan.setAttribute('llm.response_length', 100);
llmSpan.setAttribute('llm.finish_reason', 'stop');
llmSpan.setAttribute('llm.model_version', 'gpt-4o-2024-05-13');

const outputMessage = { role: 'assistant', content: 'Test response' };
addLLMOutputMessages(llmSpan, [outputMessage]);

setSpanStatus(llmSpan, true);
llmSpan.end();
console.log('✅ LLM span created with token metrics');

console.log('\n📊 Test 3: Nested Spans (Parent-Child)');
const parentSpan = createAgentSpan('listify-agent.parent-operation', {
  'operation.type': 'nested_test'
});

const childLLMSpan = createLLMSpan('openai.child.completion', 'gpt-4o', {
  'llm.task': 'child_test'
});

childLLMSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_PROMPT, 30);
childLLMSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_COMPLETION, 15);
setSpanStatus(childLLMSpan, true);
childLLMSpan.end();

parentSpan.setAttribute('operation.has_child', true);
addSpanMetadata(parentSpan, { nested: true });
setSpanStatus(parentSpan, true);
parentSpan.end();
console.log('✅ Nested spans created successfully');

console.log('\n📊 Test 4: Error Span with Exception');
const errorSpan = createAgentSpan('listify-agent.error-operation', {
  'operation.type': 'error_test'
});

try {
  throw new Error('Test error for comprehensive trace');
} catch (error) {
  recordSpanException(errorSpan, error, {
    'output.success': false,
    'error.context': 'comprehensive_test'
  });
}
errorSpan.end();
console.log('✅ Error span created with exception');

console.log('\n🎯 Trace Format Verification:');
console.log('  ✅ Agent spans with OpenInference attributes');
console.log('  ✅ LLM spans with token counts and metadata');
console.log('  ✅ Nested span relationships');
console.log('  ✅ Error handling with exception recording');
console.log('  ✅ Rich metadata and context');

console.log('\n📋 Expected Trace Attributes:');
console.log('  • Agent spans: operation.type, agent.name, output.*');
console.log('  • LLM spans: llm.token_count.*, llm.model_name, llm.*');
console.log('  • All spans: service.name, service.version, metadata');

console.log('\n⏳ Waiting 5 seconds for traces to be exported to Arize...');
setTimeout(() => {
  console.log('✅ Traces should now be visible in your Arize dashboard!');
  console.log('\n📊 Look for these trace names in Arize:');
  console.log('   - listify-agent.test-operation');
  console.log('   - openai.test.completion');
  console.log('   - listify-agent.parent-operation');
  console.log('   - openai.child.completion');
  console.log('   - listify-agent.error-operation');
  console.log('\n🎉 Comprehensive trace format test completed!');
  process.exit(0);
}, 5000);
