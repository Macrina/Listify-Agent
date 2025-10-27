# Listify Agent

An intelligent list extraction and management system with comprehensive Arize AI observability.

## Features

- **Image Analysis**: Extract list items from images using OpenAI Vision
- **Text Processing**: Parse and categorize items from text input
- **List Management**: Store and organize extracted items
- **Arize Observability**: Complete tracing for both Node.js and Python
- **Evaluation Framework**: Quality assessment and hallucination detection

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+
- OpenAI API key
- Arize credentials

### Installation

1. **Clone Repository**
```bash
git clone https://github.com/your-username/Listify-Agent.git
cd Listify-Agent
```

2. **Install Node.js Dependencies**
```bash
npm install
```

3. **Setup Python Environment**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

4. **Configure Environment**
```bash
# Create .env file in backend/
ARIZE_SPACE_ID=your_space_id
ARIZE_API_KEY=your_api_key
ARIZE_PROJECT_NAME=listify-agent
OPENAI_API_KEY=your_openai_key
```

5. **Start Services**
```bash
# Start Node.js backend
npm start

# In another terminal, test Python integration
source backend/.venv/bin/activate
python backend/python_arize_setup.py
```

## API Usage

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Get Lists
```bash
curl http://localhost:3001/api/lists
```

### Analyze Image
```bash
curl -X POST http://localhost:3001/api/analyze-image \
  -H "Content-Type: application/json" \
  -d '{
    "imageData": "data:image/jpeg;base64,/9j/4AAQ...",
    "mimeType": "image/jpeg"
  }'
```

## Arize Observability

### Dashboard Access
- **URL**: https://app.arize.com/
- **Project**: listify-agent
- **Services**: listify-agent (Node.js), python-arize-service (Python)

### Key Metrics
- **Response Quality**: Overall scores (1-5)
- **Hallucination Rate**: Detection accuracy
- **Token Usage**: Cost tracking
- **Latency**: Performance monitoring
- **Error Rate**: Reliability metrics

### Trace Types
- **Node.js**: MCP-compliant with OpenInference conventions
- **Python**: OpenTelemetry-based tracing
- **Cross-Service**: Python ↔ Node.js integration

## Testing

### Run All Tests
```bash
# Node.js tests
node backend/test-mcp-compliance.js

# Python tests
source backend/.venv/bin/activate
python backend/comprehensive_arize_test.py
```

### Test Results
- **Python Setup**: ✅ PASS
- **Node.js Health**: ✅ PASS
- **Cross-Service**: ✅ PASS
- **Overall Success**: 83.3% (5/6 tests)

## Documentation

- [API Documentation](docs/API.md) - Complete API reference
- [Arize Integration](docs/ARIZE_INTEGRATION.md) - Observability setup
- [Evaluation Framework](docs/ARIZE_EVALUATION_FRAMEWORK.md) - Quality assessment
- [MCP Compliance](docs/MCP_COMPLIANCE_SUMMARY.md) - Node.js implementation
- [Python Implementation](docs/PYTHON_ARIZE_SUMMARY.md) - Python tracing

## Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Node.js API   │
│   (React)       │◄──►│   (Express)     │
└─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Python        │
                       │   Integration   │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Arize AI      │
                       │   Dashboard     │
                       └─────────────────┘
```

## Production Deployment

### Environment Setup
1. Configure production environment variables
2. Set up proper authentication
3. Configure CORS for production domains
4. Implement rate limiting
5. Set up monitoring and alerts

### Deployment Platforms
- **Render**: Use `render.yaml` configuration
- **Docker**: Containerize with Dockerfile
- **Cloud**: Deploy to AWS, GCP, or Azure

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues or questions:
- Check the documentation in the `docs/` folder
- Review test results for component status
- Verify environment variables are set correctly
- Check Arize dashboard for trace visibility