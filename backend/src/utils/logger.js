/**
 * Structured Logger with Trace ID Integration
 * Logs include trace and span IDs for correlation with traces in Arize
 */

import { trace } from '@opentelemetry/api';

/**
 * Get current trace context for logging
 * @returns {Object} - Trace context with traceId and spanId
 */
function getTraceContext() {
  const activeSpan = trace.getActiveSpan();
  if (activeSpan) {
    const spanContext = activeSpan.spanContext();
    return {
      trace_id: spanContext.traceId,
      span_id: spanContext.spanId,
      trace_flags: spanContext.traceFlags
    };
  }
  return {
    trace_id: null,
    span_id: null,
    trace_flags: null
  };
}

/**
 * Structured log entry
 * @param {string} level - Log level (info, warn, error, debug)
 * @param {string} message - Log message
 * @param {Object} data - Additional data to log
 */
function log(level, message, data = {}) {
  const traceContext = getTraceContext();
  const logEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    trace_id: traceContext.trace_id,
    span_id: traceContext.span_id,
    ...data
  };
  
  // Format for console output (JSON for structured logging)
  const logString = JSON.stringify(logEntry);
  
  switch (level) {
    case 'error':
      console.error(logString);
      break;
    case 'warn':
      console.warn(logString);
      break;
    case 'debug':
      console.debug(logString);
      break;
    default:
      console.log(logString);
  }
  
  return logEntry;
}

/**
 * Logger object with convenience methods
 */
export const logger = {
  info: (message, data) => log('info', message, data),
  warn: (message, data) => log('warn', message, data),
  error: (message, data) => log('error', message, data),
  debug: (message, data) => log('debug', message, data),
  
  // Specialized loggers
  api: (req, res, data = {}) => {
    log('info', `${req.method} ${req.path}`, {
      type: 'api_request',
      method: req.method,
      path: req.path,
      status_code: res.statusCode,
      ...data
    });
  },
  
  db: (operation, query, data = {}) => {
    log('info', `Database ${operation}`, {
      type: 'database_operation',
      operation,
      query: query.substring(0, 200), // Truncate long queries
      ...data
    });
  },
  
  llm: (model, operation, data = {}) => {
    log('info', `LLM ${operation}`, {
      type: 'llm_operation',
      model,
      operation,
      ...data
    });
  }
};

export default logger;

