/**
 * Tracing Middleware for Express Routes
 * Ensures all API requests create spans in Arize
 */

import { trace } from '@opentelemetry/api';
import { flushTraces } from '../config/arize.js';

/**
 * Middleware to create spans for all API requests
 */
export const tracingMiddleware = (req, res, next) => {
  const tracer = trace.getTracer('listify-agent-api', '1.0.0');
  const spanName = `${req.method} ${req.path}`;
  
  // Create span for this request
  const span = tracer.startSpan(spanName, {
    attributes: {
      'http.method': req.method,
      'http.url': req.url,
      'http.route': req.path,
      'http.target': req.path,
      'service.name': 'listify-agent',
      'service.version': '1.0.0',
    },
  });

  // Add request context
  if (req.body && Object.keys(req.body).length > 0) {
    try {
      const bodyPreview = JSON.stringify(req.body).substring(0, 500);
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
    
    if (res.statusCode >= 400) {
      span.setStatus({ code: 2, message: `HTTP ${res.statusCode}` }); // ERROR status
    } else {
      span.setStatus({ code: 1 }); // OK status
    }

    // Add response preview if possible
    if (data && typeof data === 'string' && data.length < 500) {
      try {
        span.setAttribute('http.response.body.preview', data);
      } catch (e) {
        // Ignore serialization errors
      }
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

