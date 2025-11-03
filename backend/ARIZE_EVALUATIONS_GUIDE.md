# Viewing LLM Evaluations in Arize

This guide explains how to view evaluation metrics in the Arize dashboard.

## ✅ Implementation Complete

Evaluation metrics are now automatically sent to Arize when:
1. Evaluations are enabled (`ENABLE_EVALUATIONS=true` in `.env`)
2. API requests successfully extract items

## 📊 What You'll See in Arize

### 1. Evaluation Spans

**Span Name:** `listify-agent.evaluation.all_metrics`

**Span Kind:** `EVALUATOR` (OpenInference semantic convention)

**Key Attributes:**
- `evaluator.overall.score` - Overall evaluation score (0.0 to 1.0)
- `evaluator.overall.passed` - Boolean indicating if all evaluations passed
- `evaluator.extraction_accuracy.score` - Item extraction accuracy score
- `evaluator.structure_compliance.score` - Data structure compliance score
- `evaluator.content_quality.score` - Content relevance & quality score
- `evaluator.input_type` - Type of input ('text', 'image', or 'url')
- `evaluator.items_count` - Number of items extracted
- `evaluator.input_preview` - Preview of the input (first 200 chars)

### 2. Trace Hierarchy

Evaluation spans are linked to API request spans:

```
API: POST /api/upload (or /api/analyze-text, /api/analyze-link)
  └── listify-agent.evaluation.all_metrics
      ├── evaluator.overall.score
      ├── evaluator.extraction_accuracy.score
      ├── evaluator.structure_compliance.score
      └── evaluator.content_quality.score
```

### 3. How to Find Evaluation Spans in Arize

1. **Go to Traces View:**
   - Navigate to your Arize dashboard
   - Click on "Traces" or "Observability"

2. **Filter by Span Kind:**
   - Filter: `openinference.span.kind = "EVALUATOR"`
   - Or filter: `evaluator.overall.score exists`

3. **Filter by Span Name:**
   - Filter: `name = "listify-agent.evaluation.all_metrics"`

4. **View Evaluation Metrics:**
   - Click on any evaluation span
   - View attributes panel to see all scores
   - Check span status (OK = passed, ERROR = failed)

## 🔍 Example Queries in Arize

### Find All Evaluation Spans

```
openinference.span.kind = "EVALUATOR"
```

### Find Failed Evaluations

```
openinference.span.kind = "EVALUATOR" AND evaluator.overall.passed = false
```

### Find Low Scoring Evaluations

```
openinference.span.kind = "EVALUATOR" AND evaluator.overall.score < 0.7
```

### Find Evaluations by Input Type

```
evaluator.input_type = "image"
```

### Find Evaluation with Specific Metric Issues

```
evaluator.structure_compliance.score < 0.7
```

## 📈 Creating Dashboards

### Recommended Metrics to Track

1. **Overall Evaluation Score** (Histogram)
   - Metric: `evaluator.overall.score`
   - View distribution of scores over time

2. **Pass Rate** (Count)
   - Metric: `evaluator.overall.passed`
   - Track percentage of evaluations that pass

3. **Individual Metric Scores** (Line Chart)
   - `evaluator.extraction_accuracy.score`
   - `evaluator.structure_compliance.score`
   - `evaluator.content_quality.score`

4. **Evaluation Count by Input Type** (Bar Chart)
   - Group by: `evaluator.input_type`
   - Count: Number of evaluation spans

### Sample Dashboard Query

```sql
SELECT 
  evaluator.overall.score,
  evaluator.extraction_accuracy.score,
  evaluator.structure_compliance.score,
  evaluator.content_quality.score,
  evaluator.input_type,
  timestamp
FROM traces
WHERE openinference.span.kind = "EVALUATOR"
ORDER BY timestamp DESC
```

## 🚀 Enabling Evaluations

### Step 1: Enable in Environment

Add to `backend/.env`:
```bash
ENABLE_EVALUATIONS=true
```

### Step 2: Restart Server

```bash
cd backend
npm start
```

### Step 3: Make API Requests

Evaluation spans will be created automatically for:
- `POST /api/upload` - Image analysis
- `POST /api/analyze-text` - Text analysis
- `POST /api/analyze-link` - URL analysis

### Step 4: Check Arize

1. Wait 2-5 seconds for traces to export
2. Go to Arize dashboard
3. Filter for `openinference.span.kind = "EVALUATOR"`

## 📝 Example Trace View in Arize

When you click on an evaluation span, you'll see:

**Span Details:**
- **Name:** `listify-agent.evaluation.all_metrics`
- **Kind:** `EVALUATOR`
- **Status:** ✅ OK (if passed) or ❌ ERROR (if failed)

**Attributes:**
```
evaluator.overall.score = 0.85
evaluator.overall.passed = true
evaluator.overall.confidence = 0.92
evaluator.extraction_accuracy.score = 0.80
evaluator.structure_compliance.score = 0.77
evaluator.content_quality.score = 0.90
evaluator.input_type = "text"
evaluator.items_count = 4
evaluator.input_preview = "Shopping list: Buy milk, eggs..."
```

## 🔧 Troubleshooting

### Not Seeing Evaluation Spans?

1. **Check Environment Variable:**
   ```bash
   echo $ENABLE_EVALUATIONS
   # Should output: true
   ```

2. **Check Server Logs:**
   Look for: `📊 Evaluation Results (sent to Arize):`

3. **Verify Traces are Flushing:**
   Check for: `✅ Traces flushed after image analysis`

4. **Check Arize Credentials:**
   Ensure `ARIZE_SPACE_ID` and `ARIZE_API_KEY` are set

### Evaluation Spans Not Linked to API Requests?

- Ensure `req.span` is available (from `tracingMiddleware`)
- Check that middleware order is correct in `server.js`

### Python Tracing Not Working?

- Ensure `arize-otel` is installed: `pip install arize-otel`
- Check Python environment has Arize credentials
- Verify `run_evaluation_with_tracing.py` exists

## 💡 Tips

1. **Use Trace Correlation:**
   - Click on API request span
   - View child spans to see evaluation results

2. **Set Up Alerts:**
   - Alert when `evaluator.overall.score < 0.6`
   - Alert when `evaluator.overall.passed = false` for 5+ consecutive requests

3. **Compare Metrics:**
   - Compare evaluation scores across different input types
   - Track which input types have better extraction accuracy

4. **Monitor Trends:**
   - Create time-series charts for evaluation scores
   - Track improvements/degradations over time

## 📚 Related Documentation

- `backend/evaluations/README.md` - Detailed evaluation documentation
- `backend/EVALUATIONS_IMPLEMENTATION.md` - Implementation details
- `OBSERVABILITY_IMPROVEMENTS.md` - Observability improvements guide

