import express from 'express';
import upload from '../middleware/upload.js';
import {
  uploadImage,
  analyzeTextInput,
  analyzeLinkInput,
  getAllLists,
  getListById,
  updateItem,
  deleteItem,
  searchItems,
  getStats,
  saveItemsToList,
  createNewList,
  deleteList,
} from '../controllers/listController.js';

const router = express.Router();

// Image upload and analysis
router.post('/upload', upload.single('image'), uploadImage);

// Text analysis
router.post('/analyze-text', analyzeTextInput);

// Link analysis
router.post('/analyze-link', analyzeLinkInput);

// List management
router.get('/lists', getAllLists);
router.get('/lists/:id', getListById);
router.delete('/lists/:id', deleteList);

// Item management
router.put('/items/:id', updateItem);
router.delete('/items/:id', deleteItem);

// Save items to existing list
router.post('/lists/:id/items', saveItemsToList);

// Create new list with items
router.post('/lists', createNewList);

// Search
router.get('/search', searchItems);

// Statistics
router.get('/stats', getStats);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Listify Agent API is running',
    timestamp: new Date().toISOString(),
  });
});

// API configuration check
router.get('/config', (req, res) => {
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
  const hasAgentDBKey = !!process.env.AGENTDB_API_KEY;
  const hasAgentDBUrl = !!process.env.AGENTDB_MCP_URL;
  
  res.json({
    success: true,
    config: {
      openai: hasOpenAIKey ? 'configured' : 'missing',
      agentdb: hasAgentDBKey ? 'configured' : 'missing',
      agentdbUrl: hasAgentDBUrl ? 'configured' : 'missing',
      environment: process.env.NODE_ENV || 'development'
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
