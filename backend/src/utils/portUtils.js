/**
 * Port Utilities for Listify Agent
 * Handles port validation, conflict detection, and graceful fallbacks
 */

import net from 'net';

/**
 * Check if a port is available
 * @param {number} port - Port number to check
 * @returns {Promise<boolean>} - True if port is available
 */
export const isPortAvailable = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false);
    });
  });
};

/**
 * Find the next available port starting from a given port
 * @param {number} startPort - Starting port number
 * @param {number} maxAttempts - Maximum attempts to find available port
 * @returns {Promise<number>} - Available port number
 */
export const findAvailablePort = async (startPort, maxAttempts = 10) => {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    const available = await isPortAvailable(port);
    if (available) {
      return port;
    }
  }
  throw new Error(`No available ports found starting from ${startPort}`);
};

/**
 * Validate port number
 * @param {number} port - Port number to validate
 * @returns {boolean} - True if valid port number
 */
export const isValidPort = (port) => {
  const num = Number(port);
  return Number.isInteger(num) && num > 0 && num <= 65535;
};

/**
 * Get port with fallback mechanism
 * @param {number} preferredPort - Preferred port number
 * @param {number} fallbackPort - Fallback port number
 * @returns {Promise<number>} - Available port number
 */
export const getPortWithFallback = async (preferredPort, fallbackPort) => {
  if (!isValidPort(preferredPort)) {
    console.warn(`Invalid preferred port ${preferredPort}, using fallback ${fallbackPort}`);
    return fallbackPort;
  }

  const isPreferredAvailable = await isPortAvailable(preferredPort);
  if (isPreferredAvailable) {
    return preferredPort;
  }

  console.warn(`Port ${preferredPort} is not available, trying fallback ${fallbackPort}`);
  const isFallbackAvailable = await isPortAvailable(fallbackPort);
  
  if (isFallbackAvailable) {
    return fallbackPort;
  }

  // Find next available port
  const availablePort = await findAvailablePort(fallbackPort);
  console.warn(`Fallback port ${fallbackPort} also not available, using ${availablePort}`);
  return availablePort;
};

/**
 * Check for port conflicts and provide recommendations
 * @param {number} port - Port to check
 * @returns {Promise<Object>} - Conflict information and recommendations
 */
export const checkPortConflicts = async (port) => {
  const available = await isPortAvailable(port);
  
  if (available) {
    return {
      available: true,
      port,
      message: `Port ${port} is available`
    };
  }

  // Try to find alternative ports
  const alternatives = await Promise.all([
    findAvailablePort(port + 1, 5),
    findAvailablePort(port - 1, 5),
    findAvailablePort(3000, 10)
  ]);

  return {
    available: false,
    port,
    alternatives: alternatives.filter(p => p !== port),
    message: `Port ${port} is in use. Consider using: ${alternatives.join(', ')}`
  };
};
