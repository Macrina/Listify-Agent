# Listify Agent

An intelligent AI-powered list extraction and management system that uses OpenAI Vision and GPT models to extract, categorize, and organize items from images, text, and web links.

## 🚀 Features

### Core Functionality
- **📸 Image Analysis**: Extract list items from images using OpenAI Vision API
- **📝 Text Processing**: Parse and categorize items from unstructured text input
- **🔗 Link Analysis**: Extract content and create lists from web URLs
- **📊 List Management**: Store, organize, and manage extracted items with full CRUD operations
- **🎯 Smart Categorization**: AI-powered automatic categorization of items
- **📈 Statistics Dashboard**: Track usage and performance metrics

### Technical Features
- **🔍 Arize Tracing**: Comprehensive observability and monitoring with OpenTelemetry
- **🗄️ AgentDB Integration**: Cloud-hosted database with MCP protocol
- **🌐 RESTful API**: Complete API for all operations
- **⚡ Real-time Processing**: Fast AI-powered analysis
- **📱 Modern UI**: React-based responsive frontend

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AgentDB       │
│   (React/Vite)  │◄──►│   (Node.js)     │◄──►│   (Cloud DB)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   OpenAI API    │
                       │   (Vision/GPT)  │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Arize         │
                       │   (Tracing)     │
                       └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+**
- **Python 3.12+** (for Arize tracing)
- **OpenAI API key**
- **AgentDB credentials**
- **Arize credentials** (for observability)

### Installation

1. **Clone Repository**
```bash
git clone https://github.com/Macrina/Listify-Agent.git
cd Listify-Agent
```

2. **Install Dependencies**
```bash
# Install all dependencies
npm run install:all

# Or install individually
npm install                    # Root dependencies
cd backend && npm install      # Backend dependencies
cd frontend && npm install     # Frontend dependencies
```

3. **Configure Environment**
Create `backend/.env` file:
```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# AgentDB Configuration
AGENTDB_API_KEY=your_agentdb_api_key
AGENTDB_MCP_URL=https://mcp.agentdb.dev/your-token
AGENTDB_DB_NAME=listify-agent

# Arize Tracing Configuration
ARIZE_SPACE_ID=your_space_id
ARIZE_API_KEY=your_arize_api_key
ARIZE_PROJECT_NAME=listify-agent
ARIZE_ENDPOINT=https://otlp.arize.com

# Server Configuration
NODE_ENV=development
PORT=3001
```

4. **Start Development Servers**
```bash
# Start both frontend and backend
npm start

# Or start individually
npm run backend:dev    # Backend only
npm run frontend:dev   # Frontend only
```

## 📖 Usage

### Web Interface
- **Frontend**: http://localhost:3000 (or 3002 if 3000 is busy)
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

### API Endpoints

#### Core Operations
- `GET /api/health` - Health check
- `POST /api/upload` - Upload and analyze images
- `POST /api/analyze-text` - Analyze text input
- `POST /api/analyze-link` - Analyze web links

#### List Management
- `GET /api/lists` - Get all lists
- `GET /api/lists/:id` - Get specific list
- `POST /api/lists` - Create new list
- `PUT /api/lists/:id` - Update list
- `DELETE /api/lists/:id` - Delete list

#### Item Management
- `GET /api/items` - Get all items
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

#### Statistics
- `GET /api/stats` - Get usage statistics

### Example API Usage

#### Text Analysis
```bash
curl -X POST http://localhost:3001/api/analyze-text \
  -H "Content-Type: application/json" \
  -d '{"text": "Buy milk, eggs, bread, and cheese"}'
```

#### Image Upload
```bash
curl -X POST http://localhost:3001/api/upload \
  -F "image=@receipt.jpg"
```

#### Link Analysis
```bash
curl -X POST http://localhost:3001/api/analyze-link \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/shopping-list"}'
```

## 🧪 Testing

### Run All Tests
```bash
make test-all
```

### Individual Test Categories
```bash
# Arize tracing tests
make test-traces

# LLM evaluation tests
make test-llm-evaluations

# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Production Trace Testing
```bash
# Test production API calls
node test_production_traces_real.js
```

## 📊 Observability

### Arize Dashboard
- **Project**: listify-agent
- **Traces**: Real-time request tracing
- **Metrics**: Performance and usage statistics
- **Errors**: Exception tracking and debugging

### Key Metrics Tracked
- API response times
- OpenAI API usage
- Database query performance
- Error rates and types
- User interaction patterns

## 🚀 Deployment

### Render.com Deployment
The application is configured for deployment on Render.com:

1. **Connect Repository**: Link your GitHub repository
2. **Set Environment Variables**: Configure all required environment variables
3. **Deploy**: Automatic deployment on push to main branch

### Environment Variables for Production
```env
NODE_ENV=production
OPENAI_API_KEY=your_production_openai_key
AGENTDB_API_KEY=your_production_agentdb_key
ARIZE_SPACE_ID=your_arize_space_id
ARIZE_API_KEY=your_arize_api_key
```

### Production URLs
- **Application**: https://listify-agent.onrender.com
- **API Health**: https://listify-agent.onrender.com/api/health

## 🛠️ Development

### Available Commands
```bash
# Development
npm start              # Start both frontend and backend
npm run dev           # Development mode
npm run backend:dev   # Backend only
npm run frontend:dev  # Frontend only

# Building
npm run build         # Build for production
npm run backend:build # Build backend only
npm run frontend:build # Build frontend only

# Testing
make test-all         # Run all tests
make test-traces      # Test Arize tracing
make lint-all         # Lint all code

# Utilities
npm run health        # Check API health
npm run ports:check   # Check port usage
npm run ports:kill    # Kill running servers
```

### Project Structure
```
Listify-Agent/
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Request controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── test_*.py          # Python test scripts
│   └── requirements.txt   # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   └── styles/        # CSS styles
│   └── vite.config.js     # Vite configuration
├── scripts/               # Build and start scripts
├── docs/                  # Documentation
└── render.yaml           # Render deployment config
```

## 📚 Documentation

- **[API Documentation](docs/API.md)** - Complete API reference
- **[Deployment Guide](DEPLOYMENT.md)** - Deployment instructions
- **[Arize Debug Guide](ARIZE_DEBUG_GUIDE.md)** - Troubleshooting tracing
- **[AgentDB Integration](AGENTDB_MCP_INTEGRATION.md)** - Database setup

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code patterns
- Add comprehensive tracing to new features
- Include error handling and logging
- Write tests for new functionality
- Update documentation for API changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting documentation
2. Review Arize dashboard for errors
3. Check application logs
4. Open an issue on GitHub

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: Production Ready ✅