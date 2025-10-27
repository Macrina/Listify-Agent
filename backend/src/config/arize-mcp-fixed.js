/**
 * Arize MCP-Compliant Tracing Configuration
 * Following official Arize MCP recommendations exactly
 * https://arize.com/docs/ax/observe/tracing-integrations-auto/model-context-protocol-mcp
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'; // Use HTTP as recommended
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { trace, diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import dotenv from 'dotenv';

dotenv.config();

// Enable debug logging for troubleshooting
if (process.env.NODE_ENV === 'development' || process.env.ARIZE_DEBUG === 'true') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}

// Arize configuration following MCP recommendations exactly
const ARIZE_CONFIG = {
  spaceId: process.env.ARIZE_SPACE_ID,
  apiKey: process.env.ARIZE_API_KEY,
  projectName: process.env.ARIZE_PROJECT_NAME || 'listify-agent',
  modelId: process.env.ARIZE_MODEL_ID || 'listify-agent-model',
  modelVersion: process.env.ARIZE_MODEL_VERSION || 'v1.0.0',
  // Use HTTP endpoint as recommended by MCP documentation
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

// Initialize Arize tracing following MCP patterns exactly
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

    // Create HTTP exporter as recommended by MCP documentation
    const arizeExporter = new OTLPTraceExporter({
      url: ARIZE_CONFIG.endpoint,
      headers: {
        'space_id': ARIZE_CONFIG.spaceId,
        'api_key': ARIZE_CONFIG.apiKey,
      }
    });

    // Create resource with model information as recommended by MCP
    const resource = new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: ARIZE_CONFIG.projectName,
      [SemanticResourceAttributes.SERVICE_VERSION]: ARIZE_CONFIG.modelVersion,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: ARIZE_CONFIG.environment,
      // Required by Arize MCP
      'model_id': ARIZE_CONFIG.modelId,
      'model_version': ARIZE_CONFIG.modelVersion,
      'arize.space_id': ARIZE_CONFIG.spaceId,
      'arize.project.name': ARIZE_CONFIG.projectName,
    });

    // Initialize NodeSDK with auto-instrumentations as recommended
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

    tracerProvider = trace.getTracerProvider();
    tracer = trace.getTracer('listify-agent', ARIZE_CONFIG.modelVersion);

    console.log('✅ Arize tracing initialized successfully');
    return { tracerProvider, tracer };

  } catch (error) {
    console.error('❌ Failed to initialize Arize tracing:', error);
    return { tracerProvider: null, tracer: null };
  }
};

export const getTracerProvider = () => tracerProvider;
export const getTracer = () => tracer;

// Export configuration for debugging
export const getArizeConfig = () => ARIZE_CONFIG;
