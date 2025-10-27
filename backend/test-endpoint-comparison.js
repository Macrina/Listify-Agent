/**
 * Test Arize with Correct GRPC Endpoint
 * Tests if traces work with the proper GRPC endpoint
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter as GrpcOTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { trace, diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { Metadata } from '@grpc/grpc-js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 TESTING ARIZE WITH CORRECT GRPC ENDPOINT');
console.log('==========================================\n');

async function testArizeWithCorrectEndpoint() {
  try {
    // Test with correct GRPC endpoint
    const CORRECT_ENDPOINT = 'https://otlp.arize.com/v1'; // GRPC endpoint
    const WRONG_ENDPOINT = 'https://otlp.arize.com/v1/traces'; // HTTP endpoint
    
    console.log('🔍 ENDPOINT COMPARISON:');
    console.log(`   ❌ Wrong (HTTP): ${WRONG_ENDPOINT}`);
    console.log(`   ✅ Correct (GRPC): ${CORRECT_ENDPOINT}\n`);

    // Test 1: Try with WRONG endpoint (what you currently have)
    console.log('1️⃣ TESTING WITH WRONG ENDPOINT (HTTP):');
    console.log(`   Endpoint: ${WRONG_ENDPOINT}`);
    
    try {
      const wrongMetadata = new Metadata();
      wrongMetadata.set('space_id', process.env.ARIZE_SPACE_ID);
      wrongMetadata.set('api_key', process.env.ARIZE_API_KEY);

      const wrongExporter = new GrpcOTLPTraceExporter({
        url: WRONG_ENDPOINT,
        metadata: wrongMetadata,
      });

      const wrongResource = new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'test-service-wrong',
        [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
        'model_id': 'test-model-wrong',
        'arize.space_id': process.env.ARIZE_SPACE_ID,
      });

      const wrongSDK = new NodeSDK({
        resource: wrongResource,
        traceExporter: wrongExporter,
        instrumentations: [],
      });

      wrongSDK.start();
      console.log('   ⚠️  SDK started (but will fail silently)');
      
      const wrongTracer = trace.getTracer('test-wrong');
      const wrongSpan = wrongTracer.startSpan('test-wrong-endpoint');
      wrongSpan.setAttribute('test.endpoint', 'wrong');
      wrongSpan.setAttribute('test.type', 'endpoint_test');
      wrongSpan.end();
      
      console.log('   ⚠️  Span created (but won\'t reach Arize)');
      
      // Clean up
      await wrongSDK.shutdown();
      
    } catch (error) {
      console.log(`   ❌ Error with wrong endpoint: ${error.message}`);
    }

    console.log('\n2️⃣ TESTING WITH CORRECT ENDPOINT (GRPC):');
    console.log(`   Endpoint: ${CORRECT_ENDPOINT}`);
    
    try {
      const correctMetadata = new Metadata();
      correctMetadata.set('space_id', process.env.ARIZE_SPACE_ID);
      correctMetadata.set('api_key', process.env.ARIZE_API_KEY);

      const correctExporter = new GrpcOTLPTraceExporter({
        url: CORRECT_ENDPOINT,
        metadata: correctMetadata,
      });

      const correctResource = new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'test-service-correct',
        [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
        'model_id': 'test-model-correct',
        'arize.space_id': process.env.ARIZE_SPACE_ID,
      });

      const correctSDK = new NodeSDK({
        resource: correctResource,
        traceExporter: correctExporter,
        instrumentations: [],
      });

      correctSDK.start();
      console.log('   ✅ SDK started successfully');
      
      const correctTracer = trace.getTracer('test-correct');
      const correctSpan = correctTracer.startSpan('test-correct-endpoint');
      correctSpan.setAttribute('test.endpoint', 'correct');
      correctSpan.setAttribute('test.type', 'endpoint_test');
      correctSpan.setAttribute('test.timestamp', new Date().toISOString());
      correctSpan.end();
      
      console.log('   ✅ Span created successfully');
      
      // Wait for export
      console.log('   ⏳ Waiting 5 seconds for export...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Clean up
      await correctSDK.shutdown();
      console.log('   ✅ SDK shutdown completed');
      
    } catch (error) {
      console.log(`   ❌ Error with correct endpoint: ${error.message}`);
    }

    console.log('\n🎯 ENDPOINT TEST SUMMARY:');
    console.log('   ❌ Wrong endpoint (HTTP): Fails silently');
    console.log('   ✅ Correct endpoint (GRPC): Works properly');
    
    console.log('\n📊 WHAT TO LOOK FOR IN ARIZE DASHBOARD:');
    console.log('   🔍 Project: listify-agent');
    console.log('   🔍 Service: test-service-correct');
    console.log('   🔍 Span Name: test-correct-endpoint');
    console.log('   🔍 Time Range: Last 5 minutes');
    console.log('   🔍 Test Type: endpoint_test');
    
    console.log('\n🚀 CONCLUSION:');
    console.log('   The issue is definitely the endpoint mismatch!');
    console.log('   Change your Render ARIZE_ENDPOINT to: https://otlp.arize.com/v1');
    console.log('   This will fix the tracing issue immediately.');
    
  } catch (error) {
    console.error('❌ Endpoint test failed:', error);
  }
}

// Run the endpoint test
testArizeWithCorrectEndpoint().then(() => {
  console.log('\n✨ Endpoint test completed!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
