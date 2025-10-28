/**
 * Context7 MCP API Routes
 * 
 * Provides endpoints for Context7 documentation search
 * and code example retrieval.
 */

import express from 'express';
import { context7MCP } from '../services/context7MCPService.js';

const router = express.Router();

// Initialize Context7 MCP on startup
let context7Initialized = false;

const initializeContext7 = async () => {
  if (!context7Initialized) {
    try {
      console.log('🔧 Initializing Context7 MCP...');
      await context7MCP.initialize();
      context7Initialized = true;
      console.log('✅ Context7 MCP routes initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Context7 MCP routes:', error.message);
      console.log('⚠️  Context7 MCP features will be disabled, but server will continue running');
      // Don't set context7Initialized = true, so routes will return 503
    }
  }
};

// Initialize on module load (non-blocking) - DISABLED FOR NOW
// initializeContext7().catch(error => {
//   console.error('❌ Context7 MCP initialization failed:', error.message);
//   console.log('⚠️  Server will continue without Context7 MCP features');
// });

// Skip Context7 MCP initialization to prevent server crashes
console.log('⚠️  Context7 MCP disabled to prevent server crashes');

/**
 * GET /api/context7/search
 * Search for documentation and code examples
 */
router.get('/search', async (req, res) => {
  try {
    const { q: query, limit = 10, sources, language } = req.query;

    if (!query) {
      return res.status(400).json({
        error: 'Query parameter "q" is required'
      });
    }

    if (!context7Initialized) {
      return res.status(503).json({
        error: 'Context7 MCP not initialized'
      });
    }

    const options = {
      limit: parseInt(limit),
      sources: sources ? sources.split(',') : undefined,
      language
    };

    const results = await context7MCP.searchDocumentation(query, options);

    res.json({
      success: true,
      query,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Context7 search error:', error.message);
    res.status(500).json({
      error: 'Search failed',
      message: error.message
    });
  }
});

/**
 * GET /api/context7/docs/:library
 * Get specific library documentation
 */
router.get('/docs/:library', async (req, res) => {
  try {
    const { library } = req.params;
    const { version } = req.query;

    if (!context7Initialized) {
      return res.status(503).json({
        error: 'Context7 MCP not initialized'
      });
    }

    const docs = await context7MCP.getDocumentation(library, version);

    res.json({
      success: true,
      library,
      version: version || 'latest',
      documentation: docs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Context7 docs error:', error.message);
    res.status(500).json({
      error: 'Documentation retrieval failed',
      message: error.message
    });
  }
});

/**
 * GET /api/context7/examples
 * Get code examples for a specific topic
 */
router.get('/examples', async (req, res) => {
  try {
    const { topic, language = 'javascript' } = req.query;

    if (!topic) {
      return res.status(400).json({
        error: 'Topic parameter is required'
      });
    }

    if (!context7Initialized) {
      return res.status(503).json({
        error: 'Context7 MCP not initialized'
      });
    }

    const examples = await context7MCP.getCodeExamples(topic, language);

    res.json({
      success: true,
      topic,
      language,
      examples,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Context7 examples error:', error.message);
    res.status(500).json({
      error: 'Examples retrieval failed',
      message: error.message
    });
  }
});

/**
 * GET /api/context7/react/:component
 * Get React-specific documentation
 */
router.get('/react/:component', async (req, res) => {
  try {
    const { component } = req.params;

    if (!context7Initialized) {
      return res.status(503).json({
        error: 'Context7 MCP not initialized'
      });
    }

    const reactDocs = await context7MCP.getReactDocs(component);

    res.json({
      success: true,
      component,
      documentation: reactDocs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Context7 React docs error:', error.message);
    res.status(500).json({
      error: 'React documentation retrieval failed',
      message: error.message
    });
  }
});

/**
 * GET /api/context7/express/:topic
 * Get Express.js documentation
 */
router.get('/express/:topic', async (req, res) => {
  try {
    const { topic } = req.params;

    if (!context7Initialized) {
      return res.status(503).json({
        error: 'Context7 MCP not initialized'
      });
    }

    const expressDocs = await context7MCP.getExpressDocs(topic);

    res.json({
      success: true,
      topic,
      documentation: expressDocs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Context7 Express docs error:', error.message);
    res.status(500).json({
      error: 'Express documentation retrieval failed',
      message: error.message
    });
  }
});

/**
 * GET /api/context7/python/:library
 * Get Python library documentation
 */
router.get('/python/:library', async (req, res) => {
  try {
    const { library } = req.params;

    if (!context7Initialized) {
      return res.status(503).json({
        error: 'Context7 MCP not initialized'
      });
    }

    const pythonDocs = await context7MCP.getPythonDocs(library);

    res.json({
      success: true,
      library,
      documentation: pythonDocs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Context7 Python docs error:', error.message);
    res.status(500).json({
      error: 'Python documentation retrieval failed',
      message: error.message
    });
  }
});

/**
 * GET /api/context7/status
 * Check Context7 MCP status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    initialized: context7Initialized,
    connected: context7MCP.isConnected,
    timestamp: new Date().toISOString()
  });
});

export default router;
