/**
 * Arize Tracing Configuration - Official Implementation
 * Following the exact setup from: https://arize.com/docs/ax/observe/tracing/set-up-tracing
 */

import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-base";
import {
  NodeTracerProvider,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-node";
import { Resource } from "@opentelemetry/resources";
import { 
  OTLPTraceExporter as GrpcOTLPTraceExporter 
} from "@opentelemetry/exporter-trace-otlp-grpc"; // Arize specific
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { Metadata } from "@grpc/grpc-js";
import dotenv from 'dotenv';

dotenv.config();

// For troubleshooting, set the log level to DiagLogLevel.DEBUG
if (process.env.NODE_ENV === 'development' || process.env.ARIZE_DEBUG === 'true') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}

// Arize specific - Create metadata and add your headers
const metadata = new Metadata();

// Your Arize Space and API Keys, which can be found in the UI
const spaceId = process.env.ARIZE_SPACE_ID;
const apiKey = process.env.ARIZE_API_KEY;
const modelId = process.env.ARIZE_MODEL_ID || 'listify-agent-model';
const modelVersion = process.env.ARIZE_MODEL_VERSION || 'v1.0.0';

if (!spaceId || !apiKey) {
  console.warn('⚠️  ARIZE_SPACE_ID or ARIZE_API_KEY not set - tracing will be disabled');
  console.log('🔧 Arize Config Check:', {
    spaceId: spaceId ? '✅ Set' : '❌ Missing',
    apiKey: apiKey ? '✅ Set' : '❌ Missing',
    modelId: modelId,
    modelVersion: modelVersion
  });
}

// Set metadata headers as per official documentation
metadata.set('space_id', spaceId);
metadata.set('api_key', apiKey);

const provider = new NodeTracerProvider({
  resource: new Resource({
    // Arize specific - The name of a new or preexisting model you 
    // want to export spans to
    "model_id": modelId,
    "model_version": modelVersion
  }),
});

// Add console exporter for debugging
provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));

// Add Arize exporter as per official documentation
provider.addSpanProcessor(
  new SimpleSpanProcessor(
    new GrpcOTLPTraceExporter({
      url: "https://otlp.arize.com/v1",
      metadata,
    }),
  ),
);

// Register the provider
provider.register();

// Export the tracer for use in the application
export const tracer = provider.getTracer('listify-agent', modelVersion);
export const tracerProvider = provider;

console.log('✅ Arize tracing initialized following official documentation');
console.log(`📊 Sending traces to: https://otlp.arize.com/v1`);
console.log(`🏷️  Model: ${modelId} v${modelVersion}`);
console.log(`📡 Space ID: ${spaceId ? 'Set' : 'Missing'}`);
console.log(`🔑 API Key: ${apiKey ? 'Set' : 'Missing'}`);

// Initialize function for compatibility
export const initializeArizeTracing = () => {
  return { tracerProvider: provider, tracer };
};

export const getTracerProvider = () => provider;
export const getTracer = () => tracer;
