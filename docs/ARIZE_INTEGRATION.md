# Arize AI Integration

## Overview

The Listify Agent implements comprehensive Arize AI observability with both Node.js and Python tracing capabilities.

## Features

### Node.js Implementation (MCP-Compliant)
- **OpenInference Semantic Conventions**: Standardized span attributes
- **GRPC Exporter**: Efficient trace transmission to Arize
- **Span Kinds**: AGENT, LLM, TOOL, EVALUATOR
- **Token Counting**: Accurate cost tracking
- **Error Handling**: Proper exception recording

### Python Implementation
- **OpenTelemetry Integration**: Standard Python tracing
- **Virtual Environment**: Isolated dependencies
- **Cross-Service Communication**: Python ↔ Node.js integration
- **Request Instrumentation**: Automatic HTTP tracing

## Configuration

### Environment Variables
```bash
ARIZE_SPACE_ID=your_space_id
ARIZE_API_KEY=your_api_key
ARIZE_PROJECT_NAME=listify-agent
ARIZE_ENDPOINT=https://otlp.arize.com/v1/traces
```

### Node.js Setup
```javascript
import { initializeArizeTracing } from './src/config/arize-mcp.js';
const { tracerProvider, tracer } = initializeArizeTracing();
```

### Python Setup
```python
from python_arize_setup import initialize_python_arize_tracing
tracer_provider = initialize_python_arize_tracing()
```

## Usage

### Node.js Tracing
```javascript
import { createAgentSpan, createLLMSpan } from './src/utils/tracing-mcp.js';

const agentSpan = createAgentSpan('operation-name', 'description');
// ... perform operations
agentSpan.end();
```

### Python Tracing
```python
from opentelemetry import trace

tracer = trace.get_tracer(__name__)
with tracer.start_as_current_span("operation-name") as span:
    span.set_attribute("key", "value")
    # ... perform operations
```

## Dashboard

### Arize Dashboard Access
- **URL**: https://app.arize.com/
- **Project**: listify-agent
- **Services**: listify-agent (Node.js), python-arize-service (Python)

### Key Metrics
- **Response Quality**: Overall scores (1-5)
- **Hallucination Rate**: Detection accuracy
- **Token Usage**: Cost tracking
- **Latency**: Performance monitoring
- **Error Rate**: Reliability metrics

## Testing

### Run Tests
```bash
# Node.js tests
node test-mcp-compliance.js

# Python tests
source backend/.venv/bin/activate
python backend/comprehensive_arize_test.py
```

### Test Results
- **Python Setup**: ✅ PASS
- **Node.js Health**: ✅ PASS
- **Cross-Service**: ✅ PASS
- **Overall Success**: 83.3% (5/6 tests)

## Files Structure

```
backend/
├── src/config/arize-mcp.js          # Node.js MCP configuration
├── src/utils/tracing-mcp.js          # Node.js tracing utilities
├── python_arize_setup.py             # Python setup
├── python_arize_service.py           # Python integration
├── comprehensive_arize_test.py        # Testing suite
├── requirements.txt                  # Python dependencies
└── .venv/                           # Virtual environment

docs/
├── API.md                           # API documentation
├── ARIZE_EVALUATION_FRAMEWORK.md    # Evaluation framework
├── MCP_COMPLIANCE_SUMMARY.md        # MCP compliance
└── PYTHON_ARIZE_SUMMARY.md          # Python implementation
```

## Production Deployment

### Prerequisites
- Node.js 18+ with npm packages installed
- Python 3.8+ with virtual environment activated
- Arize credentials configured

### Deployment Steps
1. Install dependencies: `npm install` and `pip install -r requirements.txt`
2. Configure environment variables
3. Initialize tracing in application startup
4. Monitor dashboard for traces

## Support

For issues or questions:
- Check Arize dashboard for trace visibility
- Review test results for component status
- Verify environment variables are set correctly
- Ensure both Node.js and Python services are running
