/**
 * Tracing Middleware for Express Routes
 * Ensures all API requests create spans in Arize
 */

import { trace } from '@opentelemetry/api';
import { flushTraces } from '../config/arize.js';
import { SpanAttributes, SpanKinds } from '../utils/tracing.js';

/**
 * Middleware to create spans for all API requests
 */
export const tracingMiddleware = (req, res, next) => {
  const tracer = trace.getTracer('listify-agent-api', '1.0.0');
  // Use a more descriptive span name that will show up clearly in Arize
  const spanName = `API: ${req.method} ${req.path}`;
  
  // Create span for this request with OpenInference attributes
  const span = tracer.startSpan(spanName, {
    attributes: {
      // OpenInference span kind
      [SpanAttributes.OPENINFERENCE_SPAN_KIND]: SpanKinds.AGENT,
      // HTTP attributes
      'http.method': req.method,
      'http.url': req.url,
      'http.route': req.path,
      'http.target': req.path,
      'http.scheme': req.protocol || 'http',
      'http.host': req.get('host') || 'localhost',
      // Service attributes
      'service.name': 'listify-agent',
      'service.version': '1.0.0',
      // Custom attributes
      'api.endpoint': req.path,
      'api.operation': req.method,
    },
  });

  // Add request context with OpenInference input attributes
  if (req.body && Object.keys(req.body).length > 0) {
    try {
      const bodyStr = JSON.stringify(req.body);
      const bodyPreview = bodyStr.substring(0, 500);
      // Use OpenInference input attribute
      span.setAttribute(SpanAttributes.INPUT_VALUE, bodyStr);
      span.setAttribute('http.request.body.preview', bodyPreview);
    } catch (e) {
      // Ignore serialization errors
    }
  }

  // Store span on request object for later use
  req.span = span;

  // Monitor response
  const originalSend = res.send;
  res.send = function (data) {
    // Set response attributes
    span.setAttribute('http.status_code', res.statusCode);
    span.setAttribute('http.status_text', res.statusMessage || 'OK');
    
    // Add output value for OpenInference
    if (data && typeof data === 'string') {
      try {
        // Try to parse as JSON to add structured output
        const parsed = JSON.parse(data);
        span.setAttribute(SpanAttributes.OUTPUT_VALUE, JSON.stringify(parsed));
      } catch (e) {
        // If not JSON, use as-is (truncated)
        const preview = data.substring(0, 1000);
        span.setAttribute(SpanAttributes.OUTPUT_VALUE, preview);
      }
    }
    
    if (res.statusCode >= 400) {
      span.setStatus({ code: 2, message: `HTTP ${res.statusCode}` }); // ERROR status
    } else {
      span.setStatus({ code: 1 }); // OK status
    }

    // End span
    span.end();

    // Flush traces for important operations
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
      flushTraces().catch(err => {
        console.warn('Failed to flush traces:', err.message);
      });
    }

    // Call original send
    return originalSend.call(this, data);
  };

  // Handle errors
  res.on('finish', () => {
    if (res.statusCode >= 500) {
      span.setStatus({ code: 2, message: `Server Error: ${res.statusCode}` });
    }
  });

  next();
};

/**
 * Error handler that records exceptions in spans
 */
export const tracingErrorHandler = (err, req, res, next) => {
  if (req.span) {
    req.span.recordException(err);
    req.span.setStatus({ code: 2, message: err.message });
    req.span.end();
  }
  next(err);
};

