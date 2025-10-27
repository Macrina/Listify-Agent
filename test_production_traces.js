#!/usr/bin/env node

/**
 * Test Production Traces
 * This test simulates production usage to verify traces appear in Arize
 */

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

console.log('🧪 Production Trace Test');
console.log('=' .repeat(50));

// Initialize Arize tracing
const { tracerProvider, tracer } = initializeArizeTracing();

if (!tracer) {
  console.error('❌ Failed to initialize Arize tracing');
  process.exit(1);
}

console.log('✅ Arize tracing initialized');

// Simulate image analysis workflow
console.log('\n📊 Simulating Image Analysis...');
const imageSpan = createAgentSpan('listify-agent.image-analysis', {
  'operation.type': 'image_analysis',
  'operation.category': 'ai_vision',
  'agent.name': 'listify-agent',
  'agent.version': '1.0.0',
  'service.name': 'listify-agent',
  'service.version': '1.0.0'
});
addGraphAttributes(imageSpan, 'image_analyzer', null, 'Image Analyzer');

// Add input attributes
imageSpan.setAttribute('input.image_size_bytes', 1024000);
imageSpan.setAttribute('input.image_size_mb', 1.0);
imageSpan.setAttribute('input.format', 'jpeg');

// Create LLM span
const llmSpan = createLLMSpan('openai.vision.completion', 'gpt-4o', 'Analyze this image for list items', {
  [SpanAttributes.LLM_TEMPERATURE]: 0.2,
  [SpanAttributes.LLM_MAX_TOKENS]: 2000,
  'llm.provider': 'openai',
  'llm.task': 'vision_analysis',
  'llm.response_format': 'json_object'
}, imageSpan);
addGraphAttributes(llmSpan, 'vision_llm', 'image_analyzer', 'Vision LLM');

// Add LLM data
const messages = [{ role: 'user', content: 'Analyze this image for list items' }];
addLLMInputMessages(llmSpan, messages);
llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_PROMPT, 50);
llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_COMPLETION, 200);
llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_TOTAL, 250);
llmSpan.setAttribute('llm.response_length', 800);
llmSpan.setAttribute('llm.finish_reason', 'stop');

// Add output messages
addLLMOutputMessages(llmSpan, [{ role: 'assistant', content: 'Mock response with extracted items' }]);
setSpanStatus(llmSpan, true);
llmSpan.end();

// Add output attributes to agent span
imageSpan.setAttribute('output.item_count', 3);
imageSpan.setAttribute('output.success', true);
imageSpan.setAttribute('output.categories', JSON.stringify(['groceries', 'tasks']));
imageSpan.setAttribute('output.sample_items', JSON.stringify(['Milk', 'Bread', 'Eggs']));

setSpanStatus(imageSpan, true);
imageSpan.end();

console.log('✅ Image analysis trace created');

// Simulate text analysis workflow
console.log('\n📊 Simulating Text Analysis...');
const textSpan = createAgentSpan('listify-agent.text-analysis', {
  'operation.type': 'text_analysis',
  'operation.category': 'ai_text',
  'agent.name': 'listify-agent',
  'agent.version': '1.0.0',
  'service.name': 'listify-agent',
  'service.version': '1.0.0'
});
addGraphAttributes(textSpan, 'text_analyzer', null, 'Text Analyzer');

textSpan.setAttribute('input.text_length', 150);
textSpan.setAttribute('input.text_preview', 'Shopping list: Milk, Bread, Eggs...');

const textLlmSpan = createLLMSpan('openai.text.completion', 'gpt-4o', 'Extract items from this text', {
  [SpanAttributes.LLM_TEMPERATURE]: 0.2,
  [SpanAttributes.LLM_MAX_TOKENS]: 2000,
  'llm.provider': 'openai',
  'llm.task': 'text_analysis',
  'llm.response_format': 'json_object'
}, textSpan);
addGraphAttributes(textLlmSpan, 'text_llm', 'text_analyzer', 'Text LLM');

textLlmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_PROMPT, 30);
textLlmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_COMPLETION, 150);
textLlmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_TOTAL, 180);
setSpanStatus(textLlmSpan, true);
textLlmSpan.end();

textSpan.setAttribute('output.item_count', 3);
textSpan.setAttribute('output.success', true);
setSpanStatus(textSpan, true);
textSpan.end();

console.log('✅ Text analysis trace created');

// Flush all traces
console.log('\n⏳ Flushing traces to Arize...');
await flushTraces();

console.log('✅ Production traces should now be visible in Arize!');
console.log('\n📊 Look for these trace names in Arize:');
console.log('   - listify-agent.image-analysis');
console.log('   - openai.vision.completion');
console.log('   - listify-agent.text-analysis');
console.log('   - openai.text.completion');
console.log('\n🎉 Production trace test completed!');
