import { analyzeImage, analyzeText, analyzeLink } from '../services/imageAnalysisService.js';
import {
  saveListItems,
  getLists,
  getListItems,
  updateListItem,
  deleteListItem,
  searchListItems,
  getStatistics,
  executeQuery,
} from '../services/agentdbService.js';
import { flushTraces } from '../config/arize.js';
import fs from 'fs';

/**
 * Upload and analyze an image to extract list items
 */
export async function uploadImage(req, res) {
  try {
    console.log('Upload image request received');
    
    if (!req.file) {
      console.log('No file provided in request');
      return res.status(400).json({
        success: false,
        error: 'No image file provided',
      });
    }

    console.log('File received:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      hasBuffer: !!req.file.buffer,
      hasPath: !!req.file.path
    });

    // Handle both memory storage (production) and disk storage (development)
    let imageData;
    if (req.file.buffer) {
      // Memory storage (production/Render)
      console.log('Using memory storage (production)');
      imageData = req.file.buffer;
    } else {
      // Disk storage (development)
      console.log('Using disk storage (development)');
      const imagePath = req.file.path;
      imageData = fs.readFileSync(imagePath);
    }

    // Analyze the image
    console.log('Starting image analysis for:', req.file.originalname);
    const extractedItems = await analyzeImage(imageData, req.file.mimetype);
    console.log('Image analysis completed, extracted items:', extractedItems.length);

    // Flush traces to ensure they're exported
    await flushTraces();

    // Clean up uploaded file (only for disk storage)
    if (req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

    res.json({
      success: true,
      data: {
        items: extractedItems,
        itemCount: extractedItems.length
      },
      message: `Successfully extracted ${extractedItems.length} items from image`,
    });

  } catch (error) {
    console.error('Error in uploadImage:', error);

    // Clean up file if it exists (only for disk storage)
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process image',
    });
  }
}

/**
 * Analyze text to extract list items
 */
export async function analyzeTextInput(req, res) {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'No text provided',
      });
    }

    // Analyze the text
    console.log('Analyzing text input');
    const extractedItems = await analyzeText(text);

    // Flush traces to ensure they're exported
    await flushTraces();

    // Save to database
    const savedList = await saveListItems(extractedItems, 'text', {
      textLength: text.length,
    });

    res.json({
      success: true,
      data: savedList,
      message: `Successfully extracted ${extractedItems.length} items from text`,
    });

  } catch (error) {
    console.error('Error in analyzeTextInput:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process text',
    });
  }
}

/**
 * Analyze a URL to extract list items
 */
export async function analyzeLinkInput(req, res) {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (urlError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format',
      });
    }

    // Analyze the URL
    console.log('Analyzing URL:', url);
    const extractedItems = await analyzeLink(url);

    // Flush traces to ensure they're exported
    await flushTraces();

    res.json({
      success: true,
      data: {
        items: extractedItems,
        itemCount: extractedItems.length,
        url: url
      },
      message: `Successfully extracted ${extractedItems.length} items from URL`,
    });

  } catch (error) {
    console.error('Error in analyzeLinkInput:', error);
    
    // Handle specific error types with appropriate status codes
    if (error.message.includes('HTTP 403')) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: The website blocked our request. Please try a different URL or check if the site allows automated access.',
      });
    } else if (error.message.includes('HTTP 404')) {
      return res.status(404).json({
        success: false,
        error: 'Page not found: The URL does not exist or is no longer available.',
      });
    } else if (error.message.includes('HTTP 429')) {
      return res.status(429).json({
        success: false,
        error: 'Rate limited: Too many requests to this website. Please try again later.',
      });
    } else if (error.message.includes('Invalid URL format')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format. Please provide a valid URL starting with http:// or https://',
      });
    } else if (error.message.includes('timeout')) {
      return res.status(408).json({
        success: false,
        error: 'Request timeout: The website took too long to respond. Please try again or use a different URL.',
      });
    }
    
    // Generic error for other cases
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process URL. Please try again or contact support if the issue persists.',
    });
  }
}

/**
 * Get all lists
 */
export async function getAllLists(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const lists = await getLists(limit);

    res.json({
      success: true,
      data: lists,
      count: lists.length,
    });

  } catch (error) {
    console.error('Error in getAllLists:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch lists',
    });
  }
}

/**
 * Get items for a specific list
 */
export async function getListById(req, res) {
  try {
    const listId = parseInt(req.params.id);

    if (isNaN(listId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid list ID',
      });
    }

    // Get the list information first
    const lists = await getLists();
    const list = lists.find(l => l.id === listId);
    
    if (!list) {
      return res.status(404).json({
        success: false,
        error: 'List not found',
      });
    }

    // Get items for this specific list
    const items = await getListItems(listId);

    res.json({
      success: true,
      data: {
        id: list.id,
        listId: list.id,
        list_name: list.list_name,
        listName: list.list_name,
        description: list.description,
        created_at: list.created_at,
        updated_at: list.updated_at,
        items,
        count: items.length,
      },
    });

  } catch (error) {
    console.error('Error in getListById:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch list items',
    });
  }
}

/**
 * Update a list item
 */
export async function updateItem(req, res) {
  try {
    const itemId = parseInt(req.params.id);

    if (isNaN(itemId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid item ID',
      });
    }

    const updates = req.body;
    const updatedItem = await updateListItem(itemId, updates);

    res.json({
      success: true,
      data: updatedItem,
      message: 'Item updated successfully',
    });

  } catch (error) {
    console.error('Error in updateItem:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update item',
    });
  }
}

/**
 * Delete a list item
 */
export async function deleteItem(req, res) {
  try {
    const itemId = parseInt(req.params.id);

    if (isNaN(itemId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid item ID',
      });
    }

    await deleteListItem(itemId);

    res.json({
      success: true,
      message: 'Item deleted successfully',
    });

  } catch (error) {
    console.error('Error in deleteItem:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete item',
    });
  }
}

/**
 * Search for list items
 */
export async function searchItems(req, res) {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      });
    }

    const results = await searchListItems(q);

    res.json({
      success: true,
      data: results,
      count: results.length,
      query: q,
    });

  } catch (error) {
    console.error('Error in searchItems:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search items',
    });
  }
}

/**
 * Get statistics
 */
export async function getStats(req, res) {
  try {
    const stats = await getStatistics();

    res.json({
      success: true,
      data: stats,
    });

  } catch (error) {
    console.error('Error in getStats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch statistics',
    });
  }
}

/**
 * Save items to an existing list
 */
export async function saveItemsToList(req, res) {
  try {
    const listId = parseInt(req.params.id);
    const { items, listName } = req.body;

    if (isNaN(listId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid list ID',
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Items array is required and must not be empty',
      });
    }

    // If listName is provided, update the list name
    if (listName) {
      const updateListQuery = `
        UPDATE lists 
        SET list_name = ?, updated_at = datetime('now')
        WHERE id = ?
      `;
      await executeQuery(updateListQuery, [listName, listId]);
    }

    // Insert items into the existing list
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

    // Get updated list with items
    const updatedList = await getListItems(listId);

    res.json({
      success: true,
      data: {
        listId,
        itemCount: items.length,
        totalItems: updatedList.length,
        items: items,
        message: `Successfully added ${items.length} items to list`
      },
    });

  } catch (error) {
    console.error('Error in saveItemsToList:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save items to list',
    });
  }
}

/**
 * Create a new list with items
 */
export async function createNewList(req, res) {
  try {
    const { listName, description, items } = req.body;

    if (!listName || !listName.trim()) {
      return res.status(400).json({
        success: false,
        error: 'List name is required',
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Items array is required and must not be empty',
      });
    }

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
      throw new Error('Failed to create list');
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
      
      // Map source_type to valid values
      let validSourceType = 'photo'; // default
      if (item.source_type === 'image' || item.source_type === 'manual') {
        validSourceType = 'photo';
      } else if (item.source_type === 'screenshot') {
        validSourceType = 'screenshot';
      } else if (item.source_type === 'pdf') {
        validSourceType = 'pdf';
      } else if (item.source_type === 'url') {
        validSourceType = 'url';
      } else if (item.source_type === 'audio') {
        validSourceType = 'audio';
      }

      return executeQuery(itemQuery, [
        listId,
        item.item_name,
        item.category || 'other',
        item.quantity,
        item.notes,
        item.explanation || null,
        validSourceType,
        item.metadata ? JSON.stringify(item.metadata) : null
      ]);
    });

    await Promise.all(itemInserts);

    // Get the created list with items
    const newList = await getListItems(listId);

    res.json({
      success: true,
      data: {
        id: listId,
        listId: listId,
        list_name: listName.trim(),
        listName: listName.trim(),
        itemCount: items.length,
        totalItems: newList.length,
        items: items,
        message: `Successfully created new list "${listName.trim()}" with ${items.length} items`
      },
    });

  } catch (error) {
    console.error('Error in createNewList:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create new list',
    });
  }
}

/**
 * Delete a list and all its items
 */
export async function deleteList(req, res) {
  try {
    const listId = parseInt(req.params.id);

    if (isNaN(listId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid list ID',
      });
    }

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
      return res.status(404).json({
        success: false,
        error: 'List not found',
      });
    }

    res.json({
      success: true,
      data: {
        listId,
        message: 'List and all its items deleted successfully'
      },
    });

  } catch (error) {
    console.error('Error in deleteList:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete list',
    });
  }
}
