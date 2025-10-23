# Listify Agent API Documentation

Base URL: `http://localhost:3001/api`

## Authentication

Currently, the API does not require authentication. In production, you should add authentication middleware.

## Response Format

All API responses follow this format:

```json
{
  "success": true|false,
  "data": {},
  "message": "Optional message",
  "error": "Error message if success is false"
}
```

## Endpoints

### Health Check

Check if the API is running.

**GET** `/api/health`

**Response:**
```json
{
  "success": true,
  "message": "Listify Agent API is running",
  "timestamp": "2025-10-23T20:00:00.000Z"
}
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
    "listId": 1,
    "itemCount": 5,
    "items": [
      {
        "item_name": "Buy milk",
        "category": "groceries",
        "quantity": "2 gallons",
        "priority": "medium",
        "notes": "Prefer organic"
      }
    ]
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
    "listId": 2,
    "itemCount": 3,
    "items": [
      {
        "item_name": "Buy milk",
        "category": "groceries",
        "quantity": null,
        "priority": "medium",
        "notes": null
      }
    ]
  },
  "message": "Successfully extracted 3 items from text"
}
```

---

### Get All Lists

Retrieve all lists with metadata.

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
      "source_type": "image",
      "source_metadata": "{\"originalName\":\"list.jpg\"}",
      "created_at": "2025-10-23T20:00:00.000Z",
      "item_count": 5,
      "updated_at": "2025-10-23T20:00:00.000Z"
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
    "listId": 1,
    "items": [
      {
        "id": 1,
        "item_name": "Buy milk",
        "category": "groceries",
        "quantity": "2 gallons",
        "priority": "medium",
        "notes": "Prefer organic",
        "status": "active",
        "completed_at": null,
        "created_at": "2025-10-23T20:00:00.000Z",
        "updated_at": "2025-10-23T20:00:00.000Z"
      }
    ],
    "count": 1
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
  "item_name": "Updated name",
  "category": "tasks",
  "quantity": "3",
  "priority": "high",
  "notes": "Additional notes",
  "status": "completed",
  "completed_at": "2025-10-23T20:00:00.000Z"
}
```

All fields are optional. Only provide fields you want to update.

**Example (cURL):**
```bash
curl -X PUT http://localhost:3001/api/items/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "completed", "completed_at": "2025-10-23T20:00:00.000Z"}'
```

**Example (JavaScript):**
```javascript
const response = await fetch('http://localhost:3001/api/items/1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'completed',
    completed_at: new Date().toISOString()
  })
});
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "item_name": "Buy milk",
    "category": "groceries",
    "status": "completed",
    "completed_at": "2025-10-23T20:00:00.000Z"
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

### Search Items

Search for items across all lists.

**GET** `/api/search?q=keyword`

**Query Parameters:**
- `q` (required): Search keyword

**Example (cURL):**
```bash
curl "http://localhost:3001/api/search?q=milk"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "list_id": 1,
      "item_name": "Buy milk",
      "category": "groceries",
      "quantity": "2 gallons",
      "priority": "medium",
      "notes": "Prefer organic",
      "status": "active",
      "source_type": "image",
      "list_created_at": "2025-10-23T20:00:00.000Z"
    }
  ],
  "count": 1,
  "query": "milk"
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
    "active_items": 30,
    "completed_items": 15,
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

---

## Data Models

### List Item

```typescript
{
  id: number;
  list_id: number;
  item_name: string;
  category: 'groceries' | 'tasks' | 'contacts' | 'events' | 'inventory' | 'ideas' | 'recipes' | 'shopping' | 'bills' | 'other';
  quantity: string | null;
  priority: 'low' | 'medium' | 'high';
  notes: string | null;
  status: 'active' | 'completed';
  completed_at: string | null;  // ISO 8601 timestamp
  created_at: string;            // ISO 8601 timestamp
  updated_at: string;            // ISO 8601 timestamp
}
```

### List

```typescript
{
  id: number;
  source_type: 'image' | 'text' | 'pdf' | 'url';
  source_metadata: string | null;  // JSON string
  created_at: string;              // ISO 8601 timestamp
  updated_at: string;              // ISO 8601 timestamp
  item_count: number;
}
```

---

## Rate Limiting

Currently, there are no rate limits. In production, implement rate limiting to prevent abuse.

## CORS

CORS is configured to allow requests from `FRONTEND_URL` environment variable (default: `http://localhost:3000`).

For production, update the CORS configuration in `backend/src/server.js`.

---

## Testing with Postman

Import this Postman collection to test all endpoints:

1. Create a new collection in Postman
2. Add environment variable: `baseUrl` = `http://localhost:3001/api`
3. Import endpoints from this documentation

Or use the example cURL commands provided above.
