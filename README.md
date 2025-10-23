# Listify Agent

AI-powered agent that extracts and creates structured lists from images, screenshots, PDFs, links, or text using OpenAI GPT-4 Vision and AgentDB.

## Features

- **Image Analysis**: Upload images containing lists, tasks, or notes and automatically extract structured data
- **Text Analysis**: Paste or type text and extract list items with AI categorization
- **Smart Categorization**: Automatically categorizes items (groceries, tasks, contacts, events, etc.)
- **Priority Detection**: AI estimates priority levels based on context
- **Full CRUD Operations**: Create, read, update, and delete list items
- **Search Functionality**: Search across all your lists
- **Statistics Dashboard**: View analytics about your lists and items
- **Persistent Storage**: All data stored in AgentDB for reliable persistence

## Tech Stack

### Backend
- **Node.js** with Express
- **OpenAI GPT-4 Vision API** for image analysis
- **AgentDB** for data persistence
- **Multer** for file uploads

### Frontend
- **React 18** with Hooks
- **Vite** for fast development
- **Axios** for API calls
- Modern CSS with CSS Variables

## Project Structure

```
Listify-Agent/
├── backend/
│   ├── src/
│   │   ├── config/           # Configuration files (OpenAI, AgentDB)
│   │   ├── controllers/      # Request handlers
│   │   ├── services/         # Business logic (AI analysis, DB operations)
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Express middleware (file upload)
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
├── .env.example              # Environment variables template
├── .gitignore
└── package.json              # Root package.json for scripts
```

## Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **OpenAI API Key** (with GPT-4 Vision access)
- **AgentDB Account** with:
  - Database Token (UUID)
  - API Key
  - MCP Server URL (optional)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/Listify-Agent.git
cd Listify-Agent
```

### 2. Install Dependencies

```bash
# Install all dependencies (root, backend, and frontend)
npm run install:all
```

Or install individually:

```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### 3. Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your actual credentials:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# AgentDB Configuration
AGENTDB_API_KEY=your_agentdb_api_key_here
AGENTDB_TOKEN=your_database_token_here
AGENTDB_DB_NAME=listify-agent
AGENTDB_MCP_URL=https://mcp.agentdb.dev/your-mcp-url

# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### 4. Set Up AgentDB Database

The application expects the following AgentDB schema:

```sql
-- Lists table
CREATE TABLE lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_type TEXT NOT NULL,
  source_metadata TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  item_count INTEGER DEFAULT 0
);

-- List items table
CREATE TABLE list_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id INTEGER NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  quantity TEXT,
  priority TEXT DEFAULT 'medium',
  notes TEXT,
  status TEXT DEFAULT 'active',
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_list_items_list_id ON list_items(list_id);
CREATE INDEX idx_list_items_status ON list_items(status);
CREATE INDEX idx_list_items_category ON list_items(category);
```

## Usage

### Development Mode

Run both backend and frontend simultaneously:

```bash
npm run dev
```

Or run them separately:

```bash
# Terminal 1 - Backend
npm run backend:dev

# Terminal 2 - Frontend
npm run frontend:dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

### Production Build

```bash
# Build both frontend and backend
npm run build

# Start production server
npm run backend:start
```

## API Endpoints

### Health Check
```
GET /api/health
```

### Image Upload
```
POST /api/upload
Content-Type: multipart/form-data
Body: { image: <file> }
```

### Text Analysis
```
POST /api/analyze-text
Content-Type: application/json
Body: { text: "your text here" }
```

### Get All Lists
```
GET /api/lists?limit=50
```

### Get List Items
```
GET /api/lists/:id
```

### Update Item
```
PUT /api/items/:id
Content-Type: application/json
Body: { status: "completed", priority: "high", ... }
```

### Delete Item
```
DELETE /api/items/:id
```

### Search Items
```
GET /api/search?q=keyword
```

### Get Statistics
```
GET /api/stats
```

## Features in Detail

### Image Analysis
1. Upload an image containing lists, handwritten notes, or structured data
2. AI analyzes the image and extracts:
   - Item names
   - Categories (auto-detected)
   - Quantities (if visible)
   - Priority levels (estimated from context)
   - Additional notes

### Text Analysis
1. Paste or type text containing list items
2. AI parses and structures the data
3. Same extraction as image analysis

### List Management
- View all your lists organized by creation date
- Expand/collapse lists to see items
- Mark items as complete/incomplete
- Delete items
- View statistics and analytics

## Testing

### Quick Test Script

Create a test file to verify your setup:

```bash
# Create test directory
mkdir test
```

Create `test/test-api.js`:

```javascript
import fetch from 'node-fetch';

async function testAPI() {
  try {
    // Test health endpoint
    const health = await fetch('http://localhost:3001/api/health');
    const healthData = await health.json();
    console.log('Health Check:', healthData);

    // Test text analysis
    const response = await fetch('http://localhost:3001/api/analyze-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: '- Buy milk\n- Call dentist\n- Finish project report by Friday'
      })
    });

    const result = await response.json();
    console.log('Analysis Result:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAPI();
```

Run the test:

```bash
cd test && node test-api.js
```

## Troubleshooting

### OpenAI API Errors
- Ensure your API key has GPT-4 Vision access
- Check your OpenAI account has sufficient credits
- Verify the API key is correctly set in `.env`

### AgentDB Connection Issues
- Verify your AgentDB credentials are correct
- Check that the database schema is properly created
- Ensure your AgentDB instance is active

### File Upload Issues
- Check that `backend/uploads/` directory exists and is writable
- Verify file size limits (default: 10MB)
- Ensure image format is supported (JPEG, PNG, GIF, WebP)

### CORS Issues
- Verify `FRONTEND_URL` in `.env` matches your frontend URL
- Check that both servers are running

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **OpenAI** for GPT-4 Vision API
- **AgentDB** for database infrastructure
- Built with React and Express

## Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review API endpoint responses for error details

## Roadmap

- [ ] PDF parsing support
- [ ] URL/webpage content extraction
- [ ] Export lists to various formats (CSV, JSON, PDF)
- [ ] Collaborative lists with sharing
- [ ] Mobile app
- [ ] Voice input for list creation
- [ ] Integration with popular task management tools
