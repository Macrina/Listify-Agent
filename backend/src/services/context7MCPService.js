/**
 * Context7 MCP Integration Service
 * 
 * This service integrates Context7 MCP for enhanced documentation
 * and code context retrieval in the Listify Agent application.
 */

import { spawn } from 'child_process';
import { EventEmitter } from 'events';

export class Context7MCPService extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      apiKey: config.apiKey || process.env.CONTEXT7_API_KEY,
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      ...config
    };
    this.isConnected = false;
    this.process = null;
  }

  /**
   * Initialize Context7 MCP connection
   */
  async initialize() {
    try {
      if (!this.config.apiKey) {
        throw new Error('CONTEXT7_API_KEY is required');
      }

      console.log('🔧 Initializing Context7 MCP...');
      
      // Start the Context7 MCP server process
      this.process = spawn('npx', ['@upstash/context7-mcp'], {
        env: {
          ...process.env,
          CONTEXT7_API_KEY: this.config.apiKey
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.process.stdout.on('data', (data) => {
        console.log('Context7 MCP:', data.toString());
        this.emit('data', data.toString());
      });

      this.process.stderr.on('data', (data) => {
        const message = data.toString();
        // Context7 MCP server outputs status messages to stderr, not errors
        if (message.includes('Context7 Documentation MCP Server running')) {
          console.log('✅ Context7 MCP Server:', message.trim());
        } else if (message.trim()) {
          // Only log non-empty messages, don't emit as errors
          console.log('Context7 MCP Info:', message.trim());
        }
      });

      // Prevent stderr from being treated as unhandled errors
      this.process.stderr.on('error', (error) => {
        // Silently handle stderr errors to prevent server crash
        console.log('Context7 MCP stderr error (handled):', error.message);
      });

      this.process.on('close', (code) => {
        console.log(`Context7 MCP process exited with code ${code}`);
        this.isConnected = false;
        this.emit('close', code);
      });

      this.process.on('error', (error) => {
        console.error('❌ Context7 MCP process error:', error.message);
        this.isConnected = false;
        // Don't emit error to prevent server crash, just log it
        console.log('⚠️  Context7 MCP will continue without enhanced documentation features');
      });

      this.isConnected = true;
      console.log('✅ Context7 MCP initialized successfully');
      
      // Get available tools
      await this.getAvailableTools();
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Context7 MCP:', error.message);
      this.emit('error', error);
      return false;
    }
  }

  /**
   * Get available tools from Context7 MCP
   */
  async getAvailableTools() {
    try {
      const requestId = Date.now();
      const toolsRequest = {
        jsonrpc: '2.0',
        id: requestId,
        method: 'tools/list',
        params: {}
      };

      this.process.stdin.write(JSON.stringify(toolsRequest) + '\n');
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Tools list request timeout'));
        }, 5000);

        const handleResponse = (data) => {
          try {
            const response = JSON.parse(data);
            if (response.id === requestId) {
              clearTimeout(timeout);
              this.removeListener('data', handleResponse);
              if (response.error) {
                console.error('❌ Failed to get tools list:', response.error);
                reject(new Error(response.error.message || 'Failed to get tools list'));
              } else {
                console.log('✅ Available Context7 tools:', response.result);
                this.availableTools = response.result.tools || [];
                resolve(response.result);
              }
            }
          } catch (error) {
            // Not a JSON response, ignore
          }
        };

        this.on('data', handleResponse);
      });
    } catch (error) {
      console.error('❌ Failed to get available tools:', error.message);
    }
  }

  /**
   * Resolve library name to Context7-compatible ID
   * @param {string} libraryName - Library name to resolve
   */
  async resolveLibraryId(libraryName) {
    if (!this.isConnected) {
      throw new Error('Context7 MCP not connected');
    }

    try {
      const requestId = Date.now();
      const resolveRequest = {
        jsonrpc: '2.0',
        id: requestId,
        method: 'tools/call',
        params: {
          name: 'resolve-library-id',
          arguments: {
            libraryName
          }
        }
      };

      this.process.stdin.write(JSON.stringify(resolveRequest) + '\n');
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Resolve request timeout'));
        }, this.config.timeout);

        const handleResponse = (data) => {
          try {
            const response = JSON.parse(data);
            if (response.id === requestId) {
              clearTimeout(timeout);
              this.removeListener('data', handleResponse);
              if (response.error) {
                reject(new Error(response.error.message || 'MCP request failed'));
              } else {
                resolve(response.result);
              }
            }
          } catch (error) {
            // Not a JSON response, ignore
          }
        };

        this.on('data', handleResponse);

        this.once('error', (error) => {
          clearTimeout(timeout);
          this.removeListener('data', handleResponse);
          reject(error);
        });
      });
    } catch (error) {
      console.error('❌ Context7 resolve failed:', error.message);
      throw error;
    }
  }

  /**
   * Get library documentation
   * @param {string} libraryId - Context7-compatible library ID
   * @param {Object} options - Options for documentation retrieval
   */
  async getLibraryDocs(libraryId, options = {}) {
    if (!this.isConnected) {
      throw new Error('Context7 MCP not connected');
    }

    try {
      const requestId = Date.now();
      const docsRequest = {
        jsonrpc: '2.0',
        id: requestId,
        method: 'tools/call',
        params: {
          name: 'get-library-docs',
          arguments: {
            context7CompatibleLibraryID: libraryId,
            topic: options.topic || null,
            tokens: options.tokens || 5000
          }
        }
      };

      this.process.stdin.write(JSON.stringify(docsRequest) + '\n');
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Documentation request timeout'));
        }, this.config.timeout);

        const handleResponse = (data) => {
          try {
            const response = JSON.parse(data);
            if (response.id === requestId) {
              clearTimeout(timeout);
              this.removeListener('data', handleResponse);
              if (response.error) {
                reject(new Error(response.error.message || 'MCP request failed'));
              } else {
                resolve(response.result);
              }
            }
          } catch (error) {
            // Not a JSON response, ignore
          }
        };

        this.on('data', handleResponse);

        this.once('error', (error) => {
          clearTimeout(timeout);
          this.removeListener('data', handleResponse);
          reject(error);
        });
      });
    } catch (error) {
      console.error('❌ Context7 docs failed:', error.message);
      throw error;
    }
  }

  /**
   * Search for documentation and code examples
   * @param {string} query - Search query
   * @param {Object} options - Search options
   */
  async searchDocumentation(query, options = {}) {
    try {
      // First resolve the library ID
      const resolveResult = await this.resolveLibraryId(query);
      
      // Extract the library ID from the result
      const libraryId = resolveResult.content?.[0]?.text || null;
      
      if (!libraryId) {
        throw new Error('Could not resolve library ID for query: ' + query);
      }

      // Then get the documentation
      const docsResult = await this.getLibraryDocs(libraryId, options);
      
      return {
        query,
        libraryId,
        documentation: docsResult.content?.[0]?.text || docsResult,
        resolveResult,
        docsResult
      };
    } catch (error) {
      console.error('❌ Context7 search failed:', error.message);
      throw error;
    }
  }

  /**
   * Get specific documentation for a library/framework
   * @param {string} library - Library name
   * @param {string} version - Version (optional)
   */
  async getDocumentation(library, version = null) {
    const query = version ? `${library}@${version}` : library;
    return this.searchDocumentation(query, {
      topic: null,
      tokens: 5000
    });
  }

  /**
   * Get code examples for a specific topic
   * @param {string} topic - Topic to search for
   * @param {string} language - Programming language
   */
  async getCodeExamples(topic, language = 'javascript') {
    return this.searchDocumentation(`${language} ${topic}`, {
      topic: topic,
      tokens: 3000
    });
  }

  /**
   * Get React-specific documentation
   * @param {string} component - React component or hook name
   */
  async getReactDocs(component) {
    return this.searchDocumentation('react', {
      topic: component,
      tokens: 5000
    });
  }

  /**
   * Get Node.js/Express documentation
   * @param {string} topic - Express topic
   */
  async getExpressDocs(topic) {
    return this.searchDocumentation('express', {
      topic: topic,
      tokens: 5000
    });
  }

  /**
   * Get Python documentation
   * @param {string} library - Python library name
   */
  async getPythonDocs(library) {
    return this.searchDocumentation(library, {
      topic: null,
      tokens: 5000
    });
  }

  /**
   * Shutdown the MCP connection
   */
  async shutdown() {
    if (this.process) {
      this.process.kill();
      this.isConnected = false;
      console.log('✅ Context7 MCP connection closed');
    }
  }
}

// Export singleton instance
export const context7MCP = new Context7MCPService();

// Export service class for custom instances
export default Context7MCPService;
