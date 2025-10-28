# Preventing Automatic /v1/traces Path in OpenTelemetry

## The Issue

The OpenTelemetry gRPC exporter **automatically appends `/v1/traces`** to the endpoint URL. This is built into the exporter and **cannot be disabled**.

## Why This Happens

The gRPC exporter follows the OTLP specification which defines:
- gRPC endpoint: `base_url/v1/traces` (automatic)
- HTTP endpoint: `base_url/v1/traces` (manual)

## Solutions

### Option 1: Use HTTP OTLP Exporter (Recommended)

Switch to HTTP exporter for full path control:

```javascript
// In backend/src/config/arize.js
import { OTLPTraceExporter as HttpOTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const httpExporter = new HttpOTLPTraceExporter({
  url: `${ARIZE_CONFIG.endpoint}/v1/traces`, // You control the full path
  headers: {
    'space_id': ARIZE_CONFIG.spaceId,
    'api_key': ARIZE_CONFIG.apiKey,
  },
});
```

**Pros:**
- Full control over the endpoint path
- Can use custom paths like `/custom/traces`
- More flexible configuration

**Cons:**
- Slightly less efficient than gRPC
- Different authentication method (headers vs metadata)

### Option 2: Accept gRPC Behavior (Current)

Keep using gRPC but understand the behavior:

```javascript
// Current configuration - this is correct
const arizeExporter = new GrpcOTLPTraceExporter({
  url: 'https://otlp.arize.com', // Base URL only
  metadata,
});
// Exporter automatically makes requests to: https://otlp.arize.com/v1/traces
```

**Pros:**
- More efficient (gRPC is faster)
- Standard OTLP behavior
- Works with most collectors

**Cons:**
- Cannot customize the path
- Must use base URL only

### Option 3: Environment-Based Selection

Switch between exporters based on environment:

```javascript
// Add to .env
ARIZE_USE_HTTP_EXPORTER=true

// In your config
const useHttp = process.env.ARIZE_USE_HTTP_EXPORTER === 'true';
const exporter = useHttp ? httpExporter : grpcExporter;
```

## Implementation

### To Use HTTP Exporter

1. **Update package.json** (if not already installed):
   ```bash
   npm install @opentelemetry/exporter-trace-otlp-http
   ```

2. **Modify arize.js**:
   ```javascript
   import { OTLPTraceExporter as HttpOTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
   
   const httpExporter = new HttpOTLPTraceExporter({
     url: `${ARIZE_CONFIG.endpoint}/v1/traces`,
     headers: {
       'space_id': ARIZE_CONFIG.spaceId,
       'api_key': ARIZE_CONFIG.apiKey,
     },
   });
   ```

3. **Update render.yaml**:
   ```yaml
   - key: ARIZE_ENDPOINT
     value: https://otlp.arize.com
   - key: ARIZE_USE_HTTP_EXPORTER
     value: true
   ```

### To Keep gRPC (Current Setup)

Your current configuration is correct:

```javascript
// This is the right way to use gRPC exporter
const arizeExporter = new GrpcOTLPTraceExporter({
  url: 'https://otlp.arize.com', // Base URL only
  metadata,
});
```

## Recommendation

**Keep the current gRPC setup** because:

1. ✅ It's working correctly
2. ✅ More efficient than HTTP
3. ✅ Standard OTLP behavior
4. ✅ Arize supports gRPC properly

The automatic `/v1/traces` path is **not a bug** - it's the correct OTLP specification behavior.

## Alternative Configurations

See `backend/src/config/arize-alternative.js` for:
- HTTP exporter implementation
- Custom gRPC configuration
- Environment-based exporter selection

## Testing

Run the diagnostic to verify your current setup:

```bash
node diagnose_arize_tracing.js
```

This will confirm that traces are being sent to the correct endpoint.

