# Arize Evaluation Framework

## Overview

The Listify Agent implements a comprehensive evaluation framework using Arize AI for monitoring LLM response quality, detecting hallucinations, and tracking performance metrics.

## Evaluation Criteria

### 1. Tone Appropriateness (1-5 Scale)
- **Professional Communication**: Clear, helpful responses
- **Empathetic Error Handling**: User-friendly error messages
- **Consistent Style**: Maintains appropriate tone throughout

### 2. Tool Calling Accuracy (1-5 Scale)
- **Correct Tool Selection**: Appropriate tools for the task
- **Efficient Usage**: Minimal, effective tool calls
- **Safety Checks**: No dangerous operations

### 3. Response Correctness (1-5 Scale)
- **Factual Accuracy**: Correct information provided
- **Completeness**: Addresses all aspects of the query
- **Actionable Instructions**: Clear, implementable guidance

### 4. Hallucination Detection (Binary)
- **File Validation**: Detects non-existent files
- **Command Validation**: Identifies invalid npm commands
- **Feature Validation**: Spots fictional features

### 5. Performance Metrics
- **Latency**: P50, P95, P99 response times
- **Token Usage**: Prompt, completion, and total tokens
- **Cost Tracking**: Cost per request and daily spend

## Implementation

### Node.js Evaluator
```javascript
import ArizeEvaluator from './src/evaluations/arizeEvaluator.js';

const evaluator = new ArizeEvaluator();

// Evaluate tone
const toneResult = await evaluator.evaluateTone(userQuery, agentResponse);

// Evaluate correctness
const correctnessResult = await evaluator.evaluateCorrectness(userQuery, agentResponse, context);

// Detect hallucinations
const hallucinationResult = await evaluator.detectHallucinations(agentResponse, context);
```

### Python LLM-as-Judge
```python
from llm_judge_evaluators import evaluate_tone, evaluate_correctness, check_file_hallucinations

# Evaluate tone using LLM
tone_result = evaluate_tone(user_query, agent_response)

# Evaluate correctness using LLM
correctness_result = evaluate_correctness(user_query, agent_response, context)

# Check for hallucinations
hallucination_result = check_file_hallucinations(response, codebase_files)
```

## Evaluation Service

### Integration
```javascript
import ArizeEvaluationService from './src/evaluations/arizeEvaluationService.js';

const evaluationService = new ArizeEvaluationService();

// Evaluate image analysis
const evaluation = await evaluationService.evaluateImageAnalysis({
  userQuery: 'Analyze this image',
  agentResponse: 'Found 5 items',
  extractedItems: items,
  processingTime: 2500
});

// Log to Arize
await evaluationService.logEvaluationToArize(evaluation, 'image_analysis');
```

## Dashboard Metrics

### Quality Metrics
- **Average Tone Score**: Target > 4.0
- **Average Correctness**: Target > 4.0
- **Hallucination Rate**: Target < 5%

### Performance Metrics
- **P95 Latency**: Target < 7s
- **Tokens per Second**: Efficiency metric
- **Error Rate**: Reliability metric

### Cost Metrics
- **Cost per Request**: By request type
- **Daily/Monthly Spend**: Budget tracking
- **Cost by Feature**: Feature-specific costs

## Alerts Configuration

### Quality Alerts
```json
{
  "high_hallucination_rate": {
    "condition": "hallucination_rate > 5%",
    "window": "1 hour",
    "action": "slack_notification"
  },
  "poor_quality": {
    "condition": "avg_correctness < 3.5",
    "window": "1 hour",
    "action": "email_alert"
  }
}
```

### Performance Alerts
```json
{
  "high_latency": {
    "condition": "p95_latency > 10s",
    "window": "5 minutes",
    "action": "pagerduty_alert"
  },
  "high_error_rate": {
    "condition": "error_rate > 10%",
    "window": "5 minutes",
    "action": "immediate_alert"
  }
}
```

## Evaluation Examples

### Good Response Example
**Query**: "How do I add a new category?"
**Response**: "To add a new category: 1. Edit backend/src/services/imageAnalysisService.js 2. Find line 42 with the category list 3. Add your category: 'groceries, tasks, fitness, other' 4. Restart the backend"

**Evaluation**:
- **Tone Score**: 5/5 (Clear, helpful)
- **Correctness Score**: 5/5 (Accurate, complete)
- **Hallucinations**: None detected
- **Overall Score**: 5/5

### Bad Response Example
**Query**: "How do I add a new category?"
**Response**: "Edit the categories.config.js file and add your category. Then run: npm run update-categories"

**Evaluation**:
- **Tone Score**: 3/5 (Helpful but unclear)
- **Correctness Score**: 1/5 (Inaccurate, incomplete)
- **Hallucinations**: Detected (non-existent files/commands)
- **Overall Score**: 1/5

## Files Structure

```
backend/src/evaluations/
├── arizeEvaluator.js           # Core evaluation logic
├── arizeEvaluationService.js   # Evaluation orchestration
└── README.md                   # Quick start guide

backend/evaluations/
├── llm_judge_evaluators.py     # Python LLM-as-judge
├── requirements.txt            # Python dependencies
└── README.md                   # Integration guide
```

## Usage

### Quick Start
```bash
# Install Python dependencies
cd backend/evaluations
pip install -r requirements.txt

# Run evaluation tests
python llm_judge_evaluators.py
```

### Integration
```javascript
// In your service
import ArizeEvaluationService from '../evaluations/arizeEvaluationService.js';

const evaluationService = new ArizeEvaluationService();

// Evaluate after processing
const evaluation = await evaluationService.evaluateImageAnalysis(data);
await evaluationService.logEvaluationToArize(evaluation, 'image_analysis');
```

## Monitoring

### Arize Dashboard
- **Project**: listify-agent
- **Service**: listify-agent
- **Spans**: evaluate-* operations
- **Metrics**: All evaluation scores and metrics

### Key Dashboards
1. **Quality Overview**: Overall scores and trends
2. **Hallucination Detection**: Error patterns and fixes
3. **Performance Metrics**: Latency and throughput
4. **Cost Analysis**: Token usage and spending
5. **Alert Management**: Active alerts and resolutions