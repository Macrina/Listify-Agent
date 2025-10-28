# Comprehensive Arize Tracing Debug Guide

This guide provides step-by-step debugging for Arize tracing issues, based on official Arize documentation and MCP tools.

## Quick Debug Commands

### 1. Run Simple Debug Script
```bash
node debug-arize-simple.js
```

### 2. Run Test Traces (Fixed)
```bash
node test_production_traces.js
node test_production_traces_real.js
```

### 3. Run Both Tests
```bash
./test-traces.sh
```

## Environment Variables Check

### Required Variables
```bash
ARIZE_SPACE_ID=your_space_id
ARIZE_API_KEY=your_api_key
ARIZE_PROJECT_NAME=listify-agent
```

### Check Variables
```bash
echo "ARIZE_SPACE_ID: $ARIZE_SPACE_ID"
echo "ARIZE_API_KEY: ${ARIZE_API_KEY:0:10}..."
```

## Network Connectivity Test

### Test Arize Endpoint
```bash
curl -v https://otlp.arize.com/v1/traces
```
Expected: `501 Method Not Allowed` (this is correct for GET requests)

### Test with Credentials
```bash
curl -H "space_id: $ARIZE_SPACE_ID" -H "api_key: $ARIZE_API_KEY" https://otlp.arize.com/v1/traces
```

## Common Issues and Solutions

### Issue 1: Environment Variables Not Loaded
**Problem**: Scripts say "traces sent" but nothing appears in Arize
**Solution**: Fixed permanently - scripts now auto-load `.env` file

### Issue 2: Traces Not Appearing After 22:41
**Problem**: Server restart didn't load environment variables
**Solution**: Restart server with proper environment loading

### Issue 3: Import Errors
**Problem**: `SyntaxError: Named export 'Resource' not found`
**Solution**: Use existing working configuration from backend

## Debug Scripts Created

### 1. `debug-arize-simple.js`
- Uses existing working configuration
- Creates comprehensive test spans
- Includes detailed logging and error handling
- Based on official Arize documentation

### 2. `test_production_traces.js` (Fixed)
- Now auto-loads environment variables
- Creates synthetic traces
- No longer requires `source .env`

### 3. `test_production_traces_real.js` (Fixed)
- Now auto-loads environment variables
- Makes real API calls to backend
- No longer requires `source .env`

### 4. `test-traces.sh`
- Convenience script to run both tests
- Executable with `./test-traces.sh`

## What to Check in Arize Dashboard

### 1. Navigate to LLM Tracing
- Go to your Arize dashboard
- Click on "LLM Tracing" tab

### 2. Check Time Range
- Set time range to "Last 15 minutes" or longer
- Traces can take 1-2 minutes to appear

### 3. Look for These Span Names
- `debug-agent-span`
- `debug-llm-span`
- `debug-tool-span`
- `debug-error-span`
- `listify-agent.image-analysis`
- `listify-agent.text-analysis`
- `listify-agent.link-analysis`

### 4. Check Span Attributes
- Look for `input.value` and `output.value`
- Check `llm.token_count.*` attributes
- Verify `openinference.span.kind` values

## Advanced Debugging

### Enable Debug Logging
```javascript
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
```

### Check Trace Export
```javascript
import { flushTraces } from './backend/src/config/arize.js';
await flushTraces();
```

### Verify Credentials
```javascript
console.log('Space ID:', process.env.ARIZE_SPACE_ID);
console.log('API Key:', process.env.ARIZE_API_KEY ? 'Set' : 'Missing');
```

## Troubleshooting Steps

### Step 1: Verify Environment
```bash
source .env
echo "ARIZE_SPACE_ID: $ARIZE_SPACE_ID"
echo "ARIZE_API_KEY: ${ARIZE_API_KEY:0:10}..."
```

### Step 2: Test Network
```bash
curl -v https://otlp.arize.com/v1/traces
```

### Step 3: Run Debug Script
```bash
node debug-arize-simple.js
```

### Step 4: Check Arize Dashboard
- Wait 2-3 minutes
- Check time range filters
- Look for debug span names

### Step 5: Contact Support
If traces still don't appear:
1. Verify Arize credentials are correct
2. Check if Arize space is active
3. Ensure correct permissions
4. Contact Arize support

## Official Documentation References

### Arize Tracing Docs
- Auto-instrumentation examples
- Manual instrumentation patterns
- Semantic conventions
- Error handling

### MCP Tools Used
- `get_arize_tracing_docs` - Framework-specific examples
- `get_arize_advanced_tracing_docs` - Advanced patterns
- `arize_support` - Support assistance

## Key Fixes Applied

### 1. Permanent Environment Loading
- All test scripts now auto-load `.env` file
- No more manual `source .env` required
- Added `dotenv` package dependency

### 2. Comprehensive Debug Script
- Uses existing working configuration
- Creates multiple span types
- Includes detailed logging
- Based on official documentation

### 3. Convenience Scripts
- `test-traces.sh` for easy testing
- Fixed import issues
- Proper error handling

## Next Steps

1. **Run the debug script**: `node debug-arize-simple.js`
2. **Check Arize dashboard** for new traces
3. **Wait 2-3 minutes** for traces to appear
4. **Verify span attributes** and relationships
5. **Contact support** if issues persist

The debugging setup is now comprehensive and should resolve any tracing issues!
