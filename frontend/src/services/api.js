import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
 * Health check
 */
export async function healthCheck() {
  const response = await api.get('/health');
  return response.data;
}

export default api;
