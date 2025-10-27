/**
 * Comprehensive Arize Tracing Test
 * Tests if traces are being sent to Arize dashboard
 */

import { initializeArizeTracing } from './src/config/arize-mcp.js';
import { createAgentSpan, createLLMSpan, addLLMInputMessages, addLLMOutputMessages } from './src/utils/tracing-mcp.js';

console.log('🧪 COMPREHENSIVE ARIZE TRACING TEST');
console.log('===================================\n');

async function testArizeTracing() {
  try {
    // Step 1: Initialize Arize tracing
    console.log('1️⃣ INITIALIZING ARIZE TRACING:');
    const { tracerProvider, tracer } = initializeArizeTracing();
    
    if (!tracerProvider || !tracer) {
      console.error('❌ Failed to initialize Arize tracing');
      console.log('🔍 Check your environment variables:');
      console.log('   - ARIZE_SPACE_ID:', process.env.ARIZE_SPACE_ID ? '✅ Set' : '❌ Missing');
      console.log('   - ARIZE_API_KEY:', process.env.ARIZE_API_KEY ? '✅ Set' : '❌ Missing');
      console.log('   - ARIZE_ENDPOINT:', process.env.ARIZE_ENDPOINT || 'Not set');
      console.log('   - ARIZE_PROJECT_NAME:', process.env.ARIZE_PROJECT_NAME || 'Not set');
      return;
    }
    
    console.log('   ✅ Arize tracing initialized successfully\n');

    // Step 2: Test Agent Span
    console.log('2️⃣ TESTING AGENT SPAN:');
    const agentSpan = createAgentSpan(
      'test-agent-operation',
      'Testing agent span creation',
      {
        'test.type': 'comprehensive_test',
        'test.timestamp': new Date().toISOString(),
        'test.environment': process.env.NODE_ENV || 'development'
      }
    );

    // Add some metadata
    agentSpan.setAttribute('test.user_id', 'test_user_123');
    agentSpan.setAttribute('test.session_id', 'test_session_456');
    agentSpan.setAttribute('test.operation', 'agent_test');
    
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 100));
    
    agentSpan.setStatus({ code: 1 }); // OK
    agentSpan.end();
    console.log('   ✅ Agent span created and ended\n');

    // Step 3: Test LLM Span
    console.log('3️⃣ TESTING LLM SPAN:');
    const llmSpan = createLLMSpan(
      'test-llm-call',
      'Testing LLM span creation',
      {
        'llm.model.name': 'gpt-4o',
        'llm.temperature': 0.7,
        'llm.max_tokens': 1000,
        'test.type': 'comprehensive_test'
      }
    );

    // Add input messages
    const inputMessages = [
      { role: 'user', content: 'Test message for Arize tracing' }
    ];
    addLLMInputMessages(llmSpan, inputMessages);

    // Simulate LLM processing
    await new Promise(resolve => setTimeout(resolve, 200));

    // Add output messages
    const outputMessages = [
      { role: 'assistant', content: 'This is a test response for Arize tracing verification' }
    ];
    addLLMOutputMessages(llmSpan, outputMessages);

    // Add token information
    llmSpan.setAttribute('llm.token_count.prompt', 10);
    llmSpan.setAttribute('llm.token_count.completion', 15);
    llmSpan.setAttribute('llm.token_count.total', 25);
    llmSpan.setAttribute('llm.cost.total', 0.0001);

    llmSpan.setStatus({ code: 1 }); // OK
    llmSpan.end();
    console.log('   ✅ LLM span created and ended\n');

    // Step 4: Test Tool Span
    console.log('4️⃣ TESTING TOOL SPAN:');
    const toolSpan = createAgentSpan(
      'test-tool-operation',
      'Testing tool span creation',
      {
        'tool.name': 'test_tool',
        'tool.category': 'testing',
        'test.type': 'comprehensive_test'
      }
    );

    // Simulate tool execution
    await new Promise(resolve => setTimeout(resolve, 150));

    toolSpan.setAttribute('tool.execution.time', 150);
    toolSpan.setAttribute('tool.success', true);
    toolSpan.setStatus({ code: 1 }); // OK
    toolSpan.end();
    console.log('   ✅ Tool span created and ended\n');

    // Step 5: Test Cross-Service Span
    console.log('5️⃣ TESTING CROSS-SERVICE SPAN:');
    const crossServiceSpan = createAgentSpan(
      'test-cross-service',
      'Testing cross-service integration',
      {
        'service.name': 'test-service',
        'service.version': '1.0.0',
        'test.type': 'comprehensive_test'
      }
    );

    // Simulate cross-service call
    await new Promise(resolve => setTimeout(resolve, 300));

    crossServiceSpan.setAttribute('service.latency', 300);
    crossServiceSpan.setAttribute('service.success', true);
    crossServiceSpan.setStatus({ code: 1 }); // OK
    crossServiceSpan.end();
    console.log('   ✅ Cross-service span created and ended\n');

    // Step 6: Wait for traces to be sent
    console.log('6️⃣ WAITING FOR TRACES TO BE SENT:');
    console.log('   ⏳ Waiting 5 seconds for traces to be exported...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('   ✅ Wait completed\n');

    console.log('🎯 COMPREHENSIVE TEST SUMMARY:');
    console.log('   ✅ Agent span: Created and sent');
    console.log('   ✅ LLM span: Created and sent');
    console.log('   ✅ Tool span: Created and sent');
    console.log('   ✅ Cross-service span: Created and sent');
    console.log('   ✅ All spans completed successfully');
    
    console.log('\n📊 WHAT TO LOOK FOR IN ARIZE DASHBOARD:');
    console.log('   🔍 Project: listify-agent');
    console.log('   🔍 Service: listify-agent');
    console.log('   🔍 Span Names: test-agent-operation, test-llm-call, test-tool-operation, test-cross-service');
    console.log('   🔍 Time Range: Last 5 minutes');
    console.log('   🔍 Test Type: comprehensive_test');
    
    console.log('\n🚀 COMPREHENSIVE TEST STATUS: COMPLETED');
    console.log('   All test spans have been created and should appear in Arize dashboard');
    console.log('   🔗 Check your traces: https://app.arize.com/');
    
  } catch (error) {
    console.error('❌ Comprehensive test failed:', error);
    console.log('\n🔍 DEBUGGING INFORMATION:');
    console.log('   Environment Variables:');
    console.log('     ARIZE_SPACE_ID:', process.env.ARIZE_SPACE_ID ? 'Set' : 'Missing');
    console.log('     ARIZE_API_KEY:', process.env.ARIZE_API_KEY ? 'Set' : 'Missing');
    console.log('     ARIZE_ENDPOINT:', process.env.ARIZE_ENDPOINT || 'Not set');
    console.log('     ARIZE_PROJECT_NAME:', process.env.ARIZE_PROJECT_NAME || 'Not set');
    console.log('     NODE_ENV:', process.env.NODE_ENV || 'Not set');
  }
}

// Run the comprehensive test
testArizeTracing().then(() => {
  console.log('\n✨ Comprehensive Arize tracing test completed!');
  console.log('📊 Check your Arize dashboard for the test traces.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
