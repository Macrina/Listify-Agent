/**
 * Arize Tracing Configuration for Node.js
 * 
 * This module implements the exact approach from Arize documentation
 * Using the recommended Node.js/TypeScript setup
 */

import { NodeSDK } from "@opentelemetry/sdk-node";
import { Resource } from "@opentelemetry/resources";
import { SEMRESATTRS_PROJECT_NAME } from "@arizeai/openinference-semantic-conventions";
import { OTLPTraceExporter as GrpcOTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { diag, DiagConsoleLogger, DiagLogLevel, trace } from "@opentelemetry/api";
import { Metadata } from "@grpc/grpc-js";
// OpenAI auto-instrumentation disabled due to ESM module resolution bug
// The instrumentation package cannot import APIPromise from openai even though it exists
// We use manual LLM spans instead which have all required attributes
// import { OpenAIInstrumentation } from "@arizeai/openinference-instrumentation-openai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the backend directory
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

// Enable debug logging in development
if (process.env.NODE_ENV === 'development' && process.env.ARIZE_DEBUG === 'true') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}

const ARIZE_CONFIG = {
  spaceId: process.env.ARIZE_SPACE_ID,
  apiKey: process.env.ARIZE_API_KEY,
  projectName: process.env.ARIZE_PROJECT_NAME || 'listify-agent',
  modelId: process.env.ARIZE_MODEL_ID || 'listify-agent-model',
  modelVersion: process.env.ARIZE_MODEL_VERSION || 'v1.0.0',
  environment: process.env.NODE_ENV || 'development'
};

const validateArizeConfig = () => {
  if (!ARIZE_CONFIG.spaceId || !ARIZE_CONFIG.apiKey) {
    console.warn('⚠️  ARIZE_SPACE_ID or ARIZE_API_KEY not set - tracing will be disabled');
    return false;
  }
  return true;
};

let sdk = null;
let spanProcessor = null; // Store for manual flushing

// Function to register the Arize TracerProvider (exact approach from documentation)
const register = ({ space_id, api_key, project_name }) => {
  console.log('🔧 Registering Arize TracerProvider...');
  
  // Create metadata for Arize authentication
  const metadata = new Metadata();
  metadata.set('space_id', space_id);
  metadata.set('api_key', api_key);

  // Create Arize OTLP gRPC exporter
  const arizeExporter = new GrpcOTLPTraceExporter({
    url: "https://otlp.arize.com/v1",
    metadata,
  });

  // Create explicit BatchSpanProcessor with export timeout
  // Use shorter delay for faster export in development
  spanProcessor = new BatchSpanProcessor(arizeExporter, {
    maxQueueSize: 2048,
    maxExportBatchSize: 512,
    exportTimeoutMillis: 30000,
    scheduledDelayMillis: 2000, // Export every 2 seconds instead of 5
  });

  // Create SDK with Arize-specific resource attributes and auto-instrumentations
  sdk = new NodeSDK({
    resource: new Resource({
      [SEMRESATTRS_PROJECT_NAME]: project_name,
      "model_id": project_name,
      "model_version": "v1.0.0",
      "service.name": "listify-agent",
      "service.version": "1.0.0",
      "service.instance.id": os.hostname(), // Machine identifier
      "deployment.environment": process.env.NODE_ENV || 'development',
      "deployment.region": process.env.DEPLOY_REGION || 'local',
      "deployment.version": process.env.DEPLOY_VERSION || '1.0.0',
      "host.name": os.hostname(),
      "host.type": os.type(),
      "host.arch": os.arch(),
    }),
    instrumentations: [
      // Auto-instrumentations for HTTP, Express, Fetch, etc.
      getNodeAutoInstrumentations({
        // Enable HTTP/HTTPS instrumentation for Express routes
        '@opentelemetry/instrumentation-http': {
          enabled: true,
        },
        // Enable Express instrumentation
        '@opentelemetry/instrumentation-express': {
          enabled: true,
        },
        // Enable fetch instrumentation for node-fetch
        '@opentelemetry/instrumentation-fetch': {
          enabled: true,
        },
      }),
      // OpenAI auto-instrumentation disabled - ESM module resolution issue with APIPromise
      // Manual LLM spans in imageAnalysisService.js have all required OpenInference attributes
      // new OpenAIInstrumentation(), // Disabled: cannot import APIPromise in ESM context
    ],
    spanProcessor: spanProcessor,
  });

  // Start the SDK
  sdk.start();
  console.log("📡 OpenTelemetry initialized - sending traces to Arize");
  console.log("✅ Auto-instrumentations enabled: HTTP, Express, Fetch");
  console.log("✅ Manual LLM spans created in imageAnalysisService.js with token counts and costs");
  
  return sdk;
};

export const initializeArizeTracing = () => {
  if (!validateArizeConfig()) {
    console.log('🔧 Arize tracing disabled - missing credentials');
    return { tracerProvider: null, tracer: null };
  }

  try {
    console.log('🔧 Initializing Arize tracing for Node.js...');
    console.log(`📡 Space ID: ${ARIZE_CONFIG.spaceId}`);
    console.log(`🏷️  Project: ${ARIZE_CONFIG.projectName}`);
    console.log(`🤖 Model: ${ARIZE_CONFIG.modelId} v${ARIZE_CONFIG.modelVersion}`);

    // Use the exact register function from Arize documentation
    sdk = register({
      space_id: ARIZE_CONFIG.spaceId,
      api_key: ARIZE_CONFIG.apiKey,
      project_name: ARIZE_CONFIG.projectName,
    });

    // Get the tracer provider from the global trace API
    const tracerProvider = trace.getTracerProvider();
    console.log(`✅ Arize instrumented for Node.js. Project: ${ARIZE_CONFIG.projectName}`);
    return { tracerProvider, tracer: null };

  } catch (error) {
    console.error('❌ Failed to initialize Arize tracing:', error.message);
    return { tracerProvider: null, tracer: null };
  }
};

export const getTracerProvider = () => sdk?.tracerProvider || trace.getTracerProvider();
export const getTracer = () => null; // Will be obtained from tracerProvider when needed
export const getArizeConfig = () => ARIZE_CONFIG;

// Force flush all pending spans to export immediately
export const flushTraces = async () => {
  try {
    // Directly flush the span processor if available
    if (spanProcessor && typeof spanProcessor.forceFlush === 'function') {
      await spanProcessor.forceFlush();
      console.log('✅ Traces flushed to Arize (via spanProcessor)');
      return true;
    }
    
    // Fallback: Use SDK's forceFlush method if available
    if (sdk && typeof sdk.forceFlush === 'function') {
      await sdk.forceFlush();
      console.log('✅ Traces flushed to Arize (via SDK)');
      return true;
    }
    
    // Fallback: Get tracer provider and try to flush
    const tracerProvider = trace.getTracerProvider();
    if (tracerProvider && typeof tracerProvider.forceFlush === 'function') {
      await tracerProvider.forceFlush();
      console.log('✅ Traces flushed to Arize (via tracerProvider)');
      return true;
    }
    
    // If no flush method available, spans will be exported automatically by BatchSpanProcessor
    // (every scheduledDelayMillis or when batch is full)
    console.log('ℹ️  Traces will be auto-exported by BatchSpanProcessor');
    return true;
  } catch (error) {
    console.error('❌ Failed to flush traces:', error.message);
    return false;
  }
};

// Shutdown the SDK gracefully
export const shutdownTracing = async () => {
  if (sdk) {
    try {
      await sdk.shutdown();
      console.log('✅ Arize tracing shut down gracefully');
    } catch (error) {
      console.error('❌ Failed to shutdown tracing:', error.message);
    }
  }
};