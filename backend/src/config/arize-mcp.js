/**
 * Arize Tracing Configuration - Updated to follow MCP best practices
 * Comprehensive observability setup with OpenTelemetry and OpenInference
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

// Optional: Enable debug logging for development
if (process.env.NODE_ENV === 'development') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}

// Arize configuration following MCP recommendations
const ARIZE_CONFIG = {
  spaceId: process.env.ARIZE_SPACE_ID,
  apiKey: process.env.ARIZE_API_KEY,
  projectName: process.env.ARIZE_PROJECT_NAME || 'listify-agent',
  modelId: process.env.ARIZE_MODEL_ID || 'listify-agent-model',
  modelVersion: process.env.ARIZE_MODEL_VERSION || 'v1.0.0',
  endpoint: process.env.ARIZE_ENDPOINT || 'https://otlp.arize.com/v1', // GRPC endpoint as recommended
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

// Initialize Arize tracing following MCP patterns
let tracerProvider = null;
let tracer = null;

export const initializeArizeTracing = () => {
  console.log('🔧 Arize Config Check:', {
    spaceId: ARIZE_CONFIG.spaceId ? '✅ Set' : '❌ Missing',
    apiKey: ARIZE_CONFIG.apiKey ? '✅ Set' : '❌ Missing',
    endpoint: ARIZE_CONFIG.endpoint,
    projectName: ARIZE_CONFIG.projectName
  });

  if (!validateArizeConfig()) {
    console.log('🔧 Arize tracing disabled - missing credentials');
    return { tracerProvider: null, tracer: null };
  }

  try {
    console.log('🔧 Initializing Arize tracing with MCP best practices...');
    console.log(`📡 Endpoint: ${ARIZE_CONFIG.endpoint}`);
    console.log(`🏷️  Project: ${ARIZE_CONFIG.projectName}`);
    console.log(`🤖 Model: ${ARIZE_CONFIG.modelId} v${ARIZE_CONFIG.modelVersion}`);

    // Create metadata for GRPC exporter as recommended by MCP
    const metadata = new Metadata();
    metadata.set('space_id', ARIZE_CONFIG.spaceId);
    metadata.set('api_key', ARIZE_CONFIG.apiKey);

    // Create GRPC exporter following MCP recommendations
    const arizeExporter = new GrpcOTLPTraceExporter({
      url: ARIZE_CONFIG.endpoint,
      metadata,
    });

    // Create resource with model information as recommended by MCP
    const resource = new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'listify-agent',
      [SemanticResourceAttributes.SERVICE_VERSION]: ARIZE_CONFIG.modelVersion,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: ARIZE_CONFIG.environment,
      'model_id': ARIZE_CONFIG.modelId,
      'model_version': ARIZE_CONFIG.modelVersion,
      'arize.space_id': ARIZE_CONFIG.spaceId,
    });

    // Initialize Node SDK with auto-instrumentations following MCP patterns
    const sdk = new NodeSDK({
      resource,
      traceExporter: arizeExporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          // Enable specific instrumentations as recommended
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
    try {
      sdk.start();
      console.log('📡 OpenTelemetry initialized - sending traces to Arize');
      console.log(`📊 Sending traces to: ${ARIZE_CONFIG.endpoint}`);
      console.log(`🏷️  Project: ${ARIZE_CONFIG.projectName}`);
      console.log(`🤖 Model: ${ARIZE_CONFIG.modelId} v${ARIZE_CONFIG.modelVersion}`);
    } catch (err) {
      console.error('Failed to start OpenTelemetry SDK', err);
      throw err;
    }

    // Get tracer provider and tracer
    tracerProvider = trace.getTracerProvider();
    tracer = trace.getTracer('listify-agent', ARIZE_CONFIG.modelVersion);

    console.log('✅ Arize tracing initialized successfully');

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

// Create a span with OpenInference semantic conventions
export const createSpan = (name, attributes = {}) => {
  const currentTracer = getTracer();
  if (!currentTracer) {
    return null;
  }

  return currentTracer.startSpan(name, {
    attributes: {
      'service.name': 'listify-agent',
      'service.version': ARIZE_CONFIG.modelVersion,
      'deployment.environment': ARIZE_CONFIG.environment,
      'model_id': ARIZE_CONFIG.modelId,
      'model_version': ARIZE_CONFIG.modelVersion,
      ...attributes,
    },
  });
};

// Add OpenInference semantic attributes following MCP patterns
export const addOpenInferenceAttributes = (span, spanKind, input = null, output = null) => {
  if (!span) return;

  // Set OpenInference span kind
  span.setAttribute('openinference.span.kind', spanKind);

  // Add input/output values following MCP conventions
  if (input) {
    span.setAttribute('input.value', typeof input === 'string' ? input : JSON.stringify(input));
    span.setAttribute('input.mime_type', 'application/json');
  }

  if (output) {
    span.setAttribute('output.value', typeof output === 'string' ? output : JSON.stringify(output));
    span.setAttribute('output.mime_type', 'application/json');
  }
};

// Add LLM-specific attributes following MCP patterns
export const addLLMAttributes = (span, modelName, messages = [], tokenCounts = {}) => {
  if (!span) return;

  span.setAttribute('llm.model.name', modelName);
  
  // Add input messages following MCP conventions
  if (messages && messages.length > 0) {
    messages.forEach((message, index) => {
      span.setAttribute(`llm.input_messages.${index}.message.role`, message.role);
      span.setAttribute(`llm.input_messages.${index}.message.content`, message.content);
    });
  }

  // Add token counts
  if (tokenCounts.prompt) {
    span.setAttribute('llm.token_count.prompt', tokenCounts.prompt);
  }
  if (tokenCounts.completion) {
    span.setAttribute('llm.token_count.completion', tokenCounts.completion);
  }
  if (tokenCounts.total) {
    span.setAttribute('llm.token_count.total', tokenCounts.total);
  }
};

// Add tool-specific attributes following MCP patterns
export const addToolAttributes = (span, toolName, toolArgs = {}, toolOutput = null) => {
  if (!span) return;

  span.setAttribute('tool.name', toolName);
  span.setAttribute('tool.arguments', JSON.stringify(toolArgs));
  
  if (toolOutput) {
    span.setAttribute('tool.output', JSON.stringify(toolOutput));
  }
};

// Add agent-specific attributes following MCP patterns
export const addAgentAttributes = (span, agentName, agentVersion = '1.0.0') => {
  if (!span) return;

  span.setAttribute('agent.name', agentName);
  span.setAttribute('agent.version', agentVersion);
};

// Record error in span following MCP patterns
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

// Add events following MCP patterns
export const addEvent = (span, eventName, attributes = {}) => {
  if (!span) return;
  
  span.addEvent(eventName, attributes);
};

// Set span status following MCP patterns
export const setSpanStatus = (span, success = true, message = '') => {
  if (!span) return;
  
  span.setStatus({
    code: success ? 1 : 2, // OK or ERROR
    message: message,
  });
};

// Export configuration for reference
export { ARIZE_CONFIG };
