import express from 'express';
import upload from '../middleware/upload.js';
import {
  uploadImage,
  analyzeTextInput,
  getAllLists,
  getListById,
  updateItem,
  deleteItem,
  searchItems,
  getStats,
} from '../controllers/listController.js';

const router = express.Router();

// Image upload and analysis
router.post('/upload', upload.single('image'), uploadImage);

// Text analysis
router.post('/analyze-text', analyzeTextInput);

// List management
router.get('/lists', getAllLists);
router.get('/lists/:id', getListById);

// Item management
router.put('/items/:id', updateItem);
router.delete('/items/:id', deleteItem);

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

export default router;
