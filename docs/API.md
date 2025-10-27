# Listify Agent API Documentation

Base URL: `http://localhost:3001/api`

## Overview

The Listify Agent API provides endpoints for AI-powered list extraction from images and text, list management, and analytics. All endpoints return JSON responses with a consistent format.

## Response Format

All API responses follow this structure:

```json
{
  "success": true|false,
  "data": {},
  "message": "Optional message",
  "error": "Error message if success is false"
}
```

## Authentication

Currently, the API does not require authentication. In production, implement authentication middleware.

## Endpoints

### Health Check

Check if the API is running.

**GET** `/api/health`

**Response:**
```json
{
  "success": true,
  "message": "Listify Agent API is running",
  "timestamp": "2025-01-23T20:00:00.000Z"
}
```

**Example (cURL):**
```bash
curl http://localhost:3001/api/health
```

---

### Upload and Analyze Image

Upload an image and extract list items using AI.

**POST** `/api/upload`

**Headers:**
- `Content-Type: multipart/form-data`

**Body:**
- `image`: File (JPEG, PNG, GIF, WebP, max 10MB)

**Example (cURL):**
```bash
curl -X POST http://localhost:3001/api/upload \
  -F "image=@/path/to/your/list.jpg"
```

**Example (JavaScript):**
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);

const response = await fetch('http://localhost:3001/api/upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "item_name": "Buy milk",
        "category": "groceries",
        "quantity": "2 gallons",
        "notes": "Prefer organic"
      }
    ],
    "itemCount": 5
  },
  "message": "Successfully extracted 5 items from image"
}
```

---

### Analyze Text

Extract list items from plain text using AI.

**POST** `/api/analyze-text`

**Headers:**
- `Content-Type: application/json`

**Body:**
```json
{
  "text": "Your text containing list items"
}
```

**Example (cURL):**
```bash
curl -X POST http://localhost:3001/api/analyze-text \
  -H "Content-Type: application/json" \
  -d '{"text": "Buy milk\nCall dentist\nFinish project report by Friday"}'
```

**Example (JavaScript):**
```javascript
const response = await fetch('http://localhost:3001/api/analyze-text', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'Buy milk\nCall dentist' })
});

const result = await response.json();
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "item_name": "Buy milk",
        "category": "groceries",
        "quantity": null,
        "notes": null
      }
    ],
    "itemCount": 3
  },
  "message": "Successfully extracted 3 items from text"
}
```

---

### Get All Lists

Retrieve all lists with metadata and item counts.

**GET** `/api/lists?limit=50`

**Query Parameters:**
- `limit` (optional): Maximum number of lists to return (default: 50)

**Example (cURL):**
```bash
curl http://localhost:3001/api/lists?limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "list_name": "Grocery List",
      "description": "Items extracted from image",
      "created_at": "2025-01-23T20:00:00.000Z",
      "updated_at": "2025-01-23T20:00:00.000Z",
      "item_count": 5
    }
  ],
  "count": 1
}
```

---

### Get List Items

Retrieve all items for a specific list.

**GET** `/api/lists/:id`

**Path Parameters:**
- `id`: List ID (integer)

**Example (cURL):**
```bash
curl http://localhost:3001/api/lists/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "listId": 1,
    "list_name": "Grocery List",
    "listName": "Grocery List",
    "description": "Items extracted from image",
    "created_at": "2025-01-23T20:00:00.000Z",
    "updated_at": "2025-01-23T20:00:00.000Z",
    "items": [
      {
        "id": 1,
        "item_name": "Buy milk",
        "category": "groceries",
        "quantity": "2 gallons",
        "notes": "Prefer organic",
        "status": "pending",
        "source_type": "photo",
        "extracted_at": "2025-01-23T20:00:00.000Z",
        "metadata": null
      }
    ],
    "count": 1
  }
}
```

---

### Create New List

Create a new list with items.

**POST** `/api/lists`

**Headers:**
- `Content-Type: application/json`

**Body:**
```json
{
  "listName": "My Shopping List",
  "items": [
    {
      "item_name": "Buy milk",
      "category": "groceries",
      "quantity": "2 gallons",
      "notes": "Prefer organic"
    }
  ]
}
```

**Example (cURL):**
```bash
curl -X POST http://localhost:3001/api/lists \
  -H "Content-Type: application/json" \
  -d '{
    "listName": "My Shopping List",
    "items": [
      {
        "item_name": "Buy milk",
        "category": "groceries",
        "quantity": "2 gallons",
        "notes": "Prefer organic"
      }
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "listId": 1,
    "list_name": "My Shopping List",
    "listName": "My Shopping List",
    "itemCount": 1,
    "totalItems": 1,
    "items": [
      {
        "item_name": "Buy milk",
        "category": "groceries",
        "quantity": "2 gallons",
        "notes": "Prefer organic"
      }
    ],
    "message": "Successfully created new list \"My Shopping List\" with 1 items"
  }
}
```

---

### Update List Item

Update an existing list item.

**PUT** `/api/items/:id`

**Path Parameters:**
- `id`: Item ID (integer)

**Headers:**
- `Content-Type: application/json`

**Body:**
```json
{
  "status": "completed",
  "notes": "Updated notes"
}
```

All fields are optional. Only provide fields you want to update.

**Example (cURL):**
```bash
curl -X PUT http://localhost:3001/api/items/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

**Example (JavaScript):**
```javascript
const response = await fetch('http://localhost:3001/api/items/1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'completed'
  })
});

const result = await response.json();
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Item updated successfully in AgentDB"
  },
  "message": "Item updated successfully"
}
```

---

### Delete List Item

Delete a list item.

**DELETE** `/api/items/:id`

**Path Parameters:**
- `id`: Item ID (integer)

**Example (cURL):**
```bash
curl -X DELETE http://localhost:3001/api/items/1
```

**Response:**
```json
{
  "success": true,
  "message": "Item deleted successfully"
}
```

---

### Delete List

Delete a list and all its items.

**DELETE** `/api/lists/:id`

**Path Parameters:**
- `id`: List ID (integer)

**Example (cURL):**
```bash
curl -X DELETE http://localhost:3001/api/lists/1
```

**Response:**
```json
{
  "success": true,
  "message": "List deleted successfully"
}
```

---

### Get Statistics

Get statistics about lists and items.

**GET** `/api/stats`

**Example (cURL):**
```bash
curl http://localhost:3001/api/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_lists": 10,
    "total_items": 45,
    "completed_items": 15,
    "pending_items": 30,
    "categories": [
      { "category": "groceries", "count": 20 },
      { "category": "tasks", "count": 15 },
      { "category": "events", "count": 10 }
    ]
  }
}
```

---

## Error Responses

When an error occurs, the API returns:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

- `200 OK`: Request succeeded
- `400 Bad Request`: Invalid input or missing required fields
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error (check logs)

### Example Error Responses

**Missing required field:**
```json
{
  "success": false,
  "error": "No image file provided"
}
```

**Invalid item ID:**
```json
{
  "success": false,
  "error": "Invalid item ID"
}
```

**OpenAI API error:**
```json
{
  "success": false,
  "error": "Failed to parse list items from image. Please try again with a clearer image."
}
```

**Database error:**
```json
{
  "success": false,
  "error": "Failed to create list in AgentDB"
}
```

---

## Data Models

### List Item

```typescript
{
  id: number;
  list_id: number;
  item_name: string;
  category: string;
  quantity: string | null;
  notes: string | null;
  explanation: string | null;
  status: 'pending' | 'completed';
  source_type: 'photo' | 'screenshot' | 'pdf' | 'audio' | 'url';
  extracted_at: string;  // ISO 8601 timestamp
  metadata: JSON | null;
}
```

### List

```typescript
{
  id: number;
  list_name: string;
  description: string | null;
  created_at: string;  // ISO 8601 timestamp
  updated_at: string;  // ISO 8601 timestamp
  item_count: number;
}
```

### Statistics

```typescript
{
  total_lists: number;
  total_items: number;
  completed_items: number;
  pending_items: number;
  categories: Array<{
    category: string;
    count: number;
  }>;
}
```

---

## Rate Limiting

Currently, there are no rate limits. In production, implement rate limiting to prevent abuse.

## CORS

CORS is configured to allow requests from the frontend URL (default: `http://localhost:3000`).

For production, update the CORS configuration in `backend/src/server.js`.

---

## Testing with Postman

Import this Postman collection to test all endpoints:

1. Create a new collection in Postman
2. Add environment variable: `baseUrl` = `http://localhost:3001/api`
3. Import endpoints from this documentation

Or use the example cURL commands provided above.

---

## Development Notes

### File Upload Limits
- Maximum file size: 10MB
- Supported formats: JPEG, PNG, GIF, WebP
- Files are temporarily stored in `backend/uploads/`

### Database Operations
- All database operations use AgentDB with MCP protocol
- Transactions are handled automatically
- Data is persisted across server restarts

### AI Processing
- Image analysis uses OpenAI GPT-4 Vision API
- Text analysis uses OpenAI GPT-4 API
- Processing time varies based on content complexity
- Rate limits apply based on OpenAI account tier

---

## Support

For API issues:
- Check the main [README.md](../README.md) for setup instructions
- Review error messages in the terminal
- Check browser console for frontend errors
- Verify all environment variables are set correctly