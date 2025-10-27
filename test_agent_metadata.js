#!/usr/bin/env node

/**
 * Agent Metadata Test for Arize
 * This test verifies proper agent/node visualization with graph attributes
 * Based on: https://arize.com/docs/ax/observe/agents/implementing-agent-metadata-for-arize
 */

import { initializeArizeTracing, getTracer } from './backend/src/config/arize.js';
import { 
  createAgentSpan, 
  createLLMSpan, 
  addLLMInputMessages,
  addLLMOutputMessages,
  setSpanStatus, 
  addSpanMetadata,
  addGraphAttributes,
  SpanKinds,
  SpanAttributes
} from './backend/src/utils/tracing.js';

console.log('🧪 Agent Metadata Test for Arize');
console.log('Based on: https://arize.com/docs/ax/observe/agents/implementing-agent-metadata-for-arize');
console.log('=' .repeat(80));

// Initialize Arize tracing
const { tracerProvider, tracer } = initializeArizeTracing();

if (!tracer) {
  console.error('❌ Failed to initialize Arize tracing');
  process.exit(1);
}

console.log('\n📊 Test 1: Multi-Level Agent Hierarchy');
console.log('Creating: main_orchestrator → input_parser → content_generator → research_agent');

// Root level (no parent)
const mainSpan = createAgentSpan('listify-agent.main-workflow', {
  'operation.type': 'orchestration',
  'agent.name': 'listify-agent'
});
addGraphAttributes(mainSpan, 'main_orchestrator', null, 'Main Orchestrator');

// Child level
const inputSpan = createAgentSpan('listify-agent.parse-input', {
  'operation.type': 'parsing'
});
addGraphAttributes(inputSpan, 'input_parser', 'main_orchestrator', 'Input Parser');

// Grandchild level
const contentSpan = createAgentSpan('listify-agent.generate-content', {
  'operation.type': 'generation'
});
addGraphAttributes(contentSpan, 'content_generator', 'input_parser', 'Content Generator');

// Great-grandchild level
const researchSpan = createAgentSpan('listify-agent.research', {
  'operation.type': 'research'
});
addGraphAttributes(researchSpan, 'research_agent', 'content_generator', 'Research Agent');

// LLM span under research agent
const llmSpan = createLLMSpan('openai.research.completion', 'gpt-4o', {
  [SpanAttributes.LLM_TEMPERATURE]: 0.2,
  'llm.provider': 'openai',
  'llm.task': 'research'
});
addGraphAttributes(llmSpan, 'research_llm', 'research_agent', 'Research LLM');

// Add LLM data
const messages = [{ role: 'user', content: 'Research prompt for agent metadata test' }];
addLLMInputMessages(llmSpan, messages);
llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_PROMPT, 40);
llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_COMPLETION, 20);
llmSpan.setAttribute(SpanAttributes.LLM_TOKEN_COUNT_TOTAL, 60);

// End spans in reverse order (children first)
setSpanStatus(llmSpan, true);
llmSpan.end();
setSpanStatus(researchSpan, true);
researchSpan.end();
setSpanStatus(contentSpan, true);
contentSpan.end();
setSpanStatus(inputSpan, true);
inputSpan.end();
setSpanStatus(mainSpan, true);
mainSpan.end();

console.log('✅ Multi-level hierarchy created');

console.log('\n📊 Test 2: Parallel Agent Branches');
console.log('Creating: supervisor → [writer_agent, quality_checker]');

const supervisorSpan = createAgentSpan('listify-agent.supervisor', {
  'operation.type': 'supervision'
});
addGraphAttributes(supervisorSpan, 'supervisor', null, 'Supervisor');

// Parallel branch 1
const writerSpan = createAgentSpan('listify-agent.writer', {
  'operation.type': 'writing'
});
addGraphAttributes(writerSpan, 'writer_agent', 'supervisor', 'Writer Agent');

// Parallel branch 2
const qualitySpan = createAgentSpan('listify-agent.quality-check', {
  'operation.type': 'quality_check'
});
addGraphAttributes(qualitySpan, 'quality_checker', 'supervisor', 'Quality Checker');

// End parallel branches
setSpanStatus(writerSpan, true);
writerSpan.end();
setSpanStatus(qualitySpan, true);
qualitySpan.end();
setSpanStatus(supervisorSpan, true);
supervisorSpan.end();

console.log('✅ Parallel branches created');

console.log('\n📊 Test 3: Listify Agent Workflow');
console.log('Creating: listify_orchestrator → [image_analyzer, text_analyzer, link_analyzer]');

const listifySpan = createAgentSpan('listify-agent.orchestrator', {
  'operation.type': 'listify_orchestration',
  'agent.name': 'listify-agent',
  'agent.version': '1.0.0'
});
addGraphAttributes(listifySpan, 'listify_orchestrator', null, 'Listify Orchestrator');

// Image analyzer branch
const imageSpan = createAgentSpan('listify-agent.image-analysis', {
  'operation.type': 'image_analysis'
});
addGraphAttributes(imageSpan, 'image_analyzer', 'listify_orchestrator', 'Image Analyzer');

// Text analyzer branch
const textSpan = createAgentSpan('listify-agent.text-analysis', {
  'operation.type': 'text_analysis'
});
addGraphAttributes(textSpan, 'text_analyzer', 'listify_orchestrator', 'Text Analyzer');

// Link analyzer branch
const linkSpan = createAgentSpan('listify-agent.link-analysis', {
  'operation.type': 'link_analysis'
});
addGraphAttributes(linkSpan, 'link_analyzer', 'listify_orchestrator', 'Link Analyzer');

// End all branches
setSpanStatus(imageSpan, true);
imageSpan.end();
setSpanStatus(textSpan, true);
textSpan.end();
setSpanStatus(linkSpan, true);
linkSpan.end();
setSpanStatus(listifySpan, true);
listifySpan.end();

console.log('✅ Listify workflow created');

console.log('\n🎯 Agent Metadata Verification:');
console.log('  ✅ graph.node.id - Unique identifiers for each agent/node');
console.log('  ✅ graph.node.parent_id - Parent-child relationships');
console.log('  ✅ graph.node.display_name - Human-readable names');
console.log('  ✅ Multi-level hierarchy (4 levels deep)');
console.log('  ✅ Parallel branches from same parent');
console.log('  ✅ Real-world Listify agent workflow');

console.log('\n📋 Expected Graph Structure in Arize:');
console.log('  main_orchestrator');
console.log('  └── input_parser');
console.log('      └── content_generator');
console.log('          └── research_agent');
console.log('              └── research_llm');
console.log('');
console.log('  supervisor');
console.log('  ├── writer_agent');
console.log('  └── quality_checker');
console.log('');
console.log('  listify_orchestrator');
console.log('  ├── image_analyzer');
console.log('  ├── text_analyzer');
console.log('  └── link_analyzer');

console.log('\n⏳ Waiting 5 seconds for traces to be exported to Arize...');
setTimeout(() => {
  console.log('✅ Agent metadata traces should now be visible in your Arize dashboard!');
  console.log('\n📊 Look for these agent/node IDs in Arize:');
  console.log('   - main_orchestrator, input_parser, content_generator, research_agent');
  console.log('   - supervisor, writer_agent, quality_checker');
  console.log('   - listify_orchestrator, image_analyzer, text_analyzer, link_analyzer');
  console.log('\n🎉 Agent metadata implementation test completed!');
  console.log('\n💡 In Arize dashboard:');
  console.log('   1. Go to Traces section');
  console.log('   2. Filter by graph.node.id or graph.node.parent_id');
  console.log('   3. View hierarchical trace structure');
  console.log('   4. See custom display names in the UI');
  process.exit(0);
}, 5000);
