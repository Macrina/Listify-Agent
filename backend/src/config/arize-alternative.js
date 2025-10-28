/**
 * Alternative Arize Tracing Configuration
 * This shows different approaches to configure the OTLP exporter
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter as GrpcOTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPTraceExporter as HttpOTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { trace, diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { Metadata } from '@grpc/grpc-js';
import dotenv from 'dotenv';

dotenv.config();

const ARIZE_CONFIG = {
  spaceId: process.env.ARIZE_SPACE_ID,
  apiKey: process.env.ARIZE_API_KEY,
  projectName: process.env.ARIZE_PROJECT_NAME || 'listify-agent',
  modelId: process.env.ARIZE_MODEL_ID || 'listify-agent-model',
  modelVersion: process.env.ARIZE_MODEL_VERSION || 'v1.0.0',
  endpoint: process.env.ARIZE_ENDPOINT || 'https://otlp.arize.com',
  environment: process.env.NODE_ENV || 'development'
};

// Option 1: HTTP OTLP Exporter (gives you full control over the path)
export const initializeArizeTracingHttp = () => {
  console.log('🔧 Initializing Arize tracing with HTTP OTLP exporter...');
  
  const metadata = new Metadata();
  metadata.set('space_id', ARIZE_CONFIG.spaceId);
  metadata.set('api_key', ARIZE_CONFIG.apiKey);

  // HTTP exporter allows custom path
  const httpExporter = new HttpOTLPTraceExporter({
    url: `${ARIZE_CONFIG.endpoint}/v1/traces`, // You control the full path
    headers: {
      'space_id': ARIZE_CONFIG.spaceId,
      'api_key': ARIZE_CONFIG.apiKey,
    },
  });

  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: ARIZE_CONFIG.projectName,
    [SemanticResourceAttributes.SERVICE_VERSION]: ARIZE_CONFIG.modelVersion,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: ARIZE_CONFIG.environment,
    'model_id': ARIZE_CONFIG.modelId,
    'model_version': ARIZE_CONFIG.modelVersion,
    'arize.space_id': ARIZE_CONFIG.spaceId,
    'arize.project.name': ARIZE_CONFIG.projectName,
  });

  const sdk = new NodeSDK({
    resource,
    traceExporter: httpExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: true },
        '@opentelemetry/instrumentation-http': {
          enabled: true,
          ignoreIncomingRequestHook: (req) => req.url?.includes('/health') || req.url?.includes('/api/health'),
        },
        '@opentelemetry/instrumentation-express': { enabled: true },
        '@opentelemetry/instrumentation-net': { enabled: true },
        '@opentelemetry/instrumentation-dns': { enabled: true },
      }),
    ],
  });

  sdk.start();
  console.log('✅ Arize tracing initialized with HTTP exporter');
  return { tracerProvider: trace.getTracerProvider(), tracer: trace.getTracer('listify-agent', ARIZE_CONFIG.modelVersion) };
};

// Option 2: Custom gRPC configuration with explicit path handling
export const initializeArizeTracingCustomGrpc = () => {
  console.log('🔧 Initializing Arize tracing with custom gRPC configuration...');
  
  const metadata = new Metadata();
  metadata.set('space_id', ARIZE_CONFIG.spaceId);
  metadata.set('api_key', ARIZE_CONFIG.apiKey);

  // Custom gRPC exporter with explicit endpoint handling
  const customGrpcExporter = new GrpcOTLPTraceExporter({
    url: ARIZE_CONFIG.endpoint, // Still just the base URL
    metadata,
    // Additional gRPC options if needed
    compression: 'gzip',
  });

  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: ARIZE_CONFIG.projectName,
    [SemanticResourceAttributes.SERVICE_VERSION]: ARIZE_CONFIG.modelVersion,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: ARIZE_CONFIG.environment,
    'model_id': ARIZE_CONFIG.modelId,
    'model_version': ARIZE_CONFIG.modelVersion,
    'arize.space_id': ARIZE_CONFIG.spaceId,
    'arize.project.name': ARIZE_CONFIG.projectName,
  });

  const sdk = new NodeSDK({
    resource,
    traceExporter: customGrpcExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: true },
        '@opentelemetry/instrumentation-http': {
          enabled: true,
          ignoreIncomingRequestHook: (req) => req.url?.includes('/health') || req.url?.includes('/api/health'),
        },
        '@opentelemetry/instrumentation-express': { enabled: true },
        '@opentelemetry/instrumentation-net': { enabled: true },
        '@opentelemetry/instrumentation-dns': { enabled: true },
      }),
    ],
  });

  sdk.start();
  console.log('✅ Arize tracing initialized with custom gRPC exporter');
  return { tracerProvider: trace.getTracerProvider(), tracer: trace.getTracer('listify-agent', ARIZE_CONFIG.modelVersion) };
};

// Option 3: Environment-based exporter selection
export const initializeArizeTracingSmart = () => {
  const useHttp = process.env.ARIZE_USE_HTTP_EXPORTER === 'true';
  
  if (useHttp) {
    console.log('📡 Using HTTP OTLP exporter (full path control)');
    return initializeArizeTracingHttp();
  } else {
    console.log('📡 Using gRPC OTLP exporter (automatic /v1/traces)');
    return initializeArizeTracingCustomGrpc();
  }
};

export { ARIZE_CONFIG };

