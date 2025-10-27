/**
 * OpenInference Tracing Utilities - Updated to follow MCP best practices
 * Comprehensive span creation and management following Arize MCP patterns
 */

import { trace, SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { getTracer } from '../config/arize-fixed.js';

// OpenInference Span Kinds following MCP conventions
export const SpanKinds = {
  AGENT: 'AGENT',
  LLM: 'LLM', 
  TOOL: 'TOOL',
  RETRIEVER: 'RETRIEVER',
  EMBEDDING: 'EMBEDDING',
  CHAIN: 'CHAIN',
  RERANKER: 'RERANKER',
  GUARDRAIL: 'GUARDRAIL',
  EVALUATOR: 'EVALUATOR'
};

/**
 * Create an Agent span following MCP patterns
 * @param {string} name - Span name
 * @param {string} description - Span description
 * @param {Object} attributes - Additional attributes
 * @returns {Object} Agent span
 */
export const createAgentSpan = (name, description, attributes = {}) => {
  const tracer = getTracer();
  if (!tracer) return null;

  const span = tracer.startSpan(name, {
    kind: SpanKind.INTERNAL,
    attributes: {
      'openinference.span.kind': SpanKinds.AGENT,
      'agent.name': 'listify-agent',
      'agent.version': '1.0.0',
      'operation.name': name,
      'operation.description': description,
      ...attributes
    }
  });

  return span;
};

/**
 * Create an LLM span following MCP patterns
 * @param {string} name - Span name
 * @param {string} modelName - LLM model name
 * @param {string} input - Input text/prompt
 * @param {Object} attributes - Additional attributes
 * @returns {Object} LLM span
 */
export const createLLMSpan = (name, modelName, input, attributes = {}) => {
  const tracer = getTracer();
  if (!tracer) return null;

  const span = tracer.startSpan(name, {
    kind: SpanKind.CLIENT,
    attributes: {
      'openinference.span.kind': SpanKinds.LLM,
      'llm.model.name': modelName,
      'input.value': input,
      'input.mime_type': 'text/plain',
      ...attributes
    }
  });

  return span;
};

/**
 * Create a Tool span following MCP patterns
 * @param {string} name - Span name
 * @param {string} toolName - Tool name
 * @param {Object} toolArgs - Tool arguments
 * @param {Object} attributes - Additional attributes
 * @returns {Object} Tool span
 */
export const createToolSpan = (name, toolName, toolArgs, attributes = {}) => {
  const tracer = getTracer();
  if (!tracer) return null;

  const span = tracer.startSpan(name, {
    kind: SpanKind.INTERNAL,
    attributes: {
      'openinference.span.kind': SpanKinds.TOOL,
      'tool.name': toolName,
      'tool.arguments': JSON.stringify(toolArgs),
      'input.value': JSON.stringify(toolArgs),
      'input.mime_type': 'application/json',
      ...attributes
    }
  });

  return span;
};

/**
 * Create a Retriever span following MCP patterns
 * @param {string} name - Span name
 * @param {string} query - Search query
 * @param {Object} attributes - Additional attributes
 * @returns {Object} Retriever span
 */
export const createRetrieverSpan = (name, query, attributes = {}) => {
  const tracer = getTracer();
  if (!tracer) return null;

  const span = tracer.startSpan(name, {
    kind: SpanKind.CLIENT,
    attributes: {
      'openinference.span.kind': SpanKinds.RETRIEVER,
      'input.value': query,
      'input.mime_type': 'text/plain',
      ...attributes
    }
  });

  return span;
};

/**
 * Create an Embedding span following MCP patterns
 * @param {string} name - Span name
 * @param {string} modelName - Embedding model name
 * @param {Array} texts - Input texts
 * @param {Object} attributes - Additional attributes
 * @returns {Object} Embedding span
 */
export const createEmbeddingSpan = (name, modelName, texts, attributes = {}) => {
  const tracer = getTracer();
  if (!tracer) return null;

  const span = tracer.startSpan(name, {
    kind: SpanKind.CLIENT,
    attributes: {
      'openinference.span.kind': SpanKinds.EMBEDDING,
      'embedding.model.name': modelName,
      'input.value': JSON.stringify(texts),
      'input.mime_type': 'application/json',
      ...attributes
    }
  });

  return span;
};

/**
 * Create an Evaluator span following MCP patterns
 * @param {string} name - Span name
 * @param {string} evaluationType - Type of evaluation
 * @param {Object} input - Evaluation input
 * @param {Object} attributes - Additional attributes
 * @returns {Object} Evaluator span
 */
export const createEvaluatorSpan = (name, evaluationType, input, attributes = {}) => {
  const tracer = getTracer();
  if (!tracer) return null;

  const span = tracer.startSpan(name, {
    kind: SpanKind.INTERNAL,
    attributes: {
      'openinference.span.kind': SpanKinds.EVALUATOR,
      'evaluator.type': evaluationType,
      'input.value': JSON.stringify(input),
      'input.mime_type': 'application/json',
      ...attributes
    }
  });

  return span;
};

/**
 * Add LLM input messages following MCP patterns
 * @param {Object} span - Span object
 * @param {Array} messages - Array of message objects
 */
export const addLLMInputMessages = (span, messages) => {
  if (!span || !messages) return;

  messages.forEach((message, index) => {
    span.setAttribute(`llm.input_messages.${index}.message.role`, message.role);
    span.setAttribute(`llm.input_messages.${index}.message.content`, message.content);
    
    if (message.name) {
      span.setAttribute(`llm.input_messages.${index}.message.name`, message.name);
    }
  });
};

/**
 * Add LLM output messages following MCP patterns
 * @param {Object} span - Span object
 * @param {Array} messages - Array of message objects
 */
export const addLLMOutputMessages = (span, messages) => {
  if (!span || !messages) return;

  messages.forEach((message, index) => {
    span.setAttribute(`llm.output_messages.${index}.message.role`, message.role);
    span.setAttribute(`llm.output_messages.${index}.message.content`, message.content);
    
    if (message.name) {
      span.setAttribute(`llm.output_messages.${index}.message.name`, message.name);
    }
  });
};

/**
 * Add retrieval documents following MCP patterns
 * @param {Object} span - Span object
 * @param {Array} documents - Array of document objects
 */
export const addRetrievalDocuments = (span, documents) => {
  if (!span || !documents) return;

  documents.forEach((doc, index) => {
    span.setAttribute(`retrieval.documents.${index}.document.id`, doc.id || index);
    span.setAttribute(`retrieval.documents.${index}.document.content`, doc.content);
    
    if (doc.score !== undefined) {
      span.setAttribute(`retrieval.documents.${index}.document.score`, doc.score);
    }
    
    if (doc.metadata) {
      span.setAttribute(`retrieval.documents.${index}.document.metadata`, JSON.stringify(doc.metadata));
    }
  });
};

/**
 * Add embedding vectors following MCP patterns
 * @param {Object} span - Span object
 * @param {Array} embeddings - Array of embedding objects
 */
export const addEmbeddingVectors = (span, embeddings) => {
  if (!span || !embeddings) return;

  embeddings.forEach((embedding, index) => {
    if (embedding.text) {
      span.setAttribute(`embedding.embeddings.${index}.text`, embedding.text);
    }
    if (embedding.vector) {
      span.setAttribute(`embedding.embeddings.${index}.vector`, JSON.stringify(embedding.vector));
    }
  });
};

/**
 * Set span status following MCP patterns
 * @param {Object} span - Span object
 * @param {boolean} success - Whether the operation was successful
 * @param {string} message - Status message
 */
export const setSpanStatus = (span, success = true, message = '') => {
  if (!span) return;

  span.setStatus({
    code: success ? SpanStatusCode.OK : SpanStatusCode.ERROR,
    message: message,
  });
};

/**
 * Record exception following MCP patterns
 * @param {Object} span - Span object
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
export const recordSpanException = (span, error, context = {}) => {
  if (!span || !error) return;

  span.recordException(error);
  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: error.message,
  });
  span.setAttributes({
    'error': true,
    'error.message': error.message,
    'error.type': error.constructor.name,
    ...context,
  });
};

/**
 * Add span metadata following MCP patterns
 * @param {Object} span - Span object
 * @param {Object} metadata - Metadata object
 */
export const addSpanMetadata = (span, metadata) => {
  if (!span || !metadata) return;

  Object.entries(metadata).forEach(([key, value]) => {
    span.setAttribute(`metadata.${key}`, typeof value === 'object' ? JSON.stringify(value) : value);
  });
};

/**
 * Add span tags following MCP patterns
 * @param {Object} span - Span object
 * @param {Array} tags - Array of tag strings
 */
export const addSpanTags = (span, tags) => {
  if (!span || !tags) return;

  span.setAttribute('tag.tags', JSON.stringify(tags));
};

/**
 * Add evaluation results following MCP patterns
 * @param {Object} span - Span object
 * @param {Object} evaluation - Evaluation result object
 */
export const addEvaluationResults = (span, evaluation) => {
  if (!span || !evaluation) return;

  span.setAttribute('eval.overall_score', evaluation.overall_score || 0);
  span.setAttribute('eval.tone_score', evaluation.tone_score || 0);
  span.setAttribute('eval.correctness_score', evaluation.correctness_score || 0);
  span.setAttribute('eval.tool_score', evaluation.tool_score || 0);
  span.setAttribute('eval.has_hallucinations', evaluation.has_hallucinations || false);
  
  if (evaluation.hallucination_count !== undefined) {
    span.setAttribute('eval.hallucination_count', evaluation.hallucination_count);
  }
  
  if (evaluation.confidence !== undefined) {
    span.setAttribute('eval.confidence', evaluation.confidence);
  }
};

/**
 * Create a span with proper error handling following MCP patterns
 * @param {Function} spanCreator - Function that creates the span
 * @param {Function} operation - Function that performs the operation
 * @param {Object} options - Options for error handling
 * @returns {Promise} Result of the operation
 */
export const withSpan = async (spanCreator, operation, options = {}) => {
  const span = spanCreator();
  if (!span) {
    return operation();
  }

  try {
    const result = await operation(span);
    setSpanStatus(span, true, options.successMessage);
    return result;
  } catch (error) {
    recordSpanException(span, error, options.errorContext);
    throw error;
  } finally {
    span.end();
  }
};

/**
 * Create a synchronous span with proper error handling following MCP patterns
 * @param {Function} spanCreator - Function that creates the span
 * @param {Function} operation - Function that performs the operation
 * @param {Object} options - Options for error handling
 * @returns {any} Result of the operation
 */
export const withSpanSync = (spanCreator, operation, options = {}) => {
  const span = spanCreator();
  if (!span) {
    return operation();
  }

  try {
    const result = operation(span);
    setSpanStatus(span, true, options.successMessage);
    return result;
  } catch (error) {
    recordSpanException(span, error, options.errorContext);
    throw error;
  } finally {
    span.end();
  }
};
