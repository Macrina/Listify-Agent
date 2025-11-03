/**
 * Real AgentDB Service using actual MCP integration
 * This service connects to the real AgentDB database
 */

// Load environment variables
import { config } from 'dotenv';
config();
import { trace, context } from '@opentelemetry/api';
import { createToolSpan, setSpanStatus, recordSpanException, SpanKinds, SpanAttributes } from '../utils/tracing.js';

// AgentDB Configuration
const agentdbConfig = {
  mcpUrl: process.env.AGENTDB_MCP_URL || 'https://mcp.agentdb.dev/eq1MHpX-qn',
  apiKey: process.env.AGENTDB_API_KEY || 'your-api-key-here',
  dbName: process.env.AGENTDB_DB_NAME || 'listify-agent'
};

/**
 * Check if an error is retryable (transient database errors)
 * @param {Error|Object} error - The error to check
 * @returns {boolean} - True if the error is retryable
 */
function isRetryableError(error) {
  const errorMessage = error?.message || error?.error || '';
  const lowerMessage = errorMessage.toLowerCase();
  
  // Check for retryable errors
  return (
    lowerMessage.includes('database is locked') ||
    lowerMessage.includes('failed to acquire lease') ||
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('connection') ||
    lowerMessage.includes('temporary')
  );
}

/**
 * Sleep for a given number of milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get query type from SQL statement
 * @param {string} query - SQL query
 * @returns {string} - Query type (SELECT, INSERT, UPDATE, DELETE, etc.)
 */
function getQueryType(query) {
  const trimmed = query.trim().toUpperCase();
  if (trimmed.startsWith('SELECT')) return 'SELECT';
  if (trimmed.startsWith('INSERT')) return 'INSERT';
  if (trimmed.startsWith('UPDATE')) return 'UPDATE';
  if (trimmed.startsWith('DELETE')) return 'DELETE';
  if (trimmed.startsWith('BEGIN')) return 'BEGIN_TRANSACTION';
  if (trimmed.startsWith('COMMIT')) return 'COMMIT';
  if (trimmed.startsWith('ROLLBACK')) return 'ROLLBACK';
  return 'OTHER';
}

/**
 * Executes a SQL query using the real AgentDB MCP API with retry logic
 * @param {string} query - SQL query to execute
 * @param {Array} params - Query parameters
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.initialDelay - Initial delay in ms (default: 100)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 2000)
 * @returns {Promise<Object>} - Query result
 */
export async function executeQuery(query, params = [], options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 100,
    maxDelay = 2000
  } = options;

  // Create database operation span
  const queryType = getQueryType(query);
  const span = createToolSpan(
    'agentdb.query',
    'execute_sql',
    { 
      query: query.substring(0, 200), // Truncate for attribute size
      params_count: params.length 
    }
  );

  // Add database attributes
  span.setAttribute('db.system', 'agentdb');
  span.setAttribute('db.operation.type', queryType);
  span.setAttribute('db.query.length', query.length);
  span.setAttribute('db.query.params_count', params.length);

  let lastError;
  const startTime = Date.now();
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // Calculate exponential backoff delay
        const delay = Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay);
        const jitter = Math.random() * 100; // Add jitter to avoid thundering herd
        const totalDelay = delay + jitter;
        
        console.log(`🔄 Retrying AgentDB query (attempt ${attempt}/${maxRetries}) after ${Math.round(totalDelay)}ms...`);
        span.addEvent('retry_attempt', { attempt, delay_ms: totalDelay });
        await sleep(totalDelay);
      }

      span.setAttribute('db.retry.attempt', attempt);
      console.log('Executing real AgentDB query:', query, params);
      console.log('Using URL:', agentdbConfig.mcpUrl);
      console.log('Using API Key:', agentdbConfig.apiKey.substring(0, 20) + '...');
      
      // Use the correct AgentDB API format
      const { default: fetch } = await import('node-fetch');
      
      const requestBody = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: 'execute_sql',
          arguments: {
            statements: [{
              sql: query,
              params: params
            }]
          }
        }
      };
      
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(agentdbConfig.mcpUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${agentdbConfig.apiKey}`
        },
        body: JSON.stringify(requestBody),
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('AgentDB MCP response:', result);
      
      if (result.error) {
        throw new Error(`AgentDB MCP error: ${result.error.message}`);
      }
      
      // Transform the MCP response to match our expected format
      const mcpResult = result.result;
      if (mcpResult.content && mcpResult.content[0] && mcpResult.content[0].text) {
        try {
          const parsedData = JSON.parse(mcpResult.content[0].text);
          console.log('Parsed AgentDB data:', parsedData);
          
          // Check if the parsed data contains an error (database lock, etc.)
          if (parsedData.results && parsedData.results[0]) {
            // Check for error field (database lock, etc.)
            if (parsedData.results[0].error) {
              const dbError = parsedData.results[0].error;
              const errorMsg = typeof dbError === 'string' ? dbError : (dbError.message || String(dbError));
              if (isRetryableError(errorMsg) && attempt < maxRetries) {
                lastError = new Error(`Database error: ${errorMsg}`);
                console.warn(`⚠️  Database error detected (attempt ${attempt + 1}/${maxRetries + 1}): ${errorMsg}`);
                continue; // Retry
              } else {
                // Non-retryable error or max retries reached
                throw new Error(`Database error: ${errorMsg}`);
              }
            }
            
            // Also check if success is false
            if (parsedData.success === false && parsedData.error) {
              const errorMsg = parsedData.error;
              if (isRetryableError(errorMsg) && attempt < maxRetries) {
                lastError = new Error(`Database error: ${errorMsg}`);
                console.warn(`⚠️  Database error detected (attempt ${attempt + 1}/${maxRetries + 1}): ${errorMsg}`);
                continue; // Retry
              } else {
                throw new Error(`Database error: ${errorMsg}`);
              }
            }
          }
          
          // Add success metrics to span
          const duration = Date.now() - startTime;
          const rowsReturned = parsedData?.results?.[0]?.rows?.length || 0;
          const changes = parsedData?.results?.[0]?.changes || 0;
          
          span.setAttribute('db.query.duration_ms', duration);
          span.setAttribute('db.rows.returned', rowsReturned);
          span.setAttribute('db.rows.changed', changes);
          span.setAttribute('db.success', true);
          setSpanStatus(span, true);
          span.end();
          
          return parsedData;
        } catch (parseError) {
          console.log('Failed to parse MCP response:', parseError.message);
          throw new Error(`Failed to parse AgentDB response: ${parseError.message}`);
        }
      }
      
      // If no content, return empty result
      console.log('No content in MCP response, returning empty result');
      const duration = Date.now() - startTime;
      span.setAttribute('db.query.duration_ms', duration);
      span.setAttribute('db.rows.returned', 0);
      span.setAttribute('db.success', true);
      setSpanStatus(span, true);
      span.end();
      
      return {
        success: true,
        results: [{
          rows: [],
          totalRows: 0,
          offset: 0,
          limit: 100,
          changes: 0
        }]
      };

    } catch (error) {
      lastError = error;
      
      // Check if this is a retryable error
      if (isRetryableError(error) && attempt < maxRetries) {
        console.warn(`⚠️  AgentDB query failed (attempt ${attempt + 1}/${maxRetries + 1}): ${error.message}`);
        continue; // Retry
      } else {
        // Non-retryable error or max retries reached
        const duration = Date.now() - startTime;
        span.setAttribute('db.query.duration_ms', duration);
        span.setAttribute('db.success', false);
        span.setAttribute('db.error', error.message);
        span.setAttribute('db.error.type', error.constructor.name);
        recordSpanException(span, error);
        span.end();
        
        console.error('❌ AgentDB query error (non-retryable or max retries reached):', error.message);
        throw new Error(`Database query failed: ${error.message}`);
      }
    }
  }
  
  // If we get here, all retries were exhausted
  const duration = Date.now() - startTime;
  span.setAttribute('db.query.duration_ms', duration);
  span.setAttribute('db.success', false);
  span.setAttribute('db.error', `Failed after ${maxRetries + 1} attempts`);
  if (lastError) {
    recordSpanException(span, lastError);
  }
  span.end();
  
  throw new Error(`Database query failed after ${maxRetries + 1} attempts: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Save list items to AgentDB
 */
export async function saveListItems(items, source = 'image', sourceMetadata = null) {
  try {
    console.log(`Saving ${items.length} items from ${source} source to real AgentDB`);
    
    // Validate items before creating list
    if (!items || items.length === 0) {
      throw new Error('No items to save');
    }
    
    // Validate each item has required fields
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.item_name || typeof item.item_name !== 'string' || item.item_name.trim() === '') {
        throw new Error(`Item ${i + 1} is missing required item_name field`);
      }
    }
    
    // Use transaction to ensure atomicity - either all items are saved or none
    console.log('Starting transaction for list and items...');
    
    // Begin transaction
    await executeQuery('BEGIN TRANSACTION');
    
    try {
      // Create a new list
      const listQuery = `
        INSERT INTO lists (list_name, description, created_at, updated_at)
        VALUES (?, ?, datetime('now'), datetime('now'))
        RETURNING id
      `;
      
      const listResult = await executeQuery(listQuery, [
        `List from ${source}`,
        `Items extracted from ${source} source`
      ]);
      
      console.log('List creation result:', JSON.stringify(listResult, null, 2));
      
      // Handle different response structures
      let listId;
      if (listResult.results && listResult.results[0] && listResult.results[0].rows && listResult.results[0].rows[0] && listResult.results[0].rows[0].id) {
        listId = listResult.results[0].rows[0].id;
      } else if (listResult.results && listResult.results[0] && listResult.results[0].lastInsertRowid) {
        listId = listResult.results[0].lastInsertRowid;
      } else if (listResult.results && listResult.results[0] && listResult.results[0].rows && listResult.results[0].rows[0] && listResult.results[0].rows[0].lastInsertRowid) {
        listId = listResult.results[0].rows[0].lastInsertRowid;
      } else if (listResult.lastInsertRowid) {
        listId = listResult.lastInsertRowid;
      }
      
      console.log('Extracted listId:', listId);
      
      if (!listId) {
        console.error('Failed to extract listId from result:', listResult);
        throw new Error('Failed to create list in AgentDB');
      }
      
      // Insert items sequentially to avoid database lock issues
      // AgentDB has issues with too many concurrent writes within a transaction
      console.log(`Inserting ${items.length} items for listId: ${listId}`);
      
      for (let index = 0; index < items.length; index++) {
        const item = items[index];
        const itemQuery = `
          INSERT INTO list_items (
            list_id, item_name, category, quantity,
            notes, explanation, status, source_type,
            extracted_at, metadata
          )
          VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'), ?)
        `;
        
        // Map source to valid source_type values
        let validSourceType = 'photo'; // default
        if (source === 'image') {
          validSourceType = 'photo';
        } else if (source === 'screenshot') {
          validSourceType = 'screenshot';
        } else if (source === 'pdf') {
          validSourceType = 'pdf';
        } else if (source === 'url') {
          validSourceType = 'url';
        } else if (source === 'audio') {
          validSourceType = 'audio';
        }

        const params = [
          listId,
          item.item_name.trim(), // Ensure no leading/trailing whitespace
          item.category || 'other',
          item.quantity,
          item.notes,
          item.explanation || null,
          validSourceType,
          sourceMetadata ? JSON.stringify(sourceMetadata) : null
        ];
        
        console.log(`Inserting item ${index + 1}/${items.length}:`, item.item_name);
        
        // Insert items one at a time to avoid overwhelming AgentDB's lease system
        const result = await executeQuery(itemQuery, params);
        console.log(`Item ${index + 1} inserted successfully`);
      }
      
      console.log('All items inserted successfully');
      
      // Commit transaction
      await executeQuery('COMMIT');
      console.log('Transaction committed successfully');
      
      return {
        listId,
        itemCount: items.length,
        items: items,
        source: source,
        sourceMetadata: sourceMetadata
      };
      
    } catch (error) {
      // Rollback transaction on any error
      console.error('Error in transaction, rolling back:', error);
      await executeQuery('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('Error saving list items to AgentDB:', error);
    throw error;
  }
}

/**
 * Get all lists from AgentDB
 */
export async function getLists(limit = 50) {
  try {
    console.log(`Getting lists with limit: ${limit}`);
    const query = `
      SELECT 
        l.id, 
        l.list_name, 
        l.description, 
        l.created_at, 
        l.updated_at,
        COUNT(li.id) as item_count
      FROM lists l
      LEFT JOIN list_items li ON l.id = li.list_id
      GROUP BY l.id, l.list_name, l.description, l.created_at, l.updated_at
      ORDER BY l.created_at DESC
      LIMIT ?
    `;
    const result = await executeQuery(query, [limit]);
    return result.results?.[0]?.rows || [];
  } catch (error) {
    console.error('Error getting lists from AgentDB:', error);
    throw error;
  }
}

/**
 * Get items for a specific list from AgentDB
 */
export async function getListItems(listId) {
  try {
    console.log(`Getting items for list: ${listId}`);
  const query = `
    SELECT id, item_name, category, quantity, 
           notes, explanation, status, source_type, extracted_at, metadata
    FROM list_items
    WHERE list_id = ?
    ORDER BY extracted_at ASC
  `;
    const result = await executeQuery(query, [listId]);
    return result.results?.[0]?.rows || [];
  } catch (error) {
    console.error('Error getting list items from AgentDB:', error);
    throw error;
  }
}

/**
 * Create a new list with items in AgentDB
 */
export async function createNewList(listName, items, description = null) {
  try {
    console.log(`Creating new list "${listName}" with ${items.length} items in AgentDB`);
    
    // Create new list
    const createListQuery = `
      INSERT INTO lists (list_name, description, created_at, updated_at)
      VALUES (?, ?, datetime('now'), datetime('now'))
      RETURNING id
    `;
    
    const listResult = await executeQuery(createListQuery, [
      listName.trim(),
      description || `Items extracted from ${items[0]?.source_type || 'manual'} source`
    ]);

    const listId = listResult.results?.[0]?.rows?.[0]?.id;
    if (!listId) {
      throw new Error('Failed to create list in AgentDB');
    }

    // Insert items into the new list
    const itemInserts = items.map(async (item) => {
      const itemQuery = `
        INSERT INTO list_items (
          list_id, item_name, category, quantity,
          notes, explanation, status, source_type,
          extracted_at, metadata
        )
        VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'), ?)
      `;
      
      return executeQuery(itemQuery, [
        listId,
        item.item_name,
        item.category || 'other',
        item.quantity,
        item.notes,
        item.explanation || null,
        item.source_type || 'manual',
        item.metadata ? JSON.stringify(item.metadata) : null
      ]);
    });

    await Promise.all(itemInserts);

    // Get the created list with items
    const newList = await getListItems(listId);

    return {
      listId,
      listName: listName.trim(),
      itemCount: items.length,
      totalItems: newList.length,
      items: items,
      message: `Successfully created new list "${listName.trim()}" with ${items.length} items in AgentDB`
    };

  } catch (error) {
    console.error('Error creating new list in AgentDB:', error);
    throw error;
  }
}

/**
 * Delete a list and all its items from AgentDB
 */
export async function deleteList(listId) {
  try {
    console.log(`Deleting list ${listId} from AgentDB`);
    
    // First, delete all items in the list
    const deleteItemsQuery = `
      DELETE FROM list_items 
      WHERE list_id = ?
    `;
    await executeQuery(deleteItemsQuery, [listId]);

    // Then delete the list itself
    const deleteListQuery = `
      DELETE FROM lists 
      WHERE id = ?
    `;
    const result = await executeQuery(deleteListQuery, [listId]);

    if (result.results?.[0]?.changes === 0) {
      throw new Error('List not found in AgentDB');
    }

    return {
      listId,
      message: 'List and all its items deleted successfully from AgentDB'
    };

  } catch (error) {
    console.error('Error deleting list from AgentDB:', error);
    throw error;
  }
}

/**
 * Update a list item in AgentDB
 */
export async function updateListItem(itemId, updates) {
  try {
    console.log(`Updating item ${itemId} in AgentDB`);
    
    const updateQuery = `
      UPDATE list_items 
      SET status = ?
      WHERE id = ?
    `;
    
    await executeQuery(updateQuery, [
      updates.status,
      itemId
    ]);
    
    return { success: true, message: 'Item updated successfully in AgentDB' };
    
  } catch (error) {
    console.error('Error updating item in AgentDB:', error);
    throw error;
  }
}

/**
 * Delete a list item from AgentDB
 */
export async function deleteListItem(itemId) {
  try {
    console.log(`Deleting item ${itemId} from AgentDB`);
    
    const deleteQuery = `
      DELETE FROM list_items 
      WHERE id = ?
    `;
    
    const result = await executeQuery(deleteQuery, [itemId]);
    
    if (result.results?.[0]?.changes === 0) {
      throw new Error('Item not found in AgentDB');
    }
    
    return { success: true, message: 'Item deleted successfully from AgentDB' };
    
  } catch (error) {
    console.error('Error deleting item from AgentDB:', error);
    throw error;
  }
}

/**
 * Search list items in AgentDB
 */
export async function searchListItems(query, limit = 50) {
  try {
    console.log(`Searching items with query: ${query} in AgentDB`);
    
    const searchQuery = `
      SELECT li.*, l.list_name
      FROM list_items li
      JOIN lists l ON li.list_id = l.id
      WHERE li.item_name LIKE ? OR li.category LIKE ? OR li.notes LIKE ?
      ORDER BY li.extracted_at DESC
      LIMIT ?
    `;
    
    const searchTerm = `%${query}%`;
    const result = await executeQuery(searchQuery, [searchTerm, searchTerm, searchTerm, limit]);
    
    return result.results?.[0]?.rows || [];
    
  } catch (error) {
    console.error('Error searching items in AgentDB:', error);
    throw error;
  }
}

/**
 * Get statistics from AgentDB
 */
export async function getStatistics() {
  try {
    console.log('Getting statistics from AgentDB');
    
    const statsQuery = `
      SELECT 
        COUNT(*) as total_lists,
        (SELECT COUNT(*) FROM list_items) as total_items,
        (SELECT COUNT(*) FROM list_items WHERE status = 'completed') as completed_items,
        (SELECT COUNT(*) FROM list_items WHERE status = 'pending') as pending_items
      FROM lists
    `;
    
    const categoryQuery = `
      SELECT category, COUNT(*) as count
      FROM list_items
      GROUP BY category
      ORDER BY count DESC
    `;
    
    const [statsResult, categoryResult] = await Promise.all([
      executeQuery(statsQuery),
      executeQuery(categoryQuery)
    ]);
    
    return {
      ...(statsResult.results[0].rows[0] || {}),
      categories: categoryResult.results[0].rows || []
    };
    
  } catch (error) {
    console.error('Error getting statistics from AgentDB:', error);
    throw error;
  }
}
