# Quick Start: Testing Traces in Production

## ✅ Good News: Your Tracing is Configured Correctly!

The diagnostic tool shows your Arize tracing is working. Here's what to do next:

## Run the Diagnostic Test

```bash
# Run the diagnostic tool
node diagnose_arize_tracing.js
```

This will:
1. ✅ Check your environment variables
2. ✅ Initialize Arize tracing
3. ✅ Create a test span
4. ✅ Send it to Arize

## View Traces in Arize Dashboard

1. Go to https://app.arize.com
2. Login with your Arize account
3. Select project: **listify-agent**
4. Navigate to **"Traces"** tab
5. Set time range to **"Last 15 minutes"**
6. Look for spans with these names:
   - `diagnostic-test-span`
   - `listify-agent.*`
   - `openai.*`

## Run Production Trace Tests

```bash
# Test with real API calls (make sure backend is running first)
node test_production_traces_real.js
```

Or start your backend and make real API calls:

```bash
# Terminal 1: Start backend
cd backend && npm start

# Terminal 2: Run tests
node test_production_traces_real.js
```

## What Was Fixed

### 1. Correct Endpoint
- **Before**: `https://otlp.arize.com/v1/traces` ❌
- **After**: `https://otlp.arize.com` ✅

The gRPC exporter automatically adds `/v1/traces` path.

### 2. Model Version
- Fixed the duplicate "v" in model version string

## Environment Variables

Make sure these are set (they are!):

```bash
ARIZE_SPACE_ID=U3BhY2U6MzA10Dc6NU1udA==
ARIZE_API_KEY=ak-14267f0... (check your .env file)
ARIZE_PROJECT_NAME=listify-agent
```

## Troubleshooting

### Traces Still Not Appearing?

1. **Wait 1-2 minutes** - Traces can take time to appear
2. **Check time range** - Set to "Last 15 minutes" or longer
3. **Check project name** - Must be exactly "listify-agent"
4. **Check credentials** - Verify ARIZE_SPACE_ID and ARIZE_API_KEY are correct

### Backend Not Sending Traces?

1. Check backend logs for: `✅ Arize tracing initialized successfully`
2. Make sure NODE_ENV is set (production or development)
3. Check for errors in backend logs

### API Calls Not Creating Traces?

1. Make sure OPENAI_API_KEY is set
2. Check that the backend is running on the expected port
3. Verify the API endpoints are being called

## Common Span Names to Look For

In your Arize dashboard, you should see:

- **Agent spans**: `listify-agent.image-analysis`, `listify-agent.text-analysis`
- **LLM spans**: `openai.vision.completion`, `openai.text.completion`
- **Tool spans**: Various tool operations

## Next Steps

1. ✅ Run diagnostic: `node diagnose_arize_tracing.js`
2. ✅ Check Arize dashboard for the test span
3. ✅ Run production tests: `node test_production_traces_real.js`
4. ✅ Make real API calls through your frontend
5. ✅ Monitor traces in production

## Need Help?

Check the full guide: `TESTING_PRODUCTION_TRACES.md`

