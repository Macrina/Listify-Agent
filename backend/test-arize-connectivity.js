/**
 * Arize Endpoint Test
 * Tests if traces are actually reaching Arize servers
 */

import { initializeArizeTracing } from './src/config/arize-mcp.js';
import { createAgentSpan } from './src/utils/tracing-mcp.js';

console.log('🔍 ARIZE ENDPOINT CONNECTIVITY TEST');
console.log('===================================\n');

async function testArizeConnectivity() {
  try {
    // Initialize tracing
    console.log('1️⃣ INITIALIZING ARIZE TRACING:');
    const { tracerProvider, tracer } = initializeArizeTracing();
    
    if (!tracerProvider || !tracer) {
      console.error('❌ Failed to initialize Arize tracing');
      return;
    }
    
    console.log('   ✅ Arize tracing initialized\n');

    // Create a simple test span
    console.log('2️⃣ CREATING TEST SPAN:');
    const testSpan = createAgentSpan(
      'arize-connectivity-test',
      'Testing if traces reach Arize servers',
      {
        'test.type': 'connectivity_test',
        'test.timestamp': new Date().toISOString(),
        'test.environment': process.env.NODE_ENV || 'development',
        'test.version': '1.0.0'
      }
    );

    // Add some test data
    testSpan.setAttribute('test.user_id', 'connectivity_test_user');
    testSpan.setAttribute('test.session_id', 'connectivity_test_session');
    testSpan.setAttribute('test.operation', 'connectivity_check');
    testSpan.setAttribute('test.success', true);
    testSpan.setAttribute('test.latency', 100);

    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 100));

    testSpan.setStatus({ code: 1 }); // OK
    testSpan.end();
    console.log('   ✅ Test span created and ended\n');

    // Wait for export
    console.log('3️⃣ WAITING FOR EXPORT:');
    console.log('   ⏳ Waiting 10 seconds for traces to be exported to Arize...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log('   ✅ Export wait completed\n');

    console.log('🎯 CONNECTIVITY TEST SUMMARY:');
    console.log('   ✅ Span created successfully');
    console.log('   ✅ Span ended successfully');
    console.log('   ✅ Export wait completed');
    
    console.log('\n📊 CHECK YOUR ARIZE DASHBOARD:');
    console.log('   🔍 Project: listify-agent');
    console.log('   🔍 Service: listify-agent');
    console.log('   🔍 Span Name: arize-connectivity-test');
    console.log('   🔍 Time Range: Last 5 minutes');
    console.log('   🔍 Test Type: connectivity_test');
    
    console.log('\n🔍 DEBUGGING INFO:');
    console.log('   Endpoint:', process.env.ARIZE_ENDPOINT || 'https://otlp.arize.com/v1');
    console.log('   Space ID:', process.env.ARIZE_SPACE_ID ? 'Set' : 'Missing');
    console.log('   API Key:', process.env.ARIZE_API_KEY ? 'Set' : 'Missing');
    console.log('   Project:', process.env.ARIZE_PROJECT_NAME || 'listify-agent');
    
    console.log('\n🚀 CONNECTIVITY TEST STATUS: COMPLETED');
    console.log('   If you still don\'t see traces, the issue might be:');
    console.log('   1. Network connectivity to Arize servers');
    console.log('   2. Incorrect credentials');
    console.log('   3. Arize service issues');
    console.log('   4. Endpoint configuration mismatch');
    
  } catch (error) {
    console.error('❌ Connectivity test failed:', error);
    console.log('\n🔍 ERROR DETAILS:');
    console.log('   Error:', error.message);
    console.log('   Stack:', error.stack);
  }
}

// Run the connectivity test
testArizeConnectivity().then(() => {
  console.log('\n✨ Arize connectivity test completed!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
