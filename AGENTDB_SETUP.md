# AgentDB Integration Setup

This guide covers setting up AgentDB integration for Listify Agent using the Model Context Protocol (MCP).

## 🎯 Current Status

**✅ Working**: Your Listify-Agent application is fully functional with:
- Real AgentDB integration via MCP protocol
- Persistent data storage
- All CRUD operations working
- Statistics and analytics
- Image and text analysis

## 🔧 AgentDB Configuration

### Prerequisites

1. **AgentDB Account**: Valid account with API access
2. **MCP Endpoint**: Your AgentDB MCP server URL
3. **API Key**: Authentication key for AgentDB
4. **Database Name**: Your database identifier

### Environment Variables

Configure your `.env` file with AgentDB credentials:

```env
# AgentDB Configuration
AGENTDB_MCP_URL=https://mcp.agentdb.dev/your-endpoint
AGENTDB_API_KEY=your-agentdb-api-key-here
AGENTDB_DB_NAME=listify-agent
```

### Database Schema

The application uses the following database schema:

```sql
-- Lists table
CREATE TABLE IF NOT EXISTS lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  list_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- List items table
CREATE TABLE IF NOT EXISTS list_items (
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_list_items_list_id ON list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_list_items_category ON list_items(category);
CREATE INDEX IF NOT EXISTS idx_list_items_status ON list_items(status);
```

## 🚀 Setup Process

### Step 1: Get AgentDB Credentials

1. **Visit AgentDB Dashboard**: https://agentdb.dev
2. **Sign in** to your account
3. **Get your MCP URL**: Copy your MCP endpoint
4. **Get your API Key**: Copy your authentication key
5. **Note your database name**: Default is `listify-agent`

### Step 2: Configure Environment

Update your `.env` file:

```env
# AgentDB Configuration
AGENTDB_MCP_URL=https://mcp.agentdb.dev/your-endpoint
AGENTDB_API_KEY=your-agentdb-api-key-here
AGENTDB_DB_NAME=listify-agent

# OpenAI Configuration (already configured)
OPENAI_API_KEY=your-openai-api-key-here
```

### Step 3: Set Up Database Schema

Run the database setup script:

```bash
cd backend
node setup-database.js
```

**Expected Output:**
```
✅ Database connection successful
✅ Lists table created
✅ List items table created
✅ Indexes created
✅ Database setup complete
```

### Step 4: Verify Integration

Test the AgentDB connection:

```bash
# Test database connection
cd backend
node test-database.js
```

**Expected Output:**
```
✅ AgentDB connection successful
✅ Database queries working
✅ Integration verified
```

## 🔍 How It Works

### MCP Protocol Integration

The application uses the Model Context Protocol (MCP) to communicate with AgentDB:

```javascript
// Example MCP request
const request = {
  jsonrpc: "2.0",
  id: Date.now(),
  method: "tools/call",
  params: {
    name: "execute_sql",
    arguments: {
      statements: [
        {
          sql: "SELECT * FROM lists",
          params: []
        }
      ]
    }
  }
};
```

### Database Operations

**Create List:**
```sql
INSERT INTO lists (list_name, description, created_at, updated_at)
VALUES (?, ?, datetime('now'), datetime('now'))
```

**Insert Items:**
```sql
INSERT INTO list_items (
  list_id, item_name, category, quantity,
  notes, explanation, status, source_type,
  extracted_at, metadata
)
VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'), ?)
```

**Update Item Status:**
```sql
UPDATE list_items 
SET status = ?
WHERE id = ?
```

**Get Statistics:**
```sql
SELECT 
  COUNT(*) as total_lists,
  (SELECT COUNT(*) FROM list_items) as total_items,
  (SELECT COUNT(*) FROM list_items WHERE status = 'completed') as completed_items,
  (SELECT COUNT(*) FROM list_items WHERE status = 'pending') as pending_items
FROM lists
```

## 🧪 Testing Your Setup

### 1. Test Database Connection

```bash
cd backend
node test-database.js
```

### 2. Test API Endpoints

```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Test text analysis
curl -X POST http://localhost:3001/api/analyze-text \
  -H "Content-Type: application/json" \
  -d '{"text": "Buy milk\nCall dentist\nFinish report"}'
```

### 3. Test Frontend Integration

1. Open http://localhost:3000
2. Test text analysis
3. Test image upload
4. Check "My Lists" section
5. Verify data persistence

## 🔧 Troubleshooting

### Common Issues

#### "AGENTDB_API_KEY is not set"
- Check that your `.env` file has the AgentDB credentials
- Verify the credentials are correct (copy from AgentDB dashboard)
- Make sure there are no extra spaces or quotes

#### "Cannot connect to database"
- Verify your AgentDB instance is active
- Check that you created the database schema
- Test your AgentDB connection independently

#### "Database query failed"
- Check your AgentDB API key and token
- Verify the database schema is properly created
- Ensure your AgentDB instance is running

#### "MCP request failed"
- Verify your MCP URL is correct
- Check that your AgentDB instance supports MCP
- Ensure your API key has the necessary permissions

### Debug Mode

Enable debug logging to see detailed MCP requests:

```bash
# Enable debug logging
DEBUG=* npm run backend:dev
```

**Debug output shows:**
- MCP request/response details
- Database query execution
- Error messages and stack traces
- API call timing

### Manual Testing

Test your AgentDB connection manually:

```bash
# Test database connection
cd backend
node -e "
import { agentdbConfig } from './src/config/agentdb.js';
console.log('AgentDB Config:', agentdbConfig);
"
```

## 📊 Performance Considerations

### Database Optimization

1. **Indexes**: Ensure proper indexes are created
2. **Query Optimization**: Use efficient SQL queries
3. **Connection Pooling**: Manage database connections
4. **Caching**: Implement caching for frequently accessed data

### MCP Protocol

1. **Request Batching**: Batch multiple operations
2. **Error Handling**: Implement retry logic
3. **Timeout Management**: Set appropriate timeouts
4. **Connection Management**: Reuse connections when possible

## 🔒 Security Considerations

### API Key Management

1. **Environment Variables**: Never commit API keys
2. **Key Rotation**: Rotate keys regularly
3. **Access Control**: Limit key permissions
4. **Monitoring**: Track API key usage

### Database Security

1. **Input Validation**: Validate all inputs
2. **SQL Injection Prevention**: Use parameterized queries
3. **Access Control**: Limit database access
4. **Audit Logging**: Log all database operations

## 🚀 Production Deployment

### Environment Configuration

**Production `.env`:**
```env
NODE_ENV=production
AGENTDB_MCP_URL=https://mcp.agentdb.dev/your-production-endpoint
AGENTDB_API_KEY=your-production-api-key
AGENTDB_DB_NAME=listify-agent-prod
```

### Monitoring

1. **Database Performance**: Monitor query execution times
2. **API Usage**: Track AgentDB API calls
3. **Error Rates**: Monitor error frequencies
4. **Resource Usage**: Track memory and CPU usage

### Backup Strategy

1. **Regular Backups**: Set up automated backups
2. **Data Recovery**: Test recovery procedures
3. **Disaster Recovery**: Plan for service outages
4. **Data Migration**: Prepare for schema changes

## 📚 Additional Resources

### AgentDB Documentation
- [AgentDB Official Docs](https://agentdb.dev/docs)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [Database Schema Reference](https://agentdb.dev/docs/schema)

### Troubleshooting Guides
- [Common Issues](https://agentdb.dev/docs/troubleshooting)
- [API Reference](https://agentdb.dev/docs/api)
- [Support Forum](https://agentdb.dev/community)

## 🎉 Success Indicators

Your AgentDB integration is working correctly when:

- ✅ Database connection is successful
- ✅ Lists are created and persisted
- ✅ Items are saved to the database
- ✅ Status updates are working
- ✅ Statistics are accurate
- ✅ Data persists across server restarts

## 🆘 Getting Help

If you run into issues:

1. **Check the logs** in your terminal
2. **Verify your credentials** in the `.env` file
3. **Test your AgentDB connection** independently
4. **Review the error messages** for specific issues
5. **Check the main README.md** for detailed documentation

Your Listify Agent with AgentDB integration is now ready to use! 🚀