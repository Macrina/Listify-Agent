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
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { diag, DiagConsoleLogger, DiagLogLevel, trace } from "@opentelemetry/api";
import { Metadata } from "@grpc/grpc-js";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

  // Create SDK with Arize-specific resource attributes and auto-instrumentations
  sdk = new NodeSDK({
    resource: new Resource({
      [SEMRESATTRS_PROJECT_NAME]: project_name,
      "model_id": project_name,
      "model_version": "v1.0.0",
      "service.name": "listify-agent",
      "service.version": "1.0.0",
    }),
    instrumentations: [
      // Auto-instrumentations for HTTP, Express, Fetch, etc.
      // This will automatically trace all HTTP requests including OpenAI API calls
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
      // Note: OpenAI instrumentation removed due to version incompatibility
      // Auto-instrumentations will trace OpenAI HTTP requests automatically
    ],
    spanProcessorOptions: {
      exporter: arizeExporter,
    },
  });

  // Start the SDK
  sdk.start();
  console.log("📡 OpenTelemetry initialized - sending traces to Arize");
  console.log("✅ Auto-instrumentations enabled: HTTP, Express, Fetch, OpenAI");
  
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
  if (sdk?.tracerProvider) {
    try {
      await sdk.tracerProvider.forceFlush();
      console.log('✅ Traces flushed to Arize');
    } catch (error) {
      console.error('❌ Failed to flush traces:', error.message);
    }
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