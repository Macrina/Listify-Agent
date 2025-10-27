# LLM Evaluation Criteria & Examples

This document provides evaluation criteria and examples for assessing LLM agent performance in the Listify Agent application.

---

## 1. Tone Evaluation

**Criterion:** Did the LLM answer in a tone that is correct for the user?

### What to Evaluate:
- Professional yet friendly
- Appropriate formality level
- Clear and concise without being condescending
- Empathetic when dealing with errors
- Enthusiastic but not over-the-top

### Rating Scale:
- **5 (Excellent)**: Perfect tone, matches user context and needs
- **4 (Good)**: Appropriate tone with minor issues
- **3 (Acceptable)**: Tone is okay but could be improved
- **2 (Poor)**: Tone is somewhat inappropriate or off-putting
- **1 (Unacceptable)**: Completely wrong tone

---

### Examples:

#### Scenario 1: User Asks "How do I upload an image?"

**✅ EXCELLENT (5/5) - Correct Tone:**
```
To upload an image in Listify Agent:

1. Click the "Upload Image" tab in the navigation
2. Click "Choose an image" or drag and drop your file
3. You'll see a preview of your image
4. Click "Upload & Analyze" to extract the list items

The AI will analyze your image and extract all visible list items automatically. Try it with a photo of a handwritten grocery list or a screenshot of tasks!
```

**Why it's excellent:**
- Clear, step-by-step instructions
- Friendly and encouraging
- Provides helpful examples
- Not condescending

---

**❌ POOR (2/5) - Wrong Tone:**
```
Just click the upload button. It's pretty obvious where it is. The big button that says "Upload Image" - can't miss it. Then click analyze. Done.
```

**Why it's poor:**
- Condescending ("pretty obvious", "can't miss it")
- Dismissive
- Lacks helpful detail
- Sounds impatient

---

**❌ UNACCEPTABLE (1/5) - Completely Wrong:**
```
Dude, just drag your pic onto the upload thingy and smash that analyze button. EZ PZ! 🔥🔥🔥
```

**Why it's unacceptable:**
- Too casual/unprofessional
- Overly informal language ("dude", "thingy", "smash")
- Excessive emojis
- Not appropriate for a professional tool

---

#### Scenario 2: User Encounters an Error

**✅ EXCELLENT (5/5) - Correct Tone:**
```
I see you're getting an "Invalid API key" error. Let's troubleshoot this together:

1. Check that your .env file has the correct OpenAI API key
2. Make sure the key starts with "sk-proj-" or "sk-"
3. Verify there are no extra spaces before or after the key
4. Restart the backend server after changing .env

If the issue persists, you can verify your key at:
https://platform.openai.com/api-keys

Let me know if you need help with any of these steps!
```

**Why it's excellent:**
- Empathetic opening
- Clear troubleshooting steps
- Provides specific solutions
- Offers continued support
- Helpful resource link

---

**❌ POOR (2/5) - Wrong Tone:**
```
Your API key is wrong. Fix it in the .env file and restart.
```

**Why it's poor:**
- Blunt and unhelpful
- No guidance on how to fix it
- Dismissive tone
- Lacks empathy

---

#### Scenario 3: User Asks "Is this working?"

**✅ GOOD (4/5) - Appropriate Tone:**
```
To verify if Listify Agent is working correctly:

1. Check if both servers are running:
   - Backend: http://localhost:3001/api/health
   - Frontend: http://localhost:3000

2. Test with a simple text analysis:
   - Go to "Analyze Text" tab
   - Paste: "Buy milk\nCall dentist"
   - Click "Analyze Text"

If you see extracted items, it's working! If you encounter errors, let me know what you're seeing and I'll help troubleshoot.
```

**Why it's good:**
- Helpful and constructive
- Provides verification steps
- Offers simple test case
- Invites follow-up questions
- (Minor: Could be slightly more encouraging)

---

## 2. Tool Calling Evaluation

**Criterion:** Did the LLM call the correct tools to respond to a query?

### What to Evaluate:
- Correct tool selection for the task
- Proper tool parameters
- Efficient tool usage (not redundant calls)
- Parallel vs sequential calling when appropriate
- Necessary vs unnecessary tools

### Rating Scale:
- **5 (Excellent)**: Perfect tool selection and usage
- **4 (Good)**: Correct tools with minor inefficiencies
- **3 (Acceptable)**: Gets the job done but could be optimized
- **2 (Poor)**: Wrong tools or very inefficient
- **1 (Unacceptable)**: Completely wrong tool usage or no tools when needed

---

### Examples:

#### Scenario 1: User Says "Show me the code in imageAnalysisService.js"

**✅ EXCELLENT (5/5):**
```
Action: Read tool
File: /home/user/Listify-Agent/backend/src/services/imageAnalysisService.js
```

**Why it's excellent:**
- Used Read tool (correct for viewing file)
- Correct file path
- No unnecessary tools
- Efficient

---

**❌ POOR (2/5):**
```
Action 1: Bash - ls backend/src/services/
Action 2: Bash - cat backend/src/services/imageAnalysisService.js
Action 3: Grep - search for "function" in imageAnalysisService.js
```

**Why it's poor:**
- Should use Read tool, not Bash cat
- Unnecessary ls command
- Unnecessary Grep when Read shows all content
- Inefficient multiple calls

---

#### Scenario 2: User Says "Find all React components"

**✅ EXCELLENT (5/5):**
```
Action: Glob tool
Pattern: frontend/src/components/**/*.jsx
```

**Why it's excellent:**
- Correct tool (Glob for pattern matching)
- Efficient single call
- Correct pattern

---

**❌ POOR (2/5):**
```
Action 1: Bash - find frontend/src/components -name "*.jsx"
Action 2: Read each file found individually
```

**Why it's poor:**
- Should use Glob, not Bash find
- Reading each file when only listing was requested
- Inefficient

---

#### Scenario 3: User Says "Search for the word 'priority' in all backend files"

**✅ EXCELLENT (5/5):**
```
Action: Grep tool
Pattern: priority
Path: backend/
Output mode: files_with_matches
```

**Why it's excellent:**
- Correct tool (Grep for content search)
- Appropriate output mode
- Efficient single call

---

**❌ POOR (2/5):**
```
Action 1: Glob - backend/**/*
Action 2: Read each file
Action 3: Manually search for "priority"
```

**Why it's poor:**
- Should use Grep, not manual search
- Very inefficient
- Wastes time and tokens

---

#### Scenario 4: User Says "Create a new API endpoint and update the documentation"

**✅ EXCELLENT (5/5):**
```
Action 1: Read - backend/src/routes/listRoutes.js (check existing routes)
Action 2: Edit - backend/src/routes/listRoutes.js (add new route)
Action 3: Read - docs/API.md (check documentation structure)
Action 4: Edit - docs/API.md (add new endpoint documentation)
Action 5: Bash - git status (verify changes)
```

**Why it's excellent:**
- Correct tool sequence
- Reads before editing (best practice)
- Updates all necessary files
- Verifies changes

---

**❌ POOR (2/5):**
```
Action 1: Write - backend/src/routes/listRoutes.js (overwrites entire file!)
Action 2: Write - docs/API.md (overwrites entire file!)
```

**Why it's poor:**
- Should use Edit, not Write (will overwrite files)
- Didn't read files first to understand structure
- Destructive operation
- Will lose existing code

---

#### Scenario 5: User Says "Install the missing dependencies"

**✅ EXCELLENT (5/5):**
```
Action 1: Read - package.json (check dependencies)
Action 2: Bash - npm install
```

**Why it's excellent:**
- Checked what's needed first
- Used correct command
- Efficient

---

**❌ POOR (2/5):**
```
Action: Edit - package.json (manually adds dependencies)
```

**Why it's poor:**
- npm install should do this automatically
- Manual editing is error-prone
- Doesn't actually install packages

---

## 3. Correctness Evaluation

**Criterion:** Was the LLM response actually what you would have expected as a user?

### What to Evaluate:
- Accurate information
- Complete answer (not partial)
- Addresses the actual question asked
- No hallucinations or made-up information
- Technically correct implementation
- Follows best practices

### Rating Scale:
- **5 (Excellent)**: Completely correct and comprehensive
- **4 (Good)**: Mostly correct with minor omissions
- **3 (Acceptable)**: Correct but incomplete or unclear
- **2 (Poor)**: Partially incorrect or misleading
- **1 (Unacceptable)**: Completely wrong or harmful

---

### Examples:

#### Scenario 1: User Asks "How do I add a new category?"

**✅ EXCELLENT (5/5):**
```
To add a new category to Listify Agent:

1. Update the backend AI prompt:
   Edit: backend/src/services/imageAnalysisService.js

   Find line 42 where categories are listed:
   category: Choose from: groceries, tasks, contacts, events, inventory, ideas, recipes, shopping, bills, other

   Add your new category, for example:
   category: Choose from: groceries, tasks, contacts, events, inventory, ideas, recipes, shopping, bills, fitness, other

2. The category will now be available for AI to use when analyzing images/text.

3. Optional: Update frontend CSS for the new category color:
   Edit: frontend/src/styles/App.css

   Add styling for your category:
   .category.fitness {
     background-color: #10b981;
   }

That's it! Test by uploading an image with fitness-related items.
```

**Why it's excellent:**
- Accurate file paths
- Specific line numbers
- Complete instructions
- Includes optional enhancement
- Provides test suggestion

---

**❌ POOR (2/5):**
```
Just add the category to the database and it'll work.
```

**Why it's poor:**
- Inaccurate (categories aren't in database, they're in AI prompt)
- No specific instructions
- Won't actually solve the problem
- Misleading

---

**❌ UNACCEPTABLE (1/5):**
```
Edit the categories.config.js file and add your category to the CATEGORIES array.

Then run: npm run update-categories
```

**Why it's unacceptable:**
- Complete hallucination (those files don't exist)
- Will confuse and frustrate user
- Wrong approach entirely

---

#### Scenario 2: User Asks "Why is my API key not working?"

**✅ EXCELLENT (5/5):**
```
Let's troubleshoot your API key issue. Common causes:

1. **API Key Format:**
   - OpenAI keys start with "sk-proj-" or "sk-"
   - Check: Is your key in .env exactly as provided (no quotes needed)?

2. **Environment File:**
   - File location: /project-root/.env (not in backend/ or frontend/)
   - Variable name: OPENAI_API_KEY (exact capitalization)

3. **Server Restart:**
   - .env changes require server restart
   - Stop (Ctrl+C) and restart: npm run dev

4. **Key Status:**
   - Verify key at: https://platform.openai.com/api-keys
   - Check if key is active and has credits

5. **Common Mistakes:**
   - Extra spaces before/after key
   - Using .env.example instead of .env
   - Key in wrong .env file

Try these steps and let me know which one helps!
```

**Why it's excellent:**
- Comprehensive troubleshooting
- Addresses all common issues
- Provides verification steps
- Specific and actionable
- Offers continued support

---

**❌ ACCEPTABLE (3/5):**
```
Check that your API key is correct in the .env file and restart the server.
```

**Why it's just acceptable:**
- Correct information
- But too brief
- Missing specific troubleshooting steps
- No guidance on what "correct" means

---

**❌ POOR (2/5):**
```
Your API key is probably expired. Get a new one from OpenAI.
```

**Why it's poor:**
- Assumes cause without investigation
- API keys don't typically expire
- Doesn't check other common issues
- Premature conclusion

---

#### Scenario 3: User Says "The app crashes when I upload an image"

**✅ EXCELLENT (5/5):**
```
Let's debug the image upload crash. I need more information:

1. **What error message do you see?**
   - Check browser console (F12 → Console tab)
   - Check backend terminal output

2. **Image details:**
   - File size? (must be under 10MB)
   - Format? (JPG, PNG, GIF, WebP supported)

3. **When does it crash?**
   - During upload?
   - During analysis?
   - When displaying results?

Common fixes while we investigate:

**If file too large:**
- Reduce image size or resolution
- Limit set in: backend/src/middleware/upload.js (line 28)

**If OpenAI timeout:**
- Larger images take longer to analyze
- Increase timeout in imageAnalysisService.js

**If out of memory:**
- Close other applications
- Restart the backend

Share the error message and I'll provide specific fix!
```

**Why it's excellent:**
- Asks for diagnostic information
- Provides common solutions
- Specific file references
- Methodical approach
- Ready to help further

---

**❌ POOR (2/5):**
```
Crashes usually mean your OpenAI API key is wrong. Check that.
```

**Why it's poor:**
- Jumps to conclusion
- API key unlikely to cause crash during upload
- Doesn't ask for error details
- Not helpful

---

#### Scenario 4: User Asks "Can I use Claude instead of OpenAI?"

**✅ EXCELLENT (5/5):**
```
Yes! You can use Claude (Anthropic) instead of OpenAI. Here's how:

**1. Install Anthropic SDK:**
```bash
cd backend
npm install @anthropic-ai/sdk
```

**2. Add Claude API key to .env:**
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

**3. Create new config file:**

Create `backend/src/config/anthropic.js`:
```javascript
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default anthropic;
```

**4. Update imageAnalysisService.js:**

Replace OpenAI imports and calls with Claude. Key changes:
- Import: `import anthropic from '../config/anthropic.js'`
- Model: `claude-3-5-sonnet-20241022`
- API structure: Different from OpenAI (provide examples)

Would you like me to create the complete modified imageAnalysisService.js for Claude?
```

**Why it's excellent:**
- Accurate and complete
- Step-by-step instructions
- Provides code examples
- Offers to help further
- Technically correct

---

**❌ POOR (2/5):**
```
No, this app is built for OpenAI only. You'd have to rewrite everything.
```

**Why it's poor:**
- Incorrect (it's definitely possible)
- Discouraging
- Not helpful
- Factually wrong

---

**❌ UNACCEPTABLE (1/5):**
```
Just change the API endpoint to Claude's endpoint and it'll work automatically.
```

**Why it's unacceptable:**
- Completely wrong
- APIs are not interchangeable
- Will cause errors
- Misleading information

---

## Evaluation Summary Template

Use this template to evaluate any LLM response:

```markdown
### Response ID: [unique-id]
**User Query:** [question/request]

**Tone Evaluation:**
- Rating: [1-5]
- Notes: [why this rating]
- Issues: [any problems]

**Tool Calling Evaluation:**
- Rating: [1-5]
- Tools Used: [list of tools]
- Efficiency: [good/poor/excellent]
- Issues: [any problems]

**Correctness Evaluation:**
- Rating: [1-5]
- Accuracy: [accurate/partially/incorrect]
- Completeness: [complete/incomplete]
- Issues: [any problems]

**Overall Rating:** [average of three scores]
**Recommendation:** [approve/request revision/reject]
```

---

## Quick Reference Checklist

### ✅ Good LLM Response Should:
- [ ] Use appropriate professional tone
- [ ] Call correct tools efficiently
- [ ] Provide accurate information
- [ ] Be complete and comprehensive
- [ ] Include examples when helpful
- [ ] Offer follow-up support
- [ ] Cite specific files/lines when relevant
- [ ] Acknowledge limitations when uncertain

### ❌ Avoid:
- [ ] Condescending or dismissive tone
- [ ] Hallucinating files/features that don't exist
- [ ] Using Bash when specialized tools exist
- [ ] Overwriting files with Write instead of Edit
- [ ] Incomplete or partial answers
- [ ] Making assumptions without verification
- [ ] Being overly casual or unprofessional
- [ ] Providing outdated information

---

## Scoring Guidelines

**Overall Quality:**
- **4.5-5.0**: Exceptional, publish immediately
- **3.5-4.4**: Good, minor improvements may help
- **2.5-3.4**: Acceptable, needs revision
- **1.5-2.4**: Poor, significant revision needed
- **1.0-1.4**: Unacceptable, complete rewrite required
