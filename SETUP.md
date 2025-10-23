# Quick Setup Guide

This guide will help you get Listify Agent up and running in minutes.

## Quick Start (5 minutes)

### 1. Get Your Credentials

#### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Make sure you have GPT-4 Vision access (check your account tier)

#### AgentDB Credentials
If you already created your AgentDB database, you should have:
- **API Key**: Your authentication key
- **Database Token**: UUID format (e.g., `afa28f11-dc05-4cae-9e4c-4bdad802d4c8`)
- **Database Name**: `listify-agent` (or your custom name)

### 2. Install and Configure

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd Listify-Agent

# 2. Install all dependencies
npm run install:all

# 3. Copy and edit environment file
cp .env.example .env
nano .env  # or use your favorite editor
```

Edit `.env` and add your credentials:

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
AGENTDB_API_KEY=your_agentdb_api_key
AGENTDB_TOKEN=your_uuid_token
AGENTDB_DB_NAME=listify-agent
```

### 3. Run the Application

```bash
# Start both frontend and backend
npm run dev
```

That's it! Open http://localhost:3000 in your browser.

## Verify Installation

### Test Backend API

```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Listify Agent API is running",
  "timestamp": "2025-10-23T..."
}
```

### Test Text Analysis

```bash
curl -X POST http://localhost:3001/api/analyze-text \
  -H "Content-Type: application/json" \
  -d '{"text": "Buy milk\nCall dentist\nFinish report"}'
```

## Common Issues

### "OPENAI_API_KEY is not set"
- Make sure you created a `.env` file (not `.env.example`)
- Verify the API key is correctly copied (starts with `sk-`)
- Restart the backend server after editing `.env`

### "AGENTDB_API_KEY is not set"
- Check that your `.env` file has the AgentDB credentials
- Verify the credentials are correct (copy from AgentDB dashboard)
- Make sure there are no extra spaces or quotes

### "Cannot connect to database"
- Verify your AgentDB instance is active
- Check that you created the database schema (see README)
- Test your AgentDB connection independently

### Port Already in Use
If port 3000 or 3001 is already in use:

```bash
# Change ports in .env
PORT=4001  # backend port

# Change frontend port in frontend/vite.config.js
server: {
  port: 4000,  // change this
}
```

## Next Steps

1. **Upload a test image**: Take a photo of a handwritten list or screenshot
2. **Try text analysis**: Paste some list items in the text analyzer
3. **Check your lists**: View all extracted lists in the "My Lists" tab
4. **View statistics**: See analytics in the Statistics tab

## Development Tips

### Run Frontend Only
```bash
npm run frontend:dev
```

### Run Backend Only
```bash
npm run backend:dev
```

### View Backend Logs
The backend will show detailed logs including:
- API requests
- OpenAI API calls
- Database queries
- Errors and stack traces

### Frontend Development
- Uses Vite for hot module replacement
- Changes auto-reload in the browser
- React DevTools recommended for debugging

## Getting Help

If you run into issues:

1. Check the main [README.md](README.md) for detailed documentation
2. Review error messages in the terminal
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly

## Production Deployment

For production deployment:

```bash
# Build the application
npm run build

# Set production environment
export NODE_ENV=production

# Start the backend
npm run backend:start

# Serve the frontend build
# (use nginx, Apache, or any static file server)
```

Consider:
- Use a process manager (PM2, systemd)
- Set up HTTPS with Let's Encrypt
- Use environment-specific .env files
- Enable production logging
- Set up monitoring and alerts
