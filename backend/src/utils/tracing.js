/**
 * Tracing Utilities for Listify Agent
 * OpenInference semantic conventions and tracing helpers
 */

import { trace, context } from '@opentelemetry/api';

// OpenInference semantic conventions
export const SpanKinds = {
  AGENT: 'AGENT',
  LLM: 'LLM',
  TOOL: 'TOOL',
  RETRIEVER: 'RETRIEVER',
  EMBEDDING: 'EMBEDDING',
  CHAIN: 'CHAIN',
  RERANKER: 'RERANKER',
  GUARDRAIL: 'GUARDRAIL',
  EVALUATOR: 'EVALUATOR',
};

// Common span attributes
export const SpanAttributes = {
  OPENINFERENCE_SPAN_KIND: 'openinference.span.kind',
  INPUT_VALUE: 'input.value',
  OUTPUT_VALUE: 'output.value',
  INPUT_MIME_TYPE: 'input.mime_type',
  OUTPUT_MIME_TYPE: 'output.mime_type',
  
  // LLM attributes
  LLM_MODEL_NAME: 'llm.model_name',
  LLM_MODEL_VERSION: 'llm.model_version',
  LLM_TOKEN_COUNT_PROMPT: 'llm.token_count.prompt',
  LLM_TOKEN_COUNT_COMPLETION: 'llm.token_count.completion',
  LLM_TOKEN_COUNT_TOTAL: 'llm.token_count.total',
  LLM_INPUT_MESSAGES: 'llm.input_messages',
  LLM_OUTPUT_MESSAGES: 'llm.output_messages',
  LLM_TEMPERATURE: 'llm.temperature',
  LLM_MAX_TOKENS: 'llm.max_tokens',
  LLM_TOP_P: 'llm.top_p',
  LLM_FREQUENCY_PENALTY: 'llm.frequency_penalty',
  LLM_PRESENCE_PENALTY: 'llm.presence_penalty',
  
  // Tool attributes
  TOOL_CALL_FUNCTION_NAME: 'tool.call.function.name',
  TOOL_CALL_FUNCTION_ARGUMENTS_JSON: 'tool.call.function.arguments',
  TOOL_CALL_FUNCTION_OUTPUT: 'tool.call.function.output',
  
  // Retrieval attributes
  RETRIEVAL_DOCUMENTS: 'retrieval.documents',
  RETRIEVAL_QUERY: 'retrieval.query',
  RETRIEVAL_TOP_K: 'retrieval.top_k',
  
  // Embedding attributes
  EMBEDDING_MODEL_NAME: 'embedding.model_name',
  EMBEDDING_EMBEDDINGS: 'embedding.embeddings',
  EMBEDDING_TEXT: 'embedding.text',
  EMBEDDING_VECTOR: 'embedding.vector',
  
  // General attributes
  METADATA: 'metadata',
  TAG_TAGS: 'tag.tags',
  SESSION_ID: 'session.id',
  USER_ID: 'user.id',
};

// Message attributes for LLM conversations
export const MessageAttributes = {
  MESSAGE_ROLE: 'message.role',
  MESSAGE_CONTENT: 'message.content',
  MESSAGE_NAME: 'message.name',
  MESSAGE_FUNCTION_CALL_NAME: 'message.function_call.name',
  MESSAGE_FUNCTION_CALL_ARGUMENTS: 'message.function_call.arguments',
  MESSAGE_TOOL_CALLS: 'message.tool_calls',
};

// Document attributes for retrieval
export const DocumentAttributes = {
  DOCUMENT_ID: 'document.id',
  DOCUMENT_SCORE: 'document.score',
  DOCUMENT_CONTENT: 'document.content',
  DOCUMENT_METADATA: 'document.metadata',
};

// Get current tracer
export const getTracer = (name = 'listify-agent') => {
  return trace.getTracer(name, '1.0.0');
};

// Create a span with OpenInference attributes and run callback in its context
export const createOpenInferenceSpan = (name, kind, attributes = {}, parentContext = context.active()) => {
  const tracer = getTracer();
  const span = tracer.startSpan(
    name,
    {
      attributes: {
        [SpanAttributes.OPENINFERENCE_SPAN_KIND]: kind,
        ...attributes,
      },
    },
    parentContext
  );
  
  return span;
};

// Run a callback in the context of a span
export const runInSpanContext = (span, callback) => {
  const activeContext = trace.setSpan(context.active(), span);
  return context.with(activeContext, callback);
};

// Create an Agent span with graph metadata
export const createAgentSpan = (name, input, attributes = {}) => {
  const tracer = getTracer();
  const span = tracer.startSpan(name, {
    attributes: {
      [SpanAttributes.OPENINFERENCE_SPAN_KIND]: SpanKinds.AGENT,
      [SpanAttributes.INPUT_VALUE]: typeof input === 'string' ? input : JSON.stringify(input),
      ...attributes,
    },
  });
  
  return span;
};

// Add graph attributes for agent/node visualization
export const addGraphAttributes = (span, nodeId, parentId = null, displayName = null) => {
  if (!span) return;
  
  span.setAttribute('graph.node.id', nodeId);
  if (parentId) {
    span.setAttribute('graph.node.parent_id', parentId);
  }
  if (displayName) {
    span.setAttribute('graph.node.display_name', displayName);
  } else {
    // Auto-generate display name from node ID
    span.setAttribute('graph.node.display_name', nodeId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
  }
};

// Create an LLM span
export const createLLMSpan = (name, modelName, input, attributes = {}, parentSpan = null) => {
  const tracer = getTracer();
  
  // If parent span is provided, create child span in its context
  let spanContext = context.active();
  if (parentSpan) {
    spanContext = trace.setSpan(context.active(), parentSpan);
  }
  
  const span = tracer.startSpan(name, {
    attributes: {
      [SpanAttributes.OPENINFERENCE_SPAN_KIND]: SpanKinds.LLM,
      [SpanAttributes.LLM_MODEL_NAME]: modelName,
      [SpanAttributes.INPUT_VALUE]: typeof input === 'string' ? input : JSON.stringify(input),
      ...attributes,
    },
  }, spanContext);
  
  return span;
};

// Create a Tool span
export const createToolSpan = (name, functionName, input, attributes = {}) => {
  return createOpenInferenceSpan(name, SpanKinds.TOOL, {
    [SpanAttributes.TOOL_CALL_FUNCTION_NAME]: functionName,
    [SpanAttributes.INPUT_VALUE]: typeof input === 'string' ? input : JSON.stringify(input),
    ...attributes,
  });
};

// Create a Retriever span
export const createRetrieverSpan = (name, query, attributes = {}) => {
  return createOpenInferenceSpan(name, SpanKinds.RETRIEVER, {
    [SpanAttributes.RETRIEVAL_QUERY]: query,
    [SpanAttributes.INPUT_VALUE]: query,
    ...attributes,
  });
};

// Create an Embedding span
export const createEmbeddingSpan = (name, modelName, input, attributes = {}) => {
  return createOpenInferenceSpan(name, SpanKinds.EMBEDDING, {
    [SpanAttributes.EMBEDDING_MODEL_NAME]: modelName,
    [SpanAttributes.INPUT_VALUE]: typeof input === 'string' ? input : JSON.stringify(input),
    ...attributes,
  });
};

// Add LLM input messages to span
export const addLLMInputMessages = (span, messages) => {
  if (!span || !messages) return;

  messages.forEach((message, index) => {
    const prefix = `${SpanAttributes.LLM_INPUT_MESSAGES}.${index}`;
    span.setAttribute(`${prefix}.${MessageAttributes.MESSAGE_ROLE}`, message.role);
    span.setAttribute(`${prefix}.${MessageAttributes.MESSAGE_CONTENT}`, message.content);
    
    if (message.name) {
      span.setAttribute(`${prefix}.${MessageAttributes.MESSAGE_NAME}`, message.name);
    }
    if (message.function_call) {
      span.setAttribute(`${prefix}.${MessageAttributes.MESSAGE_FUNCTION_CALL_NAME}`, message.function_call.name);
      span.setAttribute(`${prefix}.${MessageAttributes.MESSAGE_FUNCTION_CALL_ARGUMENTS}`, JSON.stringify(message.function_call.arguments));
    }
    if (message.tool_calls) {
      span.setAttribute(`${prefix}.${MessageAttributes.MESSAGE_TOOL_CALLS}`, JSON.stringify(message.tool_calls));
    }
  });
};

// Add LLM output messages to span
export const addLLMOutputMessages = (span, messages) => {
  if (!span || !messages) return;

  messages.forEach((message, index) => {
    const prefix = `${SpanAttributes.LLM_OUTPUT_MESSAGES}.${index}`;
    span.setAttribute(`${prefix}.${MessageAttributes.MESSAGE_ROLE}`, message.role);
    span.setAttribute(`${prefix}.${MessageAttributes.MESSAGE_CONTENT}`, message.content);
    
    if (message.name) {
      span.setAttribute(`${prefix}.${MessageAttributes.MESSAGE_NAME}`, message.name);
    }
  });
};

// Add retrieval documents to span
export const addRetrievalDocuments = (span, documents) => {
  if (!span || !documents) return;

  documents.forEach((doc, index) => {
    const prefix = `${SpanAttributes.RETRIEVAL_DOCUMENTS}.${index}`;
    span.setAttribute(`${prefix}.${DocumentAttributes.DOCUMENT_ID}`, doc.id || index);
    span.setAttribute(`${prefix}.${DocumentAttributes.DOCUMENT_CONTENT}`, doc.content || doc.text || '');
    span.setAttribute(`${prefix}.${DocumentAttributes.DOCUMENT_SCORE}`, doc.score || 0);
    
    if (doc.metadata) {
      span.setAttribute(`${prefix}.${DocumentAttributes.DOCUMENT_METADATA}`, JSON.stringify(doc.metadata));
    }
  });
};

// Add embedding vectors to span
export const addEmbeddingVectors = (span, texts, vectors) => {
  if (!span || !texts || !vectors) return;

  texts.forEach((text, index) => {
    const prefix = `${SpanAttributes.EMBEDDING_EMBEDDINGS}.${index}`;
    span.setAttribute(`${prefix}.${SpanAttributes.EMBEDDING_TEXT}`, text);
    span.setAttribute(`${prefix}.${SpanAttributes.EMBEDDING_VECTOR}`, JSON.stringify(vectors[index]));
  });
};

// Add tool call information to span
export const addToolCall = (span, functionName, arguments_, output) => {
  if (!span) return;

  span.setAttribute(SpanAttributes.TOOL_CALL_FUNCTION_NAME, functionName);
  span.setAttribute(SpanAttributes.TOOL_CALL_FUNCTION_ARGUMENTS_JSON, JSON.stringify(arguments_));
  if (output) {
    span.setAttribute(SpanAttributes.TOOL_CALL_FUNCTION_OUTPUT, JSON.stringify(output));
  }
};

// Set span status
export const setSpanStatus = (span, success, message = null) => {
  if (!span) return;

  span.setStatus({
    code: success ? 1 : 2, // OK or ERROR
    message: message || (success ? 'Success' : 'Error'),
  });
};

// Record exception in span
export const recordSpanException = (span, error, context = {}) => {
  if (!span || !error) return;

  span.recordException(error);
  span.setStatus({
    code: 2, // ERROR
    message: error.message,
  });
  span.setAttributes({
    'error': true,
    'error.message': error.message,
    'error.type': error.constructor.name,
    'error.stack': error.stack,
    ...context,
  });
};

// Add metadata to span
export const addSpanMetadata = (span, metadata) => {
  if (!span || !metadata) return;

  span.setAttribute(SpanAttributes.METADATA, JSON.stringify(metadata));
};

// Add tags to span
export const addSpanTags = (span, tags) => {
  if (!span || !tags) return;

  span.setAttribute(SpanAttributes.TAG_TAGS, JSON.stringify(tags));
};

// Add session/user context
export const addSpanContext = (span, sessionId = null, userId = null) => {
  if (!span) return;

  if (sessionId) {
    span.setAttribute(SpanAttributes.SESSION_ID, sessionId);
  }
  if (userId) {
    span.setAttribute(SpanAttributes.USER_ID, userId);
  }
};

// Create a tracing decorator for functions
export const traceFunction = (name, kind, attributes = {}) => {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      const span = createOpenInferenceSpan(name, kind, {
        ...attributes,
        'function.name': propertyKey,
        'function.args': JSON.stringify(args),
      });

      try {
        const result = await originalMethod.apply(this, args);
        span.setAttribute(SpanAttributes.OUTPUT_VALUE, JSON.stringify(result));
        setSpanStatus(span, true);
        return result;
      } catch (error) {
        recordSpanException(span, error);
        throw error;
      } finally {
        span.end();
      }
    };

    return descriptor;
  };
};
