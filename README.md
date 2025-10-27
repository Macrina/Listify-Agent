# Listify Agent

An intelligent list extraction and management system.

## Features

- **Image Analysis**: Extract list items from images using OpenAI Vision
- **Text Processing**: Parse and categorize items from text input
- **List Management**: Store and organize extracted items
- **AgentDB Integration**: Store and manage extracted items
- **RESTful API**: Complete API for all operations

## Quick Start

### Prerequisites
- Node.js 18+
- OpenAI API key
- AgentDB credentials

### Installation

1. **Clone Repository**
```bash
git clone https://github.com/your-username/Listify-Agent.git
cd Listify-Agent
```

2. **Install Dependencies**
```bash
npm install
```

3. **Configure Environment**
```bash
# Create .env file in backend/
OPENAI_API_KEY=your_openai_key
AGENTDB_API_KEY=your_agentdb_key
AGENTDB_MCP_URL=your_agentdb_url
```

4. **Start Development Server**
```bash
npm run dev
```

## Usage

### Image Analysis
Upload images to extract list items automatically.

### Text Processing
Submit text to parse and categorize items.

### List Management
View, edit, and organize your extracted items.

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/upload` - Upload and analyze images
- `POST /api/analyze-text` - Analyze text input
- `GET /api/lists` - Get all lists
- `GET /api/lists/:id` - Get specific list
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

## Deployment

The application can be deployed to any Node.js hosting platform.

### Environment Variables
- `OPENAI_API_KEY`: Your OpenAI API key
- `AGENTDB_API_KEY`: Your AgentDB API key
- `AGENTDB_MCP_URL`: Your AgentDB MCP URL
- `NODE_ENV`: Environment (development/production)

## Documentation

- [API Documentation](docs/API.md) - Complete API reference
- [Setup Guide](SETUP.md) - Detailed setup instructions
- [Requirements](REQUIREMENTS.md) - System requirements

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AgentDB       │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   OpenAI API    │
                       │   (Vision)      │
                       └─────────────────┘
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.