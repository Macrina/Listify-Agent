/**
 * Health Monitoring Middleware for Listify Agent
 * Comprehensive health checks across all services and ports
 */

import { healthCheck as agentdbHealthCheck } from '../services/agentdbRealService.js';

/**
 * System health information
 */
const getSystemHealth = async () => {
  const startTime = Date.now();
  
  try {
    // Check AgentDB connection
    const agentdbStatus = await checkAgentDBHealth();
    
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryStatus = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024), // MB
    };

    // Check uptime
    const uptime = process.uptime();
    
    // Check environment
    const environment = {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3001,
      pid: process.pid,
    };

    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      uptime: `${Math.round(uptime)}s`,
      environment,
      memory: memoryStatus,
      services: {
        agentdb: agentdbStatus,
        api: { status: 'healthy', port: process.env.PORT || 3001 },
      },
      version: '1.0.0'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        agentdb: { status: 'error', error: error.message },
        api: { status: 'error', error: error.message }
      }
    };
  }
};

/**
 * Check AgentDB service health
 */
const checkAgentDBHealth = async () => {
  try {
    const startTime = Date.now();
    await agentdbHealthCheck();
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      url: process.env.AGENTDB_MCP_URL || 'https://mcp.agentdb.dev/LW-aEoVKYL'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      url: process.env.AGENTDB_MCP_URL || 'https://mcp.agentdb.dev/LW-aEoVKYL'
    };
  }
};

/**
 * Health check endpoint handler
 */
export const healthCheck = async (req, res) => {
  try {
    const health = await getSystemHealth();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: health.status === 'healthy',
      message: health.status === 'healthy' 
        ? 'Listify Agent API is running' 
        : 'Service health issues detected',
      ...health
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Simple health check for Render deployment
 */
export const basicHealthCheck = (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || '3001',
    version: '1.0.0',
    uptime: `${Math.round(process.uptime())}s`
  });
};

/**
 * Detailed health check for monitoring systems
 */
export const detailedHealthCheck = async (req, res) => {
  try {
    const health = await getSystemHealth();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};

/**
 * Readiness probe for container orchestration
 */
export const readinessCheck = async (req, res) => {
  try {
    // Check if all critical services are ready
    const agentdbStatus = await checkAgentDBHealth();
    
    if (agentdbStatus.status === 'healthy') {
      res.status(200).json({
        success: true,
        message: 'Service is ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        success: false,
        message: 'Service not ready',
        timestamp: new Date().toISOString(),
        reason: 'AgentDB connection failed'
      });
    }
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Readiness check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Liveness probe for container orchestration
 */
export const livenessCheck = async (req, res) => {
  // Simple liveness check - if the process is running, it's alive
  res.status(200).json({
    success: true,
    message: 'Service is alive',
    timestamp: new Date().toISOString(),
    uptime: `${Math.round(process.uptime())}s`
  });
};
