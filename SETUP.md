# Listify Agent - Setup Guide

This guide will help you get Listify Agent up and running in minutes.

## 🚀 Quick Start (5 minutes)

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **OpenAI API Key** (with GPT-4 Vision access)
- **AgentDB Account** with API credentials

### Step 1: Get Your Credentials

#### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Make sure you have GPT-4 Vision access (check your account tier)

#### AgentDB Credentials
1. Visit https://agentdb.dev
2. Create an account or sign in
3. Get your API key and MCP URL from the dashboard
4. Note your database name (default: `listify-agent`)

### Step 2: Clone and Install

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd Listify-Agent

# 2. Install all dependencies
npm run install:all
```

### Step 3: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your credentials
nano .env  # or use your favorite editor
```

Add your credentials to `.env`:

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

### Step 4: Set Up Database

Run the database setup script:

```bash
cd backend
node setup-database.js
```

This will create the required tables in your AgentDB database.

### Step 5: Start the Application

```bash
# Start both frontend and backend
npm run dev
```

**That's it!** Open http://localhost:3000 in your browser.

## ✅ Verify Installation

### Test Backend API

```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Listify Agent API is running",
  "timestamp": "2025-01-23T..."
}
```

### Test Text Analysis

```bash
curl -X POST http://localhost:3001/api/analyze-text \
  -H "Content-Type: application/json" \
  -d '{"text": "Buy milk\nCall dentist\nFinish report"}'
```

### Test Image Upload

1. Open http://localhost:3000
2. Click "Upload Image" tab
3. Upload a test image with a list
4. Watch the AI extract your items!

## 🔧 Development Setup

### Run Services Separately

**Terminal 1 - Backend:**
```bash
npm run backend:dev
```

**Terminal 2 - Frontend:**
```bash
npm run frontend:dev
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | `sk-proj-...` |
| `AGENTDB_MCP_URL` | AgentDB MCP endpoint | `https://mcp.agentdb.dev/...` |
| `AGENTDB_API_KEY` | AgentDB API key | `agentdb_...` |
| `AGENTDB_DB_NAME` | Database name | `listify-agent` |
| `PORT` | Backend port | `3001` |

### Database Schema

The application creates these tables:

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

## 🧪 Testing Your Setup

### 1. Test Text Analysis (Easiest)

1. Open http://localhost:3000
2. Click "Analyze Text" tab
3. Paste this sample text:
   ```
   Buy milk
   Call dentist
   Finish project report by Friday
   ```
4. Click "Analyze Text"
5. You should see 3 extracted items!

### 2. Test Image Upload

1. Click "Upload Image" tab
2. Take a photo of a handwritten list or upload a screenshot
3. Click "Upload & Analyze"
4. Watch the AI extract your list items!

### 3. Test List Management

1. Click "My Lists" tab
2. Expand a list to see items
3. Check off completed items
4. Delete items
5. View statistics

## 🆘 Troubleshooting

### Common Issues

#### "OPENAI_API_KEY is not set"
- Make sure you created a `.env` file (not `.env.example`)
- Verify the API key is correctly copied (starts with `sk-`)
- Restart the backend server after editing `.env`

#### "AGENTDB_API_KEY is not set"
- Check that your `.env` file has the AgentDB credentials
- Verify the credentials are correct (copy from AgentDB dashboard)
- Make sure there are no extra spaces or quotes

#### "Cannot connect to database"
- Verify your AgentDB instance is active
- Check that you created the database schema
- Test your AgentDB connection independently

#### Port Already in Use
If port 3000 or 3001 is already in use:

**Backend** - Edit `.env`:
```env
PORT=4001
```

**Frontend** - Edit `frontend/vite.config.js`:
```javascript
server: {
  port: 4000,
}
```

#### Module Not Found Errors
If you get "Cannot find module" errors:

```bash
# Reinstall dependencies
rm -rf node_modules backend/node_modules frontend/node_modules
npm run install:all
```

### Debug Mode

Enable detailed logging:

```bash
# Backend with debug logging
DEBUG=* npm run backend:dev

# Frontend with debug logging
npm run frontend:dev -- --debug
```

### Check Logs

**Backend logs show:**
- API requests
- OpenAI API calls
- Database queries
- Errors and stack traces

**Frontend logs show:**
- Component renders
- API calls
- JavaScript errors

## 🚀 Production Setup

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm run backend:start
```

### Environment Configuration

For production, update your `.env`:

```env
NODE_ENV=production
PORT=3001
# ... other production settings
```

### Deployment Considerations

- **Process Management**: Use PM2 or similar
- **Reverse Proxy**: Configure Nginx or Apache
- **SSL/TLS**: Set up HTTPS
- **Monitoring**: Add application monitoring
- **Backup**: Set up database backups

## 📊 Performance Tips

### Optimization

1. **Database Indexing**: Ensure proper indexes are created
2. **Image Compression**: Compress images before upload
3. **Caching**: Implement Redis for frequently accessed data
4. **CDN**: Use a CDN for static assets

### Monitoring

- **API Response Times**: Monitor endpoint performance
- **Database Queries**: Track query execution times
- **Memory Usage**: Monitor application memory
- **Error Rates**: Track and alert on errors

## 🔒 Security Considerations

### Best Practices

1. **Environment Variables**: Never commit credentials
2. **Input Validation**: Validate all user inputs
3. **File Upload**: Restrict file types and sizes
4. **CORS**: Configure proper CORS settings
5. **HTTPS**: Use SSL/TLS in production

### Security Checklist

- [ ] API keys are in environment variables
- [ ] File upload validation is enabled
- [ ] Input sanitization is implemented
- [ ] CORS is properly configured
- [ ] HTTPS is enabled in production
- [ ] Database credentials are secure

## 📚 Additional Resources

### Documentation
- [API Documentation](docs/API.md)
- [Local Setup Guide](LOCAL_SETUP.md)
- [AgentDB Setup](AGENTDB_SETUP.md)
- [Requirements](REQUIREMENTS.md)

### Support
- Check the main [README.md](README.md) for detailed documentation
- Review error messages in the terminal
- Check browser console for frontend errors
- Verify all environment variables are set correctly

## 🎉 You're All Set!

Your Listify Agent is ready to go. Just need to:

1. ✅ Clone the code to your local machine
2. ✅ Configure your credentials in `.env`
3. ✅ Run the database setup
4. ✅ Start the application with `npm run dev`
5. ✅ Open http://localhost:3000

Enjoy your AI-powered list extraction tool! 🚀