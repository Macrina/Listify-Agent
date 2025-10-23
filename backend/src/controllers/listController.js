import { analyzeImage, analyzeText } from '../services/imageAnalysisService.js';
import {
  saveListItems,
  getLists,
  getListItems,
  updateListItem,
  deleteListItem,
  searchListItems,
  getStatistics,
} from '../services/agentdbMCPService.js';
import fs from 'fs';

/**
 * Upload and analyze an image to extract list items
 */
export async function uploadImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided',
      });
    }

    const imagePath = req.file.path;

    // Analyze the image
    console.log('Analyzing image:', imagePath);
    const extractedItems = await analyzeImage(imagePath);

    // Save to database
    const savedList = await saveListItems(extractedItems, 'image', {
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
    });

    // Clean up uploaded file
    fs.unlinkSync(imagePath);

    res.json({
      success: true,
      data: savedList,
      message: `Successfully extracted ${extractedItems.length} items from image`,
    });

  } catch (error) {
    console.error('Error in uploadImage:', error);

    // Clean up file if it exists
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

    const items = await getListItems(listId);

    res.json({
      success: true,
      data: {
        listId,
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
