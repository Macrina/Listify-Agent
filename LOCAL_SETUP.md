# Local Development Setup

This guide covers setting up Listify Agent for local development on your machine.

## 🎯 Prerequisites

### System Requirements
- **Node.js** (v18 or higher)
- **npm** (v8 or higher) or **yarn**
- **Git** for version control
- **Code Editor** (VS Code recommended)

### Required Accounts
- **OpenAI Account** with GPT-4 Vision access
- **AgentDB Account** for database services

## 🚀 Initial Setup

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone <your-repo-url>
cd Listify-Agent

# Check out the correct branch (if applicable)
git checkout main
```

### Step 2: Install Dependencies

```bash
# Install all dependencies (recommended)
npm run install:all

# Or install individually
cd backend && npm install
cd ../frontend && npm install
```

### Step 3: Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit with your credentials
code .env  # or use your preferred editor
```

### Step 4: Database Setup

```bash
# Set up the database schema
cd backend
node setup-database.js
```

Expected output:
```
✅ Database connection successful
✅ Lists table created
✅ List items table created
✅ Indexes created
✅ Database setup complete
```

## 🔧 Development Environment

### Port Configuration

The application uses these ports by default:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

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

# Optional: Debug settings
DEBUG=*
LOG_LEVEL=debug
```

### Development Scripts

```bash
# Start both frontend and backend
npm run dev

# Start services separately
npm run backend:dev    # Backend only
npm run frontend:dev   # Frontend only

# Build for production
npm run build

# Run tests
npm test
```

## 🧪 Testing Your Setup

### 1. Health Check

```bash
# Test backend API
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

### 2. Text Analysis Test

```bash
# Test text analysis
curl -X POST http://localhost:3001/api/analyze-text \
  -H "Content-Type: application/json" \
  -d '{"text": "Buy milk\nCall dentist\nFinish report"}'
```

### 3. Frontend Test

1. Open http://localhost:3000
2. Navigate through all tabs
3. Test text analysis with sample data
4. Test image upload (if you have test images)
5. Check "My Lists" section
6. View statistics

## 🔍 Development Tools

### VS Code Extensions (Recommended)

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-json"
  ]
}
```

### Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/backend/src/server.js",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal"
    }
  ]
}
```

### Git Hooks (Optional)

```bash
# Install husky for git hooks
npm install --save-dev husky

# Set up pre-commit hook
npx husky install
npx husky add .husky/pre-commit "npm run lint"
```

## 🛠️ Development Workflow

### Daily Development

1. **Start the development servers**
   ```bash
   npm run dev
   ```

2. **Make your changes**
   - Edit frontend components in `frontend/src/`
   - Edit backend logic in `backend/src/`
   - Update styles in `frontend/src/styles/`

3. **Test your changes**
   - Frontend changes auto-reload
   - Backend changes require restart
   - Test both text and image analysis

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin your-branch
   ```

### Code Quality

```bash
# Run linting
npm run lint

# Format code
npm run format

# Run tests
npm test

# Check for security vulnerabilities
npm audit
```

## 🐛 Debugging

### Backend Debugging

**Enable debug logging:**
```bash
DEBUG=* npm run backend:dev
```

**Common debug scenarios:**
- API request/response logging
- Database query logging
- OpenAI API call logging
- Error stack traces

### Frontend Debugging

**Browser DevTools:**
- Open DevTools (F12)
- Check Console for errors
- Monitor Network tab for API calls
- Use React DevTools extension

**React DevTools:**
```bash
# Install React DevTools browser extension
# Available for Chrome, Firefox, Safari
```

### Database Debugging

**Check database connection:**
```bash
cd backend
node -e "
import { agentdbConfig } from './src/config/agentdb.js';
console.log('AgentDB Config:', agentdbConfig);
"
```

**Test database queries:**
```bash
cd backend
node test-database.js
```

## 📊 Performance Monitoring

### Development Metrics

**Backend Performance:**
- API response times
- Database query execution
- Memory usage
- Error rates

**Frontend Performance:**
- Component render times
- Bundle size
- Network requests
- User interactions

### Performance Tools

```bash
# Analyze bundle size
npm run build
npm run analyze

# Monitor memory usage
node --inspect backend/src/server.js
```

## 🔒 Security Considerations

### Development Security

1. **Environment Variables**
   - Never commit `.env` files
   - Use `.env.example` as template
   - Rotate API keys regularly

2. **Input Validation**
   - Validate all user inputs
   - Sanitize file uploads
   - Check file types and sizes

3. **API Security**
   - Implement rate limiting
   - Add request validation
   - Monitor for suspicious activity

### Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] API keys are not hardcoded
- [ ] File upload validation is enabled
- [ ] CORS is properly configured
- [ ] Input sanitization is implemented

## 🚀 Deployment Preparation

### Production Build

```bash
# Build for production
npm run build

# Test production build locally
npm run backend:start
```

### Environment Configuration

**Production `.env`:**
```env
NODE_ENV=production
PORT=3001
# ... production settings
```

**Staging `.env`:**
```env
NODE_ENV=staging
PORT=3001
# ... staging settings
```

## 📚 Additional Resources

### Documentation
- [Main README](README.md)
- [Setup Guide](SETUP.md)
- [API Documentation](docs/API.md)
- [Requirements](REQUIREMENTS.md)

### External Resources
- [Node.js Documentation](https://nodejs.org/docs/)
- [React Documentation](https://react.dev/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)
- [AgentDB Documentation](https://agentdb.dev/docs)

### Community
- [GitHub Issues](https://github.com/your-repo/issues)
- [Discord Community](https://discord.gg/your-community)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/listify-agent)

## 🆘 Getting Help

### Common Issues

**Port conflicts:**
```bash
# Check what's using the ports
lsof -i :3000
lsof -i :3001

# Kill processes if needed
kill -9 <PID>
```

**Module not found:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules backend/node_modules frontend/node_modules
npm run install:all
```

**Database connection issues:**
```bash
# Test database connection
cd backend
node test-database.js
```

### Support Channels

1. **Check the logs** in your terminal
2. **Check browser console** (F12 in browser)
3. **Review error messages** - they're usually helpful
4. **Check the main README.md** for detailed documentation
5. **Create an issue** on GitHub if you're stuck

## 🎉 You're Ready to Develop!

Your local development environment is now set up. You can:

1. ✅ Make changes to the code
2. ✅ Test your changes in real-time
3. ✅ Debug issues effectively
4. ✅ Contribute to the project
5. ✅ Deploy when ready

Happy coding! 🚀