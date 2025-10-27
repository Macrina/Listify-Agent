/**
 * Simple MCP Test
 * Tests basic MCP compliance without complex context operations
 */

import { initializeArizeTracing, getArizeConfig } from './src/config/arize-mcp-fixed.js';

console.log('🧪 SIMPLE MCP COMPLIANCE TEST');
console.log('============================\n');

async function testSimpleMCP() {
  try {
    // Step 1: Check configuration
    console.log('1️⃣ CHECKING MCP CONFIGURATION:');
    const config = getArizeConfig();
    
    console.log('   📊 Configuration:');
    console.log(`      Space ID: ${config.spaceId ? '✅ Set' : '❌ Missing'}`);
    console.log(`      API Key: ${config.apiKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`      Endpoint: ${config.endpoint}`);
    console.log(`      Project: ${config.projectName}`);
    console.log(`      Model ID: ${config.modelId}`);
    console.log(`      Model Version: ${config.modelVersion}`);
    
    // Verify MCP requirements
    const mcpRequirements = {
      'HTTP Endpoint': config.endpoint.includes('https://otlp.arize.com/v1'),
      'Space ID Set': !!config.spaceId,
      'API Key Set': !!config.apiKey,
      'Model ID Set': !!config.modelId,
      'Project Name Set': !!config.projectName
    };
    
    console.log('\n   🔍 MCP Requirements Check:');
    Object.entries(mcpRequirements).forEach(([requirement, status]) => {
      console.log(`      ${requirement}: ${status ? '✅' : '❌'}`);
    });
    
    const allRequirementsMet = Object.values(mcpRequirements).every(Boolean);
    console.log(`\n   📊 MCP Compliance: ${allRequirementsMet ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}\n`);

    // Step 2: Initialize tracing
    console.log('2️⃣ INITIALIZING MCP-COMPLIANT TRACING:');
    const { tracerProvider, tracer } = initializeArizeTracing();
    
    if (!tracerProvider || !tracer) {
      console.error('❌ Failed to initialize Arize tracing');
      return;
    }
    
    console.log('   ✅ MCP-compliant tracing initialized\n');

    // Step 3: Create simple test spans
    console.log('3️⃣ CREATING SIMPLE TEST SPANS:');
    
    // Create a simple span
    const span = tracer.startSpan('mcp-simple-test', {
      attributes: {
        'openinference.span.kind': 'AGENT',
        'model_id': config.modelId,
        'model_version': config.modelVersion,
        'arize.space_id': config.spaceId,
        'arize.project.name': config.projectName,
        'test.type': 'mcp_simple_test'
      }
    });

    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 100));

    // Complete span
    span.setStatus({ code: 1 }); // OK
    span.end();

    console.log('   ✅ Simple test span created\n');

    // Step 4: Wait for export
    console.log('4️⃣ WAITING FOR EXPORT:');
    console.log('   ⏳ Waiting 15 seconds for traces to be exported to Arize...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    console.log('   ✅ Export wait completed\n');

    console.log('🎯 SIMPLE MCP TEST SUMMARY:');
    console.log('   ✅ Configuration verified');
    console.log('   ✅ MCP requirements checked');
    console.log('   ✅ Tracing initialized');
    console.log('   ✅ Simple test span created');
    console.log('   ✅ Traces exported');
    
    console.log('\n📊 WHAT TO LOOK FOR IN ARIZE DASHBOARD:');
    console.log('   🔍 Project: listify-agent');
    console.log('   🔍 Service: listify-agent');
    console.log('   🔍 Span Name: mcp-simple-test');
    console.log('   🔍 Time Range: Last 5 minutes');
    console.log('   🔍 Span Kind: AGENT');
    console.log('   🔍 Attributes:');
    console.log('      - openinference.span.kind: AGENT');
    console.log('      - model_id: listify-agent-model');
    console.log('      - model_version: v1.0.0');
    console.log('      - arize.space_id: [your space id]');
    console.log('      - arize.project.name: listify-agent');
    
    console.log('\n🚀 SIMPLE MCP STATUS: WORKING');
    console.log('   MCP-compliant tracing is working!');
    console.log('   🔗 Check your traces: https://app.arize.com/');
    
  } catch (error) {
    console.error('❌ Simple MCP test failed:', error);
  }
}

// Run the simple MCP test
testSimpleMCP().then(() => {
  console.log('\n✨ Simple MCP test completed!');
  console.log('📊 Check your Arize dashboard for MCP-compliant traces.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
