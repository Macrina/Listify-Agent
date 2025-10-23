# AgentDB Setup Guide

You're getting a 404 error because AgentDB uses MCP (Model Context Protocol), not a traditional REST API.

## 🎯 Choose Your Approach

### Option 1: Manual SQL Setup (EASIEST) ⭐

**Step 1:** Go to your AgentDB Dashboard
- Visit https://agentdb.dev (or your AgentDB console URL)
- Log in and select your `listify-agent` database

**Step 2:** Find the SQL Console/Query Interface
- Look for "SQL Editor", "Console", or "Query" section

**Step 3:** Copy and paste this SQL:

```sql
-- Create lists table
CREATE TABLE IF NOT EXISTS lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_type TEXT NOT NULL,
  source_metadata TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  item_count INTEGER DEFAULT 0
);

-- Create list_items table
CREATE TABLE IF NOT EXISTS list_items (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_list_items_list_id ON list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_list_items_status ON list_items(status);
CREATE INDEX IF NOT EXISTS idx_list_items_category ON list_items(category);
```

**Step 4:** Execute the SQL
- Click "Run", "Execute", or similar button
- You should see success messages

**Step 5:** Verify
```sql
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
```

You should see: `lists` and `list_items`

**Step 6:** Test your app!
```bash
npm run dev
```

---

### Option 2: Use SQLite Locally Instead

If AgentDB is giving you trouble, use SQLite locally:

**Step 1:** Install better-sqlite3
```bash
cd backend
npm install better-sqlite3
```

**Step 2:** Update your imports

Edit `backend/src/controllers/listController.js`:

Change:
```javascript
import { ... } from '../services/agentdbService.js';
```

To:
```javascript
import { ... } from '../services/sqliteService.js';
```

**Step 3:** Initialize database

Edit `backend/src/server.js`, add this before `app.listen()`:

```javascript
import { initializeDatabase } from './services/sqliteService.js';

// Initialize SQLite database
initializeDatabase();
```

**Step 4:** Run the app
```bash
npm run dev
```

Database file will be created at `backend/listify.db`

---

### Option 3: Find AgentDB's Correct API

**Check AgentDB Documentation:**
1. Go to AgentDB's documentation
2. Look for "API Reference" or "REST API"
3. Find the correct endpoint for executing queries

**Update the service:**

Once you find the correct endpoint, update `backend/src/services/agentdbService.js`:

```javascript
const AGENTDB_API_BASE = 'https://correct-api-url-here.com';
```

---

## 🔍 Which Option Should You Choose?

| Option | Pros | Cons | Recommended For |
|--------|------|------|-----------------|
| **Manual SQL** | Simple, quick, uses AgentDB | One-time setup | Most users ⭐ |
| **SQLite Local** | No external dependencies | Local only, not cloud | Development/testing |
| **Find Correct API** | Automated setup | Need to research API docs | Advanced users |

---

## ✅ After Setup

Once tables are created (via any method), test the app:

```bash
# Start the application
npm run dev

# Open browser
open http://localhost:3000

# Test text analysis first (easiest)
# Paste: "Buy milk\nCall dentist\nFinish report"
```

---

## 🆘 Still Having Issues?

**404 Error** = Endpoint not found
- Means the API URL is wrong
- Use Option 1 (Manual SQL) or Option 2 (SQLite)

**403 Error** = Access denied
- Check your AgentDB API key and token
- Make sure they're correctly set in `.env`

**Connection Error** = Network issue
- Check your internet connection
- Verify AgentDB service is running

---

## 💡 Recommended Quick Solution

**For now, use Manual SQL Setup (Option 1)**

1. ✅ Go to AgentDB dashboard
2. ✅ Run the SQL from above
3. ✅ Start your app: `npm run dev`
4. ✅ Test it works!

Later, you can research AgentDB's correct API if you want automated setup.

---

## 📖 AgentDB Resources

- AgentDB Documentation: Check for API endpoints
- MCP Protocol Info: https://modelcontextprotocol.io
- Your MCP URL: `https://mcp.agentdb.dev/eq1MHpX-qn`

The MCP URL is for Claude Desktop/MCP clients, not for HTTP REST API calls.
