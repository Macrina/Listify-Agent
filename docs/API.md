# API Documentation

## Overview

The Listify Agent provides RESTful APIs for image analysis, list management, and text processing with comprehensive Arize AI observability.

## Base URL

```
http://localhost:3001/api
```

## Endpoints

### Health Check

#### GET /health
Check API server status.

**Response:**
```json
{
  "success": true,
  "message": "Listify Agent API is running",
  "timestamp": "2025-10-27T13:26:02.116Z"
}
```

### List Management

#### GET /lists
Retrieve all lists with item counts.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 30,
      "list_name": "Healthy snacks",
      "description": "Items extracted from URL",
      "created_at": "2025-10-26 16:20:22",
      "updated_at": "2025-10-26 16:20:22",
      "item_count": 15
    }
  ],
  "count": 2
}
```

### Image Analysis

#### POST /analyze-image
Analyze images and extract list items using OpenAI Vision.

**Request:**
```json
{
  "imageData": "data:image/jpeg;base64,/9j/4AAQ...",
  "mimeType": "image/jpeg"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "item_name": "apple",
      "category": "groceries",
      "quantity": "5",
      "notes": "Fresh red apples"
    }
  ]
}
```

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes
- `400`: Bad Request - Invalid input data
- `404`: Not Found - Endpoint not available
- `500`: Internal Server Error - Server processing error

## Arize Tracing

All API endpoints automatically generate traces with:
- **Span Names**: Operation-specific names
- **Attributes**: Request/response metadata
- **Performance**: Latency and throughput metrics
- **Errors**: Exception tracking and status codes

### Trace Attributes
- `http.method`: HTTP method (GET, POST)
- `http.url`: Request URL
- `http.status_code`: Response status
- `service.name`: Service identifier
- `model_id`: Arize model identifier

## Authentication

Currently no authentication required for development. Production deployment should implement proper authentication.

## Rate Limiting

No rate limiting implemented. Consider adding for production use.

## CORS

CORS enabled for development. Configure appropriately for production domains.

## Examples

### cURL Examples

#### Health Check
```bash
curl -X GET http://localhost:3001/api/health
```

#### Get Lists
```bash
curl -X GET http://localhost:3001/api/lists
```

#### Analyze Image
```bash
curl -X POST http://localhost:3001/api/analyze-image \
  -H "Content-Type: application/json" \
  -d '{
    "imageData": "data:image/jpeg;base64,/9j/4AAQ...",
    "mimeType": "image/jpeg"
  }'
```

### JavaScript Examples

#### Fetch API
```javascript
// Health check
const health = await fetch('http://localhost:3001/api/health');
const healthData = await health.json();

// Get lists
const lists = await fetch('http://localhost:3001/api/lists');
const listsData = await lists.json();

// Analyze image
const imageAnalysis = await fetch('http://localhost:3001/api/analyze-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageData: 'data:image/jpeg;base64,/9j/4AAQ...',
    mimeType: 'image/jpeg'
  })
});
const analysisData = await imageAnalysis.json();
```

## Monitoring

### Arize Dashboard
- **URL**: https://app.arize.com/
- **Project**: listify-agent
- **Metrics**: Response times, error rates, token usage

### Health Monitoring
- **Basic**: `/api/health`
- **Detailed**: `/api/health/detailed`
- **Readiness**: `/api/health/ready`
- **Liveness**: `/api/health/live`