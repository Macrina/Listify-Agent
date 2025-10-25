/**
 * Port Configuration for Listify Agent
 * Centralized port management with environment-specific defaults
 */

const getPortConfig = () => {
  const environment = process.env.NODE_ENV || 'development';
  
  const configs = {
    development: {
      backend: process.env.BACKEND_PORT || 3001,
      frontend: process.env.FRONTEND_PORT || 3000,
      api: process.env.API_PORT || 3001,
    },
    production: {
      backend: process.env.PORT || 3001,
      frontend: process.env.FRONTEND_PORT || 3000,
      api: process.env.PORT || 3001,
    },
    test: {
      backend: process.env.BACKEND_PORT || 3002,
      frontend: process.env.FRONTEND_PORT || 3001,
      api: process.env.API_PORT || 3002,
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
