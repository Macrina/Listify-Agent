/**
 * Deep Arize Troubleshooting
 * Comprehensive check of all possible issues
 */

import { initializeArizeTracing } from './src/config/arize-mcp.js';
import { createAgentSpan } from './src/utils/tracing-mcp.js';

console.log('🔍 DEEP ARIZE TROUBLESHOOTING');
console.log('============================\n');

async function deepTroubleshoot() {
  try {
    // Step 1: Check all environment variables
    console.log('1️⃣ ENVIRONMENT VARIABLES CHECK:');
    console.log(`   ARIZE_SPACE_ID: ${process.env.ARIZE_SPACE_ID ? '✅ Set (' + process.env.ARIZE_SPACE_ID.substring(0, 20) + '...)' : '❌ Missing'}`);
    console.log(`   ARIZE_API_KEY: ${process.env.ARIZE_API_KEY ? '✅ Set (' + process.env.ARIZE_API_KEY.substring(0, 20) + '...)' : '❌ Missing'}`);
    console.log(`   ARIZE_ENDPOINT: ${process.env.ARIZE_ENDPOINT || '❌ Not set'}`);
    console.log(`   ARIZE_PROJECT_NAME: ${process.env.ARIZE_PROJECT_NAME || '❌ Not set'}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || '❌ Not set'}\n`);

    // Step 2: Test initialization
    console.log('2️⃣ INITIALIZATION TEST:');
    const { tracerProvider, tracer } = initializeArizeTracing();
    
    if (!tracerProvider || !tracer) {
      console.log('   ❌ Initialization failed');
      console.log('   🔍 Possible causes:');
      console.log('      - Missing ARIZE_SPACE_ID');
      console.log('      - Missing ARIZE_API_KEY');
      console.log('      - Invalid credentials');
      return;
    }
    
    console.log('   ✅ Initialization successful\n');

    // Step 3: Create test span with detailed attributes
    console.log('3️⃣ CREATING DETAILED TEST SPAN:');
    const testSpan = createAgentSpan(
      'deep-troubleshoot-test',
      'Comprehensive troubleshooting test',
      {
        'test.type': 'deep_troubleshoot',
        'test.timestamp': new Date().toISOString(),
        'test.environment': process.env.NODE_ENV || 'development',
        'test.version': '1.0.0',
        'test.endpoint': process.env.ARIZE_ENDPOINT || 'not_set',
        'test.space_id': process.env.ARIZE_SPACE_ID ? 'set' : 'missing',
        'test.api_key': process.env.ARIZE_API_KEY ? 'set' : 'missing'
      }
    );

    // Add comprehensive attributes
    testSpan.setAttribute('test.user_id', 'troubleshoot_user');
    testSpan.setAttribute('test.session_id', 'troubleshoot_session');
    testSpan.setAttribute('test.operation', 'deep_troubleshoot');
    testSpan.setAttribute('test.success', true);
    testSpan.setAttribute('test.latency', 100);
    testSpan.setAttribute('test.memory_usage', process.memoryUsage().heapUsed);
    testSpan.setAttribute('test.platform', process.platform);
    testSpan.setAttribute('test.node_version', process.version);
    testSpan.setAttribute('test.arch', process.arch);

    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 200));

    testSpan.setStatus({ code: 1 }); // OK
    testSpan.end();
    console.log('   ✅ Detailed test span created and ended\n');

    // Step 4: Wait longer for export
    console.log('4️⃣ EXTENDED EXPORT WAIT:');
    console.log('   ⏳ Waiting 15 seconds for traces to be exported...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    console.log('   ✅ Extended wait completed\n');

    // Step 5: Check Arize dashboard instructions
    console.log('5️⃣ ARIZE DASHBOARD CHECKLIST:');
    console.log('   🔍 Go to: https://app.arize.com/');
    console.log('   🔍 Project: listify-agent');
    console.log('   🔍 Service: listify-agent');
    console.log('   🔍 Span Name: deep-troubleshoot-test');
    console.log('   🔍 Time Range: Last 10 minutes');
    console.log('   🔍 Test Type: deep_troubleshoot\n');

    // Step 6: Additional troubleshooting steps
    console.log('6️⃣ ADDITIONAL TROUBLESHOOTING STEPS:');
    console.log('   📊 Check Render logs for:');
    console.log('      - "✅ Arize tracing initialized successfully"');
    console.log('      - Any error messages');
    console.log('      - Network connectivity issues\n');
    
    console.log('   🔍 Verify in Arize dashboard:');
    console.log('      - Correct project selected');
    console.log('      - Time range includes last 10 minutes');
    console.log('      - No filters applied');
    console.log('      - Service name: listify-agent\n');
    
    console.log('   🚨 Common issues:');
    console.log('      - Wrong project selected in dashboard');
    console.log('      - Time range too narrow');
    console.log('      - Filters hiding traces');
    console.log('      - Network connectivity issues');
    console.log('      - Arize service downtime\n');

    console.log('🎯 TROUBLESHOOTING SUMMARY:');
    console.log('   ✅ Environment variables checked');
    console.log('   ✅ Initialization tested');
    console.log('   ✅ Detailed span created');
    console.log('   ✅ Extended wait completed');
    console.log('   ✅ Dashboard instructions provided');
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('   1. Check Render logs for initialization messages');
    console.log('   2. Verify correct project in Arize dashboard');
    console.log('   3. Check time range (last 10 minutes)');
    console.log('   4. Remove any filters in dashboard');
    console.log('   5. Look for span: deep-troubleshoot-test');
    
  } catch (error) {
    console.error('❌ Deep troubleshooting failed:', error);
    console.log('\n🔍 ERROR DETAILS:');
    console.log('   Error:', error.message);
    console.log('   Stack:', error.stack);
  }
}

// Run deep troubleshooting
deepTroubleshoot().then(() => {
  console.log('\n✨ Deep troubleshooting completed!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Troubleshooting failed:', error);
  process.exit(1);
});
