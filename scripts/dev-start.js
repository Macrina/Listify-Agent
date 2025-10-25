#!/usr/bin/env node
/**
 * Development Startup Script for Listify Agent
 * Handles port conflicts, service discovery, and graceful startup
 */

import { spawn } from 'child_process';
import { isPortAvailable, findAvailablePort } from '../backend/src/utils/portUtils.js';
import getPortConfig from '../backend/src/config/ports.js';

const portConfig = getPortConfig();

/**
 * Start backend server with port validation
 */
async function startBackend() {
  console.log('🚀 Starting Backend Server...');
  
  try {
    // Check if preferred port is available
    const backendPort = await findAvailablePort(portConfig.backend, 5);
    
    if (backendPort !== portConfig.backend) {
      console.log(`⚠️  Port ${portConfig.backend} not available, using ${backendPort}`);
    }
    
    const backend = spawn('npm', ['start'], {
      cwd: './backend',
      stdio: 'inherit',
      env: { 
        ...process.env, 
        PORT: backendPort,
        NODE_ENV: 'development'
      }
    });
    
    backend.on('error', (err) => {
      console.error('❌ Backend startup error:', err);
    });
    
    return { process: backend, port: backendPort };
  } catch (error) {
    console.error('❌ Failed to start backend:', error.message);
    process.exit(1);
  }
}

/**
 * Start frontend server with port validation
 */
async function startFrontend() {
  console.log('🎨 Starting Frontend Server...');
  
  try {
    // Wait a moment for backend to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const frontendPort = await findAvailablePort(portConfig.frontend, 5);
    
    if (frontendPort !== portConfig.frontend) {
      console.log(`⚠️  Port ${portConfig.frontend} not available, using ${frontendPort}`);
    }
    
    const frontend = spawn('npm', ['run', 'dev'], {
      cwd: './frontend',
      stdio: 'inherit',
      env: { 
        ...process.env, 
        VITE_PORT: frontendPort,
        VITE_API_URL: `http://localhost:${portConfig.backend}`
      }
    });
    
    frontend.on('error', (err) => {
      console.error('❌ Frontend startup error:', err);
    });
    
    return { process: frontend, port: frontendPort };
  } catch (error) {
    console.error('❌ Failed to start frontend:', error.message);
    process.exit(1);
  }
}

/**
 * Main startup function
 */
async function startDevelopment() {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║       🚀  Listify Agent Development Server       ║
║                                                   ║
║       Environment: ${portConfig.environment.padEnd(20)} ║
║       Backend Port: ${portConfig.backend.toString().padEnd(20)} ║
║       Frontend Port: ${portConfig.frontend.toString().padEnd(19)} ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);

  try {
    // Start backend first
    const backend = await startBackend();
    
    // Start frontend
    const frontend = await startFrontend();
    
    console.log(`
✅ Development servers started successfully!

🌐 Frontend: http://localhost:${frontend.port}
🔧 Backend:  http://localhost:${backend.port}
📊 Health:   http://localhost:${backend.port}/api/health

Press Ctrl+C to stop all servers
    `);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down servers...');
      backend.process.kill();
      frontend.process.kill();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 Shutting down servers...');
      backend.process.kill();
      frontend.process.kill();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start development servers:', error.message);
    process.exit(1);
  }
}

// Start the development environment
startDevelopment();
