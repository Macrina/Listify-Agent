/**
 * Arize Tracing Configuration for Listify Agent
 * Comprehensive observability setup with OpenTelemetry and OpenInference
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-grpc';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { trace } from '@opentelemetry/api';
import dotenv from 'dotenv';

dotenv.config();

// Arize configuration
const ARIZE_CONFIG = {
  spaceId: process.env.ARIZE_SPACE_ID,
  apiKey: process.env.ARIZE_API_KEY,
  projectName: process.env.ARIZE_PROJECT_NAME || 'listify-agent',
  endpoint: process.env.ARIZE_ENDPOINT || 'https://otlp.arize.com/v1',
  environment: process.env.NODE_ENV || 'development'
};

// Validate Arize configuration
const validateArizeConfig = () => {
  if (!ARIZE_CONFIG.spaceId) {
    console.warn('⚠️  ARIZE_SPACE_ID not set - tracing will be disabled');
    return false;
  }
  if (!ARIZE_CONFIG.apiKey) {
    console.warn('⚠️  ARIZE_API_KEY not set - tracing will be disabled');
    return false;
  }
  return true;
};

// Initialize Arize tracing
let tracerProvider = null;
let tracer = null;

export const initializeArizeTracing = () => {
  if (!validateArizeConfig()) {
    console.log('🔧 Arize tracing disabled - missing credentials');
    return { tracerProvider: null, tracer: null };
  }

  try {
    console.log('🔧 Initializing Arize tracing...');

    // Create resource with service information
    const resource = new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'listify-agent',
      [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: ARIZE_CONFIG.environment,
      'model_id': ARIZE_CONFIG.projectName,
      'model_version': 'v1.0.0',
      'arize.space_id': ARIZE_CONFIG.spaceId,
    });

    // Create OTLP exporter for Arize
    const traceExporter = new OTLPTraceExporter({
      url: ARIZE_CONFIG.endpoint,
      headers: {
        'space_id': ARIZE_CONFIG.spaceId,
        'api_key': ARIZE_CONFIG.apiKey,
      },
    });

    // Initialize Node SDK with auto-instrumentations
    const sdk = new NodeSDK({
      resource,
      traceExporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          // Enable specific instrumentations
          '@opentelemetry/instrumentation-fs': {
            enabled: true,
          },
          '@opentelemetry/instrumentation-http': {
            enabled: true,
            ignoreIncomingRequestHook: (req) => {
              // Ignore health check endpoints
              return req.url?.includes('/health') || req.url?.includes('/api/health');
            },
          },
          '@opentelemetry/instrumentation-express': {
            enabled: true,
          },
          '@opentelemetry/instrumentation-net': {
            enabled: true,
          },
          '@opentelemetry/instrumentation-dns': {
            enabled: true,
          },
        }),
      ],
    });

    // Start the SDK
    sdk.start();

    // Get tracer provider and tracer
    tracerProvider = trace.getTracerProvider();
    tracer = trace.getTracer('listify-agent', '1.0.0');

    console.log('✅ Arize tracing initialized successfully');
    console.log(`📊 Sending traces to: ${ARIZE_CONFIG.endpoint}`);
    console.log(`🏷️  Project: ${ARIZE_CONFIG.projectName}`);

    return { tracerProvider, tracer };
  } catch (error) {
    console.error('❌ Failed to initialize Arize tracing:', error.message);
    return { tracerProvider: null, tracer: null };
  }
};

// Get tracer instance
export const getTracer = () => {
  if (!tracer) {
    console.warn('⚠️  Tracer not initialized - call initializeArizeTracing() first');
    return null;
  }
  return tracer;
};

// Get tracer provider
export const getTracerProvider = () => {
  if (!tracerProvider) {
    console.warn('⚠️  TracerProvider not initialized - call initializeArizeTracing() first');
    return null;
  }
  return tracerProvider;
};

// Create a span with common attributes
export const createSpan = (name, attributes = {}) => {
  const currentTracer = getTracer();
  if (!currentTracer) {
    return null;
  }

  return currentTracer.startSpan(name, {
    attributes: {
      'service.name': 'listify-agent',
      'service.version': '1.0.0',
      'deployment.environment': ARIZE_CONFIG.environment,
      ...attributes,
    },
  });
};

// Add common span attributes
export const addCommonAttributes = (span, operation, input = null, output = null) => {
  if (!span) return;

  span.setAttributes({
    'operation.name': operation,
    'operation.type': 'ai_agent',
    'ai.agent.name': 'listify-agent',
    'ai.agent.version': '1.0.0',
  });

  if (input) {
    span.setAttribute('input.value', typeof input === 'string' ? input : JSON.stringify(input));
    span.setAttribute('input.mime_type', 'application/json');
  }

  if (output) {
    span.setAttribute('output.value', typeof output === 'string' ? output : JSON.stringify(output));
    span.setAttribute('output.mime_type', 'application/json');
  }
};

// Record error in span
export const recordError = (span, error, context = {}) => {
  if (!span) return;

  span.recordException(error);
  span.setStatus({
    code: 2, // ERROR
    message: error.message,
  });
  span.setAttributes({
    'error': true,
    'error.message': error.message,
    'error.type': error.constructor.name,
    ...context,
  });
};

// Export configuration for reference
export { ARIZE_CONFIG };
