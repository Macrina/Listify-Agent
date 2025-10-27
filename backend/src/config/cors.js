/**
 * CORS Configuration for Listify Agent
 * Environment-specific CORS settings with security best practices
 */

import getPortConfig from './ports.js';

const portConfig = getPortConfig();

/**
 * Get CORS origins based on environment
 */
const getCorsOrigins = () => {
  const baseOrigins = [
    `http://localhost:${portConfig.frontend}`,
    `http://127.0.0.1:${portConfig.frontend}`,
  ];

  // Add environment-specific origins
  if (portConfig.isDevelopment) {
    return [
      ...baseOrigins,
      `http://localhost:${portConfig.frontend + 1}`, // Vite fallback port
      `http://127.0.0.1:${portConfig.frontend + 1}`,
      'http://localhost:5173', // Vite default
      'http://localhost:3000', // React default
    ];
  }

  if (portConfig.isProduction) {
    return [
      ...baseOrigins,
      process.env.FRONTEND_URL,
      'https://listify-agent-frontend.onrender.com',
      'https://listify-agent.onrender.com',
    ].filter(Boolean);
  }

  if (portConfig.isTest) {
    return [
      ...baseOrigins,
      'http://localhost:3001',
      'http://localhost:3002',
    ];
  }

  return baseOrigins;
};

/**
 * CORS configuration with security best practices
 */
export const corsConfig = {
  origin: (origin, callback) => {
    const allowedOrigins = getCorsOrigins();
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Log blocked origins in development
    if (portConfig.isDevelopment) {
      console.warn(`CORS: Blocked origin ${origin}. Allowed origins:`, allowedOrigins);
    }

    // In production, be more strict
    if (portConfig.isProduction) {
      console.error(`CORS: Blocked unauthorized origin ${origin}`);
      return callback(new Error('Not allowed by CORS'), false);
    }

    // In development, be more permissive
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Response-Time',
    'X-Request-ID',
  ],
  optionsSuccessStatus: 200, // For legacy browser support
  maxAge: 86400, // 24 hours
};

/**
 * Development-specific CORS (more permissive)
 */
export const developmentCorsConfig = {
  ...corsConfig,
  origin: true, // Allow all origins in development
  credentials: true,
};

/**
 * Production-specific CORS (strict)
 */
export const productionCorsConfig = {
  ...corsConfig,
  origin: corsConfig.origin, // Use strict origin checking
  credentials: true,
};

/**
 * Get appropriate CORS config based on environment
 */
export const getCorsConfig = () => {
  if (portConfig.isDevelopment) {
    return developmentCorsConfig;
  }
  
  if (portConfig.isProduction) {
    return productionCorsConfig;
  }
  
  return corsConfig;
};

/**
 * CORS preflight handler
 */
export const corsPreflightHandler = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    res.status(200).end();
  } else {
    next();
  }
};
