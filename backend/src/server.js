import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import listRoutes from './routes/listRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://listify-agent-frontend.onrender.com',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
}));

app.use(morgan('dev')); // Logging
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api', listRoutes);

// Serve static files from frontend build in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
  
  // Serve frontend for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
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

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║       🚀  Listify Agent API Server                ║
║                                                   ║
║       Status: Running                             ║
║       Port: ${PORT}                                  ║
║       Environment: ${process.env.NODE_ENV || 'development'}                    ║
║                                                   ║
║       API Docs: http://localhost:${PORT}/            ║
║       Health Check: http://localhost:${PORT}/api/health ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
});

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
