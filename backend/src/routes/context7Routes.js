/**
 * Context7 MCP API Routes - DISABLED
 * 
 * Context7 MCP is temporarily disabled to prevent server crashes.
 * The service was causing unhandled error events that crashed the server.
 */

import express from 'express';
const router = express.Router();

console.log('⚠️  Context7 MCP routes disabled to prevent server crashes');

/**
 * GET /api/context7/status
 * Check Context7 MCP status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    initialized: false,
    connected: false,
    status: 'disabled',
    message: 'Context7 MCP is temporarily disabled to prevent server crashes',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/context7/search
 * Search for documentation and code examples
 */
router.get('/search', (req, res) => {
  res.status(503).json({
    error: 'Context7 MCP is disabled',
    message: 'Context7 MCP is temporarily disabled to prevent server crashes',
    available: false
  });
});

/**
 * GET /api/context7/docs/:library
 * Get specific library documentation
 */
router.get('/docs/:library', (req, res) => {
  res.status(503).json({
    error: 'Context7 MCP is disabled',
    message: 'Context7 MCP is temporarily disabled to prevent server crashes',
    available: false
  });
});

/**
 * GET /api/context7/examples
 * Get code examples for a specific topic
 */
router.get('/examples', (req, res) => {
  res.status(503).json({
    error: 'Context7 MCP is disabled',
    message: 'Context7 MCP is temporarily disabled to prevent server crashes',
    available: false
  });
});

/**
 * GET /api/context7/react/:component
 * Get React-specific documentation
 */
router.get('/react/:component', (req, res) => {
  res.status(503).json({
    error: 'Context7 MCP is disabled',
    message: 'Context7 MCP is temporarily disabled to prevent server crashes',
    available: false
  });
});

/**
 * GET /api/context7/express/:topic
 * Get Express.js documentation
 */
router.get('/express/:topic', (req, res) => {
  res.status(503).json({
    error: 'Context7 MCP is disabled',
    message: 'Context7 MCP is temporarily disabled to prevent server crashes',
    available: false
  });
});

/**
 * GET /api/context7/python/:library
 * Get Python library documentation
 */
router.get('/python/:library', (req, res) => {
  res.status(503).json({
    error: 'Context7 MCP is disabled',
    message: 'Context7 MCP is temporarily disabled to prevent server crashes',
    available: false
  });
});

export default router;