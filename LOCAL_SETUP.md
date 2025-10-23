# Local Setup Instructions

Your Listify Agent is configured and ready! Since the Claude Code environment has network restrictions, you'll need to complete these final steps on your **local machine**.

## ✅ What's Already Done

- ✅ Project structure created
- ✅ All dependencies installed (backend + frontend)
- ✅ Credentials configured in `.env` file
- ✅ Code is ready to run

## 🚀 Final Steps (On Your Local Machine)

### Step 1: Clone/Pull the Repository

If you haven't already, clone or pull the latest changes:

```bash
git clone <your-repo-url>
cd Listify-Agent

# Or if already cloned:
git pull origin claude/ai-model-integration-011CUQjwzZgGYSpyoFbvadrR
```

### Step 2: Set Up AgentDB Database Schema

You need to create the database tables in your AgentDB dashboard.

**Option A: Using the SQL File**

1. Open the file: `backend/schema.sql`
2. Copy the entire SQL content
3. Go to your AgentDB dashboard
4. Navigate to the SQL query interface
5. Paste and execute the SQL

**Option B: Run the Setup Script**

```bash
cd backend
node setup-database.js
```

This will automatically create all tables and indexes.

**Expected Output:**
```
✅ Lists table created!
✅ List_items table created!
✅ Indexes created!
```

### Step 3: Verify Your .env File

Make sure your `.env` file in the project root has your credentials:

```bash
cat .env
```

Should show:
```env
OPENAI_API_KEY=sk-proj-H8yT2XfrPbee...
AGENTDB_API_KEY=agentdb_6b1c89b01d71...
AGENTDB_TOKEN=afa28f11-dc05-4cae-9e4c-4bdad802d4c8
AGENTDB_DB_NAME=listify-agent
```

### Step 4: Install Dependencies (if needed)

If you just cloned fresh, install dependencies:

```bash
npm run install:all
```

Or install separately:
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Step 5: Run the Application

From the project root:

```bash
npm run dev
```

This starts both backend (port 3001) and frontend (port 3000).

**Or run separately:**

Terminal 1 - Backend:
```bash
npm run backend:dev
```

Terminal 2 - Frontend:
```bash
npm run frontend:dev
```

### Step 6: Test the Application

1. **Open your browser**: http://localhost:3000

2. **Test Text Analysis** (easier first test):
   - Click "Analyze Text" tab
   - Paste this sample text:
     ```
     Buy milk
     Call dentist
     Finish project report by Friday
     ```
   - Click "Analyze Text"
   - You should see 3 extracted items!

3. **Test Image Upload**:
   - Click "Upload Image" tab
   - Take a photo of a handwritten list or upload a screenshot
   - Click "Upload & Analyze"
   - Watch the AI extract your list items!

4. **Check Your Lists**:
   - Click "My Lists" tab
   - Expand a list to see items
   - Check off completed items
   - Delete items

5. **View Statistics**:
   - Click "Statistics" tab
   - See your analytics

## 🧪 Troubleshooting

### OpenAI API Issues

If you get OpenAI errors:

```bash
# Test your OpenAI key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_OPENAI_KEY"
```

**Common issues:**
- Key is invalid or expired → Get a new key from https://platform.openai.com/api-keys
- No GPT-4 access → Check your OpenAI account tier
- Billing issues → Add credits to your OpenAI account

### AgentDB Issues

If you get AgentDB errors:

```bash
# Test your AgentDB connection
node backend/test-config.js
```

**Common issues:**
- Wrong credentials → Double-check your AgentDB dashboard
- Database not created → Create the database first
- Schema not set up → Run `backend/schema.sql` in AgentDB

### Port Already in Use

If ports 3000 or 3001 are busy:

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

### Module Not Found Errors

If you get "Cannot find module" errors:

```bash
# Reinstall dependencies
rm -rf node_modules backend/node_modules frontend/node_modules
npm run install:all
```

## 📊 Expected Behavior

### When You Upload an Image:

1. Image is analyzed by GPT-4 Vision
2. AI extracts list items with:
   - Item name
   - Category (auto-detected)
   - Quantity (if visible)
   - Priority (estimated)
   - Notes (additional context)
3. Items are saved to AgentDB
4. Results are displayed immediately

### When You Analyze Text:

1. Text is parsed by GPT-4
2. List items are extracted and structured
3. Same categorization as images
4. Items saved to database

### Database Structure:

**lists table:**
- Stores metadata about each list
- Tracks source type (image/text)
- Counts items

**list_items table:**
- Stores individual items
- Links to parent list
- Tracks completion status
- Includes all item details

## 🎯 Next Steps After Setup

Once everything is working:

1. **Test with Real Data**:
   - Upload your grocery lists
   - Take photos of handwritten notes
   - Paste meeting notes

2. **Explore Features**:
   - Search across all lists
   - Mark items as complete
   - View statistics
   - Delete old items

3. **Customize**:
   - Modify categories (backend/src/services/imageAnalysisService.js)
   - Adjust AI prompts for better extraction
   - Add new features

4. **Deploy** (when ready):
   - See README.md for production deployment
   - Consider hosting on Vercel, Railway, or Heroku

## 📝 Quick Reference

### Start Development
```bash
npm run dev
```

### Start Production
```bash
npm run build
npm run backend:start
```

### Run Tests
```bash
node backend/test-config.js
```

### Setup Database
```bash
node backend/setup-database.js
```

### View Logs
Backend logs show:
- API requests
- OpenAI API calls
- Database queries
- Errors

## 🆘 Getting Help

If you run into issues:

1. **Check the logs** in your terminal
2. **Check browser console** (F12 in browser)
3. **Review error messages** - they're usually helpful
4. **Check the main README.md** for detailed documentation
5. **Review docs/API.md** for API documentation

## 🎉 You're All Set!

Your Listify Agent is ready to go. Just need to:

1. ✅ Pull the code to your local machine
2. ✅ Run the database setup
3. ✅ Start the application with `npm run dev`
4. ✅ Open http://localhost:3000

Enjoy your AI-powered list extraction tool! 🚀
