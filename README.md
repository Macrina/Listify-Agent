# Listify Agent

AI-powered application that extracts and creates structured lists from images, screenshots, PDFs, links, or text using OpenAI GPT-4 Vision and AgentDB for data persistence.

## ✨ Features

### Core Functionality
- **🖼️ Image Analysis**: Upload images containing lists and automatically extract structured data
- **📝 Text Analysis**: Paste or type text and extract list items with AI categorization
- **🔗 Link Analysis**: Extract list items from any website or online content
- **📊 Smart Categorization**: Automatically categorizes items (groceries, tasks, contacts, events, etc.)
- **💡 Smart Explanations**: AI generates helpful explanations for each item
- **✅ Status Management**: Mark items as pending/completed with visual indicators
- **📈 Statistics Dashboard**: View analytics about your lists and items
- **💾 Persistent Storage**: All data stored in AgentDB for reliable persistence

### User Interface
- **📱 Responsive Design**: Works seamlessly on desktop and mobile
- **🔄 Real-time Updates**: Instant feedback for all user actions
- **📋 List Management**: Create, view, expand/collapse, and delete lists
- **🎯 Item Management**: Toggle status, delete items, view details
- **📊 Analytics**: Comprehensive statistics and category breakdowns

## 🏗️ Architecture

### Backend (Node.js + Express)
- **AI Processing**: OpenAI GPT-4 Vision API for image analysis
- **Database**: AgentDB with Model Context Protocol (MCP)
- **File Handling**: Multer for secure file uploads
- **API**: RESTful endpoints with comprehensive error handling

### Frontend (React + Vite)
- **Components**: Modular React components with hooks
- **State Management**: Local state with API integration
- **Styling**: Modern CSS with variables and responsive design
- **Performance**: Vite for fast development and optimized builds

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **OpenAI API Key** (with GPT-4 Vision access)
- **AgentDB Account** with API credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Listify-Agent
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Set up database**
   ```bash
   # Run the database setup script
   node backend/setup-database.js
   ```

5. **Start the application**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 📁 Project Structure

```
Listify-Agent/
├── backend/
│   ├── src/
│   │   ├── config/           # Configuration files
│   │   ├── controllers/      # Request handlers
│   │   ├── services/         # Business logic
│   │   ├── routes/          # API routes
│   │   ├── middleware/       # Express middleware
│   │   └── server.js         # Entry point
│   ├── uploads/              # Temporary file storage
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── services/         # API service layer
│   │   ├── styles/           # CSS files
│   │   ├── App.jsx           # Main app component
│   │   └── main.jsx          # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── docs/                     # Documentation
├── .env.example            # Environment template
└── package.json              # Root package.json
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-openai-api-key-here

# AgentDB Configuration
AGENTDB_MCP_URL=https://mcp.agentdb.dev/your-endpoint
AGENTDB_API_KEY=your-agentdb-api-key-here
AGENTDB_DB_NAME=listify-agent

# Server Configuration
PORT=3001
NODE_ENV=development
```

### Database Schema

The application uses the following database schema:

```sql
-- Lists table
CREATE TABLE lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  list_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- List items table
CREATE TABLE list_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id INTEGER NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT,
  quantity TEXT,
  notes TEXT,
  explanation TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  source_type TEXT CHECK (source_type IN ('photo', 'screenshot', 'pdf', 'audio', 'url')),
  extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSON,
  FOREIGN KEY (list_id) REFERENCES lists (id) ON DELETE CASCADE
);
```

## 📚 API Documentation

### Core Endpoints

#### Health Check
```
GET /api/health
```

#### Image Analysis
```
POST /api/upload
Content-Type: multipart/form-data
Body: { image: <file> }
```

#### Text Analysis
```
POST /api/analyze-text
Content-Type: application/json
Body: { text: "your text here" }
```

#### Link Analysis
```
POST /api/analyze-link
Content-Type: application/json
Body: { url: "https://example.com" }
```

#### List Management
```
GET /api/lists                    # Get all lists
GET /api/lists/:id                # Get specific list
POST /api/lists                   # Create new list
DELETE /api/lists/:id             # Delete list
```

#### Item Management
```
PUT /api/items/:id                # Update item
DELETE /api/items/:id             # Delete item
```

#### Analytics
```
GET /api/stats                    # Get statistics
```

For detailed API documentation, see [docs/API.md](docs/API.md).

## 🎯 Usage Examples

### Image Analysis
1. Upload an image containing a handwritten list
2. AI analyzes the image and extracts items
3. Items are automatically categorized and prioritized
4. Save the list with a custom name

### Text Analysis
1. Paste text containing list items
2. AI parses and structures the data
3. Same categorization as image analysis
4. Items are saved to the database

### Link Analysis
1. Enter any website URL
2. AI fetches and analyzes the web content
3. Extracts products, tasks, or structured data
4. Items are categorized and ready to save

### List Management
1. View all your lists in "My Lists" section
2. Expand/collapse lists to see items
3. Mark items as complete/incomplete
4. Delete items or entire lists
5. View statistics and analytics

## 🧪 Testing

### Quick Test
```bash
# Test backend API
curl http://localhost:3001/api/health

# Test text analysis
curl -X POST http://localhost:3001/api/analyze-text \
  -H "Content-Type: application/json" \
  -d '{"text": "Buy milk\nCall dentist\nFinish report"}'

# Test link analysis
curl -X POST http://localhost:3001/api/analyze-link \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### Development Testing
```bash
# Run backend tests
cd backend && npm test

# Run frontend tests
cd frontend && npm test
```

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
# Build the application
npm run build

# Start production server
npm run backend:start
```

### Environment Setup
- **Development**: Uses local AgentDB instance
- **Production**: Configure production AgentDB credentials
- **Staging**: Use separate AgentDB database for testing

## 🔍 Troubleshooting

### Common Issues

#### OpenAI API Errors
- Verify API key has GPT-4 Vision access
- Check account has sufficient credits
- Ensure API key is correctly set in `.env`

#### AgentDB Connection Issues
- Verify AgentDB credentials are correct
- Check database schema is properly created
- Ensure AgentDB instance is active

#### File Upload Issues
- Check `backend/uploads/` directory exists and is writable
- Verify file size limits (default: 10MB)
- Ensure image format is supported (JPEG, PNG, GIF, WebP)

#### Port Conflicts
- Backend runs on port 3001
- Frontend runs on port 3000
- Check for conflicting processes

### Debug Mode
```bash
# Enable debug logging
NODE_ENV=development npm run dev
```

## 📊 Performance

### Benchmarks
- **Image Analysis**: < 10 seconds for typical images
- **Text Analysis**: < 3 seconds for typical text
- **Database Queries**: < 1 second for standard operations
- **List Loading**: < 2 seconds for 50+ lists

### Optimization
- **Caching**: Implement Redis for improved performance
- **Database**: Optimize queries with proper indexing
- **Frontend**: Code splitting and lazy loading
- **API**: Rate limiting and request optimization

## 🔒 Security

### Data Protection
- **File Upload Validation**: Restrict file types and sizes
- **Input Sanitization**: Clean all user inputs
- **SQL Injection Prevention**: Use parameterized queries
- **CORS Configuration**: Restrict cross-origin requests

### Best Practices
- **Environment Variables**: Never commit credentials
- **Input Validation**: Validate all request parameters
- **Error Handling**: Don't expose sensitive information
- **HTTPS**: Use SSL/TLS in production

## 🛠️ Development

### Code Quality
- **ESLint**: JavaScript linting
- **Prettier**: Code formatting
- **Git Hooks**: Pre-commit validation
- **Documentation**: Comprehensive API docs

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📈 Roadmap

### Planned Features
- **PDF Processing**: Extract lists from PDF documents
- **URL Processing**: Extract content from web pages
- **Export Functionality**: Export lists to CSV, JSON, PDF
- **Collaborative Lists**: Share lists with other users
- **Mobile App**: Native mobile application
- **Voice Input**: Speech-to-text for list creation

### Technical Improvements
- **Caching**: Redis for improved performance
- **Search**: Full-text search across all lists
- **Notifications**: Real-time updates
- **Analytics**: Advanced usage analytics
- **Backup**: Automated backup solutions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review API endpoint responses for error details

## 🙏 Acknowledgments

- **OpenAI** for GPT-4 Vision API
- **AgentDB** for database infrastructure
- **React** and **Express** communities
- **Vite** for fast development experience

---

**Listify Agent** - Transform your images and text into structured, actionable lists with the power of AI! 🚀