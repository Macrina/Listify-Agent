# API Documentation

## Overview

The Listify Agent provides RESTful APIs for image analysis, list management, and text processing.

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

## Monitoring

### Health Monitoring
- **Basic**: `/api/health`
- **Detailed**: `/api/health/detailed`
- **Readiness**: `/api/health/ready`
- **Liveness**: `/api/health/live`