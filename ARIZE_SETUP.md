# Arize Tracing Setup for Listify Agent

This document explains how to set up Arize tracing for observability in the Listify Agent application.

## Overview

Arize tracing provides comprehensive observability for AI applications, tracking:
- LLM calls (OpenAI Vision API)
- Tool calls (AgentDB operations)
- Agent workflows (image analysis, text processing)
- Performance metrics and errors
- Token usage and costs

## Prerequisites

1. **Arize Account**: Sign up at [arize.com](https://arize.com)
2. **Space ID and API Key**: Get these from your Arize space settings
3. **Node.js Dependencies**: Already included in `package.json`

## Environment Variables

Add these environment variables to your `.env` file:

```bash
# Arize Tracing Configuration
ARIZE_SPACE_ID=your_arize_space_id_here
ARIZE_API_KEY=your_arize_api_key_here
ARIZE_PROJECT_NAME=listify-agent
ARIZE_ENDPOINT=https://otlp.arize.com/v1
```

## What's Instrumented

### 1. **Image Analysis (Agent Span)**
- **Span Kind**: AGENT
- **Tracks**: Complete image analysis workflow
- **Attributes**:
  - Input image metadata (size, type)
  - Output item count and categories
  - Analysis source and processing time

### 2. **OpenAI Vision API (LLM Span)**
- **Span Kind**: LLM
- **Tracks**: GPT-4 Vision API calls
- **Attributes**:
  - Model name and version
  - Token usage (prompt, completion, total)
  - Temperature and max tokens
  - Input/output messages
  - Image metadata

### 3. **AgentDB Operations (Tool Span)**
- **Span Kind**: TOOL
- **Tracks**: Database queries and operations
- **Attributes**:
  - Query type and parameters
  - Row counts and operation results
  - Database performance metrics

### 4. **HTTP Requests (Auto-instrumented)**
- **Tracks**: All Express.js API endpoints
- **Attributes**:
  - Request/response details
  - Status codes and timing
  - Error tracking

## Span Hierarchy

```
Agent Span (analyze-image)
├── LLM Span (openai-vision-analysis)
└── Tool Spans (agentdb-query)
    ├── Create List
    ├── Insert Items
    └── Update Statistics
```

## Key Features

### 1. **Automatic Instrumentation**
- HTTP requests (Express.js)
- File system operations
- Network calls
- Database operations

### 2. **Manual Instrumentation**
- Custom business logic spans
- AI model calls
- Tool executions
- Error tracking

### 3. **Semantic Conventions**
- OpenInference standard attributes
- LLM-specific metadata
- Tool call information
- Retrieval document tracking

### 4. **Error Handling**
- Exception recording
- Error context preservation
- Stack trace capture
- Error classification

## Monitoring in Arize

Once configured, you can monitor:

### 1. **Performance Metrics**
- Response times
- Token usage and costs
- Error rates
- Throughput

### 2. **AI-Specific Insights**
- Model performance
- Prompt effectiveness
- Output quality
- Cost optimization

### 3. **Debugging**
- Request tracing
- Error investigation
- Performance bottlenecks
- Data flow analysis

## Local Development

1. **Install Dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Set Environment Variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your Arize credentials
   ```

3. **Start with Tracing**:
   ```bash
   npm start
   ```

4. **Verify Tracing**:
   - Check console for "✅ Arize tracing initialized successfully"
   - Upload an image to see traces in Arize dashboard

## Production Deployment

### Render.com Setup

1. **Add Environment Variables** in Render dashboard:
   - `ARIZE_SPACE_ID`: Your Arize space ID
   - `ARIZE_API_KEY`: Your Arize API key
   - `ARIZE_PROJECT_NAME`: `listify-agent`
   - `ARIZE_ENDPOINT`: `https://otlp.arize.com/v1`

2. **Deploy**: The tracing will automatically start with your deployment

### Verification

1. **Check Logs**: Look for "✅ Arize tracing initialized successfully"
2. **Test Endpoints**: Upload an image or analyze text
3. **View Traces**: Check your Arize dashboard for incoming traces

## Troubleshooting

### Common Issues

1. **"Arize tracing disabled - missing credentials"**
   - Check that `ARIZE_SPACE_ID` and `ARIZE_API_KEY` are set
   - Verify credentials are correct

2. **No traces appearing in Arize**
   - Check network connectivity
   - Verify endpoint URL is correct
   - Check API key permissions

3. **Performance impact**
   - Tracing adds minimal overhead (~1-2ms per request)
   - Spans are batched and sent asynchronously
   - Can be disabled by removing environment variables

### Debug Mode

Enable debug logging by setting:
```bash
OTEL_LOG_LEVEL=debug
```

## Cost Considerations

- **Free Tier**: Arize offers free tracing for development
- **Production**: Pricing based on trace volume
- **Optimization**: Use sampling for high-volume applications

## Next Steps

1. **Set up Arize account** and get credentials
2. **Configure environment variables**
3. **Deploy and test** the application
4. **Explore Arize dashboard** for insights
5. **Set up alerts** for errors and performance issues

For more information, visit the [Arize documentation](https://docs.arize.com/).
