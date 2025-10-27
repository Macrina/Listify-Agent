import axios from 'axios';

// Use relative URL in production, localhost in development
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

// Debug logging for production
if (import.meta.env.PROD) {
  console.log('🔧 Production API Configuration:', {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    PROD: import.meta.env.PROD,
    API_BASE_URL: API_BASE_URL,
    location: window.location.href
  });
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Upload and analyze an image
 */
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);

  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

/**
 * Analyze text input
 */
export async function analyzeText(text) {
  const response = await api.post('/analyze-text', { text });
  return response.data;
}

/**
 * Analyze a URL to extract list items
 */
export async function analyzeLink(url) {
  const response = await api.post('/analyze-link', { url });
  return response.data;
}

/**
 * Get all lists
 */
export async function getLists(limit = 50) {
  const response = await api.get('/lists', { params: { limit } });
  return response.data.data;
}

/**
 * Get a specific list with its items
 */
export async function getList(listId) {
  const response = await api.get(`/lists/${listId}`);
  return response.data.data;
}

/**
 * Update a list item
 */
export async function updateItem(itemId, updates) {
  const response = await api.put(`/items/${itemId}`, updates);
  return response.data.data;
}

/**
 * Delete a list item
 */
export async function deleteItem(itemId) {
  const response = await api.delete(`/items/${itemId}`);
  return response.data;
}

/**
 * Search for items
 */
export async function searchItems(query) {
  const response = await api.get('/search', { params: { q: query } });
  return response.data.data;
}

/**
 * Get statistics
 */
export async function getStatistics() {
  const response = await api.get('/stats');
  return response.data.data;
}

/**
 * Save items to an existing list
 */
export async function saveItemsToList(listId, items, listName = null) {
  const response = await api.post(`/lists/${listId}/items`, {
    items,
    listName
  });
  return response.data;
}

/**
 * Create a new list with items
 */
export async function createNewList(listName, items, description = null) {
  const response = await api.post('/lists', {
    listName,
    items,
    description
  });
  return response.data;
}

/**
 * Delete a list
 */
export async function deleteList(listId) {
  const response = await api.delete(`/lists/${listId}`);
  return response.data;
}

/**
 * Health check
 */
export async function healthCheck() {
  const response = await api.get('/health');
  return response.data;
}

export default api;
