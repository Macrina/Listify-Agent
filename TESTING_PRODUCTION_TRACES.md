# Testing Production Traces in Arize

This guide explains how to test traces in your production (or local) environment and verify they appear in Arize.

## Prerequisites

1. **Arize Account Setup**: Make sure you have:
   - `ARIZE_SPACE_ID` configured in your environment
   - `ARIZE_API_KEY` configured in your environment
   - `ARIZE_PROJECT_NAME` set (default: "listify-agent")

2. **Backend Running**: The backend server must be running with Arize tracing initialized

## Method 1: Real API Test (Recommended)

This method makes actual API calls to your backend, generating real traces.

### Running the Test

```bash
# Test against local backend (default: http://localhost:3001)
node test_production_traces_real.js

# Test against production backend
BACKEND_URL=https://your-production-url.com node test_production_traces_real.js
```

### What It Tests

The test script will:
1. ✅ Check backend health
2. 📸 Analyze a test image (image analysis trace)
3. 📝 Analyze sample text (text analysis trace)
4. 🔗 Analyze a link (link analysis trace)
5. 📋 Get existing lists

### Expected Traces in Arize

After running the test, you should see these traces in your Arize dashboard:

- `listify-agent.image-analysis` - Image analysis operation
- `openai.vision.completion` - OpenAI Vision API call
- `listify-agent.text-analysis` - Text analysis operation
- `listify-agent.link-analysis` - Link analysis operation
- `openai.text.completion` - OpenAI text completion

## Method 2: Synthetic Trace Test

This method creates synthetic traces without making real API calls.

```bash
node test_production_traces.js
```

## Method 3: Manual Testing

You can also test manually by:

1. **Starting your backend**:
   ```bash
   cd backend && npm start
   ```

2. **Making API calls** using curl or the frontend:
   ```bash
   # Health check
   curl http://localhost:3001/api/health
   
   # Image analysis (with an image file)
   curl -X POST http://localhost:3001/api/lists/analyze-image \
     -F "image=@test-image.png"
   
   # Text analysis
   curl -X POST http://localhost:3001/api/lists/analyze-text \
     -H "Content-Type: application/json" \
     -d '{"text": "Shopping: Milk, Bread, Eggs"}'
   ```

3. **Check Arize Dashboard** for the traces

## Viewing Traces in Arize

1. Go to your Arize dashboard: https://app.arize.com
2. Select your project: "listify-agent"
3. Navigate to **Traces** tab
4. Look for traces with:
   - Service name: `listify-agent`
   - Span names: `listify-agent.*`, `openai.*`
   - Recent timestamp (last 5-10 minutes)

## Debugging

If traces are not appearing:

1. **Check environment variables**:
   ```bash
   echo $ARIZE_SPACE_ID
   echo $ARIZE_API_KEY
   ```

2. **Check backend logs** for initialization:
   ```
   ✅ Arize tracing initialized successfully
   📊 Project: listify-agent
   ```

3. **Check for errors** in backend logs:
   ```
   ❌ Failed to initialize Arize tracing
   ```

4. **Verify network connectivity** to Arize endpoints:
   ```bash
   curl https://otlp.arize.com/v1/traces
   ```

## Test Script Features

The `test_production_traces_real.js` script:

- ✅ Makes real API calls to your backend
- ✅ Tests all major endpoints (image, text, link analysis)
- ✅ Provides detailed output for each test
- ✅ Shows summary of results
- ✅ Indicates which traces were sent to Arize
- ✅ Handles errors gracefully

## Environment Setup

For production deployment on Render:

Ensure these environment variables are set in your Render dashboard:
- `ARIZE_SPACE_ID` (sync: false)
- `ARIZE_API_KEY` (sync: false)
- `ARIZE_PROJECT_NAME` = "listify-agent"
- `ARIZE_ENDPOINT` = "https://otlp.arize.com/v1/traces"

## Troubleshooting

### Traces not appearing in Arize

1. **Check credentials**: Verify `ARIZE_SPACE_ID` and `ARIZE_API_KEY` are correct
2. **Check project name**: Ensure `ARIZE_PROJECT_NAME` matches in all places
3. **Wait a few minutes**: Traces can take 1-2 minutes to appear
4. **Check time range**: Look at "Last 15 minutes" or longer in Arize dashboard

### Backend not starting

1. **Check Node.js version**: Should be Node 18+
2. **Check dependencies**: Run `npm install` in backend directory
3. **Check port**: Default is 3001, ensure port is available

### API calls failing

1. **Check backend is running**: `curl http://localhost:3001/api/health`
2. **Check OPENAI_API_KEY**: Required for image/text analysis
3. **Check test image**: `test-image.png` should exist in project root

## Next Steps

Once traces are working:

1. **Monitor production traces** in Arize dashboard
2. **Set up alerts** for trace errors
3. **Analyze performance** using trace durations
4. **Debug issues** using trace context and metadata

## Additional Resources

- Arize Documentation: https://docs.arize.com
- OpenTelemetry: https://opentelemetry.io
- Listify Agent Repo: [link to repo]

