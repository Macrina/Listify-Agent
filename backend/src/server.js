import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import listRoutes from './routes/listRoutes.js';
import context7Routes from './routes/context7Routes.js';
import getPortConfig from './config/ports.js';
import { getCorsConfig } from './config/cors.js';
import { getPortWithFallback } from './utils/portUtils.js';
import { healthCheck, basicHealthCheck, detailedHealthCheck, readinessCheck, livenessCheck } from './middleware/healthMonitor.js';
import { initializeArizeTracing } from './config/arize.js';
import { tracingMiddleware, tracingErrorHandler } from './middleware/tracingMiddleware.js';
import { evaluationMiddleware } from './evaluations/evaluationMiddleware.js';

// Load environment variables
dotenv.config();

// Initialize Arize tracing FIRST before any other imports that might use tracing
console.log('🔧 Initializing observability...');
const { tracerProvider, tracer } = initializeArizeTracing();

// Log environment info for debugging
console.log('🔧 Environment Info:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  NODE_VERSION: process.version,
  PLATFORM: process.platform,
  ARCH: process.arch
});

const app = express();
const portConfig = getPortConfig();

console.log('🔧 Port Config:', portConfig);

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors(getCorsConfig()));

// Tracing middleware - must be before routes to capture all API calls
app.use('/api', tracingMiddleware);

// Evaluation middleware - optionally evaluates API responses (set ENABLE_EVALUATIONS=true)
app.use('/api', evaluationMiddleware);

app.use(morgan('dev')); // Logging
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api', listRoutes);
app.use('/api/context7', context7Routes);

// Enhanced health endpoints
app.get('/api/health', basicHealthCheck); // Simple health check for Render
app.get('/api/health/detailed', detailedHealthCheck);
app.get('/api/health/readiness', readinessCheck);
app.get('/api/health/liveness', livenessCheck);

// Serve static files from frontend build in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  
  // Try to serve frontend build (will fail gracefully if not found)
  app.use(express.static(frontendPath));
  
  // Serve frontend for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
  
  console.log('✅ Production mode: serving frontend from', frontendPath);
} else {
  // Development root endpoint
  app.get('/', (req, res) => {
    res.json({
      message: 'Welcome to Listify Agent API',
      version: '1.0.0',
        endpoints: {
          health: '/api/health',
          uploadImage: 'POST /api/upload',
          analyzeText: 'POST /api/analyze-text',
          getLists: 'GET /api/lists',
          getList: 'GET /api/lists/:id',
          updateItem: 'PUT /api/items/:id',
          deleteItem: 'DELETE /api/items/:id',
          search: 'GET /api/search?q=keyword',
          stats: 'GET /api/stats',
          context7: {
            search: 'GET /api/context7/search?q=query',
            docs: 'GET /api/context7/docs/:library',
            examples: 'GET /api/context7/examples?topic=topic&language=js',
            react: 'GET /api/context7/react/:component',
            express: 'GET /api/context7/express/:topic',
            python: 'GET /api/context7/python/:library',
            status: 'GET /api/context7/status'
          }
        },
    });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Start server with port validation
const startServer = async () => {
  try {
    // In production, use the exact PORT from environment (required by Render)
    const PORT = portConfig.isProduction 
      ? portConfig.backend 
      : await getPortWithFallback(portConfig.backend, portConfig.backend + 1);
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║       🚀  Listify Agent API Server                ║
║                                                   ║
║       Status: Running                             ║
║       Port: ${PORT}                                  ║
║       Environment: ${portConfig.environment.padEnd(20)} ║
║                                                   ║
║       API Docs: http://localhost:${PORT}/            ║
║       Health Check: http://localhost:${PORT}/api/health ║
║       Detailed Health: http://localhost:${PORT}/api/health/detailed ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

export default app;
