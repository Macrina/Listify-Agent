import axios from 'axios';
import agentdbConfig from '../config/agentdb.js';

/**
 * AgentDB Service using MCP endpoint
 * Updated to work with AgentDB's MCP protocol
 */

/**
 * Executes a SQL query on AgentDB via MCP endpoint
 * @param {string} query - SQL query to execute
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} - Query result
 */
export async function executeQuery(query, params = []) {
  try {
    // Use the MCP URL from config
    const mcpUrl = agentdbConfig.mcpUrl || 'https://mcp.agentdb.dev/eq1MHpX-qn';

    const response = await axios.post(
      `${mcpUrl}`,
      {
        method: 'execute',
        database: agentdbConfig.dbName,
        query: query,
        params: params,
      },
      {
        headers: {
          'Authorization': `Bearer ${agentdbConfig.apiKey}`,
          'Content-Type': 'application/json',
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('AgentDB query error:', error.response?.data || error.message);
    throw new Error(`Database query failed: ${error.response?.data?.message || error.message}`);
  }
}

// All other functions remain the same...
// (saveListItems, getLists, getListItems, etc.)

/**
 * Saves extracted list items to AgentDB
 */
export async function saveListItems(items, source = 'image', sourceMetadata = null) {
  try {
    const listQuery = `
      INSERT INTO lists (source_type, source_metadata, created_at, item_count)
      VALUES (?, ?, datetime('now'), ?)
      RETURNING id
    `;

    const listResult = await executeQuery(listQuery, [
      source,
      sourceMetadata ? JSON.stringify(sourceMetadata) : null,
      items.length,
    ]);

    const listId = listResult.rows?.[0]?.id || listResult.lastInsertRowid;

    const itemInserts = items.map(async (item) => {
      const itemQuery = `
        INSERT INTO list_items (
          list_id, item_name, category, quantity,
          priority, notes, status, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, 'active', datetime('now'))
      `;

      return executeQuery(itemQuery, [
        listId,
        item.item_name,
        item.category,
        item.quantity,
        item.priority,
        item.notes,
      ]);
    });

    await Promise.all(itemInserts);

    return {
      listId,
      itemCount: items.length,
      items: items,
    };

  } catch (error) {
    console.error('Error saving list items:', error);
    throw error;
  }
}

export async function getLists(limit = 50) {
  try {
    const query = `
      SELECT id, source_type, source_metadata,
             created_at, item_count, updated_at
      FROM lists
      ORDER BY created_at DESC
      LIMIT ?
    `;
    const result = await executeQuery(query, [limit]);
    return result.rows || [];
  } catch (error) {
    console.error('Error getting lists:', error);
    throw error;
  }
}

export async function getListItems(listId) {
  try {
    const query = `
      SELECT id, item_name, category, quantity,
             priority, notes, status, completed_at,
             created_at, updated_at
      FROM list_items
      WHERE list_id = ?
      ORDER BY created_at ASC
    `;
    const result = await executeQuery(query, [listId]);
    return result.rows || [];
  } catch (error) {
    console.error('Error getting list items:', error);
    throw error;
  }
}

export async function updateListItem(itemId, updates) {
  try {
    const allowedFields = ['item_name', 'category', 'quantity', 'priority', 'notes', 'status', 'completed_at'];
    const updateFields = [];
    const params = [];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        params.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    updateFields.push('updated_at = datetime(\'now\')');
    params.push(itemId);

    const query = `
      UPDATE list_items
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    await executeQuery(query, params);

    // Fetch updated item
    const fetchQuery = 'SELECT * FROM list_items WHERE id = ?';
    const result = await executeQuery(fetchQuery, [itemId]);
    return result.rows?.[0];

  } catch (error) {
    console.error('Error updating list item:', error);
    throw error;
  }
}

export async function deleteListItem(itemId) {
  try {
    const query = 'DELETE FROM list_items WHERE id = ?';
    const result = await executeQuery(query, [itemId]);
    return result;
  } catch (error) {
    console.error('Error deleting list item:', error);
    throw error;
  }
}

export async function searchListItems(keyword) {
  try {
    const query = `
      SELECT li.id, li.list_id, li.item_name, li.category,
             li.quantity, li.priority, li.notes, li.status,
             l.source_type, l.created_at as list_created_at
      FROM list_items li
      JOIN lists l ON li.list_id = l.id
      WHERE li.item_name LIKE ? OR li.notes LIKE ?
      ORDER BY li.created_at DESC
      LIMIT 100
    `;
    const searchTerm = `%${keyword}%`;
    const result = await executeQuery(query, [searchTerm, searchTerm]);
    return result.rows || [];
  } catch (error) {
    console.error('Error searching list items:', error);
    throw error;
  }
}

export async function getStatistics() {
  try {
    const statsQuery = `
      SELECT
        COUNT(DISTINCT l.id) as total_lists,
        COUNT(li.id) as total_items,
        COUNT(CASE WHEN li.status = 'active' THEN 1 END) as active_items,
        COUNT(CASE WHEN li.status = 'completed' THEN 1 END) as completed_items
      FROM lists l
      LEFT JOIN list_items li ON l.id = li.list_id
    `;

    const categoryQuery = `
      SELECT category, COUNT(*) as count
      FROM list_items
      GROUP BY category
      ORDER BY count DESC
    `;

    const [statsResult, categoryResult] = await Promise.all([
      executeQuery(statsQuery),
      executeQuery(categoryQuery),
    ]);

    return {
      ...(statsResult.rows?.[0] || {}),
      categories: categoryResult.rows || [],
    };

  } catch (error) {
    console.error('Error getting statistics:', error);
    throw error;
  }
}
