/**
 * Port Configuration for Listify Agent
 * Centralized port management with environment-specific defaults
 */

const getPortConfig = () => {
  const environment = process.env.NODE_ENV || 'development';
  
  // For production, always use the PORT environment variable (required by Render)
  const backendPort = environment === 'production' 
    ? parseInt(process.env.PORT || '3001', 10)
    : parseInt(process.env.BACKEND_PORT || process.env.PORT || '3001', 10);
  
  const configs = {
    development: {
      backend: backendPort,
      frontend: parseInt(process.env.FRONTEND_PORT || '3000', 10),
      api: backendPort,
    },
    production: {
      backend: backendPort,
      frontend: parseInt(process.env.FRONTEND_PORT || '3000', 10),
      api: backendPort,
    },
    test: {
      backend: parseInt(process.env.BACKEND_PORT || '3002', 10),
      frontend: parseInt(process.env.FRONTEND_PORT || '3001', 10),
      api: parseInt(process.env.API_PORT || '3002', 10),
    }
  };

  const config = configs[environment] || configs.development;
  
  return {
    ...config,
    environment,
    isDevelopment: environment === 'development',
    isProduction: environment === 'production',
    isTest: environment === 'test',
  };
};

export default getPortConfig;
