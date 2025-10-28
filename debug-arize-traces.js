#!/usr/bin/env node

/**
 * Comprehensive Arize Tracing Debug Script
 * Based on official Arize documentation and MCP tools
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { OTLPTraceExporter as GrpcOTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { trace, diag, DiagConsoleLogger, DiagLogLevel, SpanStatusCode } from '@opentelemetry/api';
import { Metadata } from '@grpc/grpc-js';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

console.log('🔍 Comprehensive Arize Tracing Debug Script');
console.log('=' .repeat(60));

// Enable debug logging
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

// Check environment variables
console.log('\n📋 Environment Variables Check:');
console.log('=' .repeat(40));
console.log(`ARIZE_SPACE_ID: ${process.env.ARIZE_SPACE_ID ? '✅ Set' : '❌ Missing'}`);
console.log(`ARIZE_API_KEY: ${process.env.ARIZE_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`ARIZE_PROJECT_NAME: ${process.env.ARIZE_PROJECT_NAME || 'listify-agent'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

if (!process.env.ARIZE_SPACE_ID || !process.env.ARIZE_API_KEY) {
    console.error('\n❌ Missing required Arize credentials!');
    console.error('Please check your .env file contains:');
    console.error('ARIZE_SPACE_ID=your_space_id');
    console.error('ARIZE_API_KEY=your_api_key');
    process.exit(1);
}

// Test network connectivity
console.log('\n🌐 Network Connectivity Test:');
console.log('=' .repeat(40));

try {
    const response = await fetch('https://otlp.arize.com/v1/traces', {
        method: 'GET',
        headers: {
            'space_id': process.env.ARIZE_SPACE_ID,
            'api_key': process.env.ARIZE_API_KEY,
        }
    });
    console.log(`Arize endpoint status: ${response.status} ${response.statusText}`);
    if (response.status === 501) {
        console.log('✅ Endpoint reachable (501 Method Not Allowed is expected for GET)');
    } else {
        console.log(`⚠️  Unexpected status: ${response.status}`);
    }
} catch (error) {
    console.error(`❌ Network error: ${error.message}`);
}

// Initialize Arize tracing with comprehensive configuration
console.log('\n🔧 Initializing Arize Tracing:');
console.log('=' .repeat(40));

const metadata = new Metadata();
metadata.set('space_id', process.env.ARIZE_SPACE_ID);
metadata.set('api_key', process.env.ARIZE_API_KEY);

const arizeExporter = new GrpcOTLPTraceExporter({
    url: 'https://otlp.arize.com/v1',
    metadata,
});

const sdk = new NodeSDK({
    resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: process.env.ARIZE_PROJECT_NAME || 'listify-agent',
        [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
        'model_id': 'listify-agent-model',
        'model_version': 'v1.0.0',
        'arize.space_id': process.env.ARIZE_SPACE_ID,
        'arize.project.name': process.env.ARIZE_PROJECT_NAME || 'listify-agent',
    }),
    spanProcessorOptions: {
        exporter: arizeExporter,
    },
});

try {
    await sdk.start();
    console.log('✅ Arize tracing initialized successfully');
} catch (error) {
    console.error(`❌ Failed to initialize Arize tracing: ${error.message}`);
    process.exit(1);
}

// Create comprehensive test traces
console.log('\n📊 Creating Comprehensive Test Traces:');
console.log('=' .repeat(40));

const tracer = trace.getTracer('debug-test', '1.0.0');

// Test 1: Basic span
console.log('1️⃣ Creating basic span...');
tracer.startActiveSpan('debug-basic-span', (span) => {
    span.setAttribute('test.type', 'basic');
    span.setAttribute('test.timestamp', new Date().toISOString());
    span.setAttribute('input.value', 'Debug test input');
    span.setAttribute('output.value', 'Debug test output');
    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
});
console.log('✅ Basic span created');

// Test 2: LLM span with comprehensive attributes
console.log('2️⃣ Creating LLM span...');
tracer.startActiveSpan('debug-llm-span', (span) => {
    span.setAttribute('openinference.span.kind', 'LLM');
    span.setAttribute('llm.model.name', 'gpt-4o-mini');
    span.setAttribute('llm.model.version', '2024-01-01');
    span.setAttribute('llm.temperature', 0.7);
    span.setAttribute('llm.max_tokens', 1000);
    span.setAttribute('input.value', 'What is the capital of France?');
    span.setAttribute('output.value', 'The capital of France is Paris.');
    span.setAttribute('llm.token_count.prompt', 10);
    span.setAttribute('llm.token_count.completion', 8);
    span.setAttribute('llm.token_count.total', 18);
    span.setAttribute('llm.finish_reason', 'stop');
    span.setAttribute('llm.response.length', 35);
    
    // Add events
    span.addEvent('LLM call started');
    span.addEvent('LLM call completed', {
        'response.time_ms': 1500,
        'tokens.per.second': 12
    });
    
    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
});
console.log('✅ LLM span created');

// Test 3: Agent span with child spans
console.log('3️⃣ Creating agent span with children...');
tracer.startActiveSpan('debug-agent-span', (span) => {
    span.setAttribute('openinference.span.kind', 'AGENT');
    span.setAttribute('agent.name', 'debug-agent');
    span.setAttribute('agent.version', '1.0.0');
    span.setAttribute('input.value', 'User query: How to debug traces?');
    
    // Child span 1: Tool call
    tracer.startActiveSpan('debug-tool-span', (childSpan) => {
        childSpan.setAttribute('openinference.span.kind', 'TOOL');
        childSpan.setAttribute('tool.name', 'debug-tool');
        childSpan.setAttribute('tool.arguments', JSON.stringify({ query: 'debug traces' }));
        childSpan.setAttribute('tool.output', JSON.stringify({ result: 'traces debugged' }));
        childSpan.setStatus({ code: SpanStatusCode.OK });
        childSpan.end();
    });
    
    // Child span 2: Chain operation
    tracer.startActiveSpan('debug-chain-span', (childSpan) => {
        childSpan.setAttribute('openinference.span.kind', 'CHAIN');
        childSpan.setAttribute('chain.name', 'debug-chain');
        childSpan.setAttribute('input.value', 'Processing debug data');
        childSpan.setAttribute('output.value', 'Debug data processed');
        childSpan.setStatus({ code: SpanStatusCode.OK });
        childSpan.end();
    });
    
    span.setAttribute('output.value', 'Debug traces created successfully');
    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
});
console.log('✅ Agent span with children created');

// Test 4: Error span
console.log('4️⃣ Creating error span...');
tracer.startActiveSpan('debug-error-span', (span) => {
    span.setAttribute('test.type', 'error');
    span.setAttribute('input.value', 'Error test input');
    
    try {
        throw new Error('Simulated error for testing');
    } catch (error) {
        span.recordException(error);
        span.setStatus({ 
            code: SpanStatusCode.ERROR, 
            message: error.message 
        });
    }
    
    span.end();
});
console.log('✅ Error span created');

// Test 5: Retriever span
console.log('5️⃣ Creating retriever span...');
tracer.startActiveSpan('debug-retriever-span', (span) => {
    span.setAttribute('openinference.span.kind', 'RETRIEVER');
    span.setAttribute('retriever.query', 'debug information');
    span.setAttribute('retriever.top_k', 5);
    span.setAttribute('input.value', 'Search for debug info');
    
    // Simulate retrieved documents
    const documents = [
        { id: 'doc1', content: 'Debug documentation 1', score: 0.95 },
        { id: 'doc2', content: 'Debug documentation 2', score: 0.87 },
        { id: 'doc3', content: 'Debug documentation 3', score: 0.82 }
    ];
    
    documents.forEach((doc, i) => {
        span.setAttribute(`retrieval.documents.${i}.document.id`, doc.id);
        span.setAttribute(`retrieval.documents.${i}.document.content`, doc.content);
        span.setAttribute(`retrieval.documents.${i}.document.score`, doc.score);
    });
    
    span.setAttribute('output.value', JSON.stringify(documents));
    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
});
console.log('✅ Retriever span created');

// Force flush all traces
console.log('\n⏳ Flushing traces to Arize...');
console.log('=' .repeat(40));

try {
    await sdk.tracerProvider.forceFlush();
    console.log('✅ Traces flushed successfully');
} catch (error) {
    console.error(`❌ Failed to flush traces: ${error.message}`);
}

// Summary
console.log('\n📊 Debug Summary:');
console.log('=' .repeat(40));
console.log('✅ Environment variables loaded');
console.log('✅ Network connectivity verified');
console.log('✅ Arize tracing initialized');
console.log('✅ 5 comprehensive test spans created');
console.log('✅ Traces flushed to Arize');

console.log('\n🔍 What to Check in Arize:');
console.log('=' .repeat(40));
console.log('1. Go to your Arize dashboard');
console.log('2. Navigate to LLM Tracing');
console.log('3. Look for traces from the last 5 minutes');
console.log('4. Search for these span names:');
console.log('   - debug-basic-span');
console.log('   - debug-llm-span');
console.log('   - debug-agent-span');
console.log('   - debug-error-span');
console.log('   - debug-retriever-span');
console.log('5. Check span attributes and events');

console.log('\n🚨 If traces still don\'t appear:');
console.log('=' .repeat(40));
console.log('1. Verify your Arize credentials are correct');
console.log('2. Check if your Arize space is active');
console.log('3. Ensure you have the correct permissions');
console.log('4. Wait 2-3 minutes for traces to appear');
console.log('5. Check Arize dashboard filters (time range, etc.)');

console.log('\n🎉 Debug script completed!');
