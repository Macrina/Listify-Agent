/**
 * Arize Tracing Configuration for Node.js
 * This module initializes Arize tracing for the Node.js backend
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
  endpoint: process.env.ARIZE_ENDPOINT || 'https://otlp.arize.com/v1',
  environment: process.env.NODE_ENV || 'development'
};

const validateArizeConfig = () => {
  if (!ARIZE_CONFIG.spaceId || !ARIZE_CONFIG.apiKey) {
    console.warn('⚠️  ARIZE_SPACE_ID or ARIZE_API_KEY not set - tracing will be disabled');
    return false;
  }
  return true;
};

let tracerProvider = null;
let tracer = null;

export const initializeArizeTracing = () => {
  if (!validateArizeConfig()) {
    console.log('🔧 Arize tracing disabled - missing credentials');
    return { tracerProvider: null, tracer: null };
  }

  try {
    console.log('🔧 Initializing Arize tracing for Node.js...');
    console.log(`📡 Endpoint: ${ARIZE_CONFIG.endpoint}`);
    console.log(`🏷️  Project: ${ARIZE_CONFIG.projectName}`);
    console.log(`🤖 Model: ${ARIZE_CONFIG.modelId} v${ARIZE_CONFIG.modelVersion}`);

    const metadata = new Metadata();
    metadata.set('space_id', ARIZE_CONFIG.spaceId);
    metadata.set('api_key', ARIZE_CONFIG.apiKey);

    const arizeExporter = new GrpcOTLPTraceExporter({
      url: ARIZE_CONFIG.endpoint,
      metadata,
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
      traceExporter: arizeExporter,
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

    tracerProvider = trace.getTracerProvider();
    tracer = trace.getTracer('listify-agent', ARIZE_CONFIG.modelVersion);

    console.log('✅ Arize tracing initialized successfully for Node.js');
    return { tracerProvider, tracer };

  } catch (error) {
    console.error('❌ Failed to initialize Arize tracing:', error.message);
    return { tracerProvider: null, tracer: null };
  }
};

export const getTracerProvider = () => tracerProvider;
export const getTracer = () => tracer;
export const getArizeConfig = () => ARIZE_CONFIG;
