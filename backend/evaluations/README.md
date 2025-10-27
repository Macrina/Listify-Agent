# Arize Evaluation Framework - Python Components

This directory contains Python components for advanced LLM-as-judge evaluations using OpenAI's GPT models to assess response quality.

## Installation

```bash
pip install -r requirements.txt
```

## Components

### 1. LLM-as-Judge Evaluators (`llm_judge_evaluators.py`)

Advanced evaluation functions using GPT models to assess:
- Tone appropriateness
- Response correctness
- Tool calling accuracy
- Hallucination detection

### 2. Cost Monitoring (`cost_monitor.py`)

Track and analyze:
- Token usage per request
- Cost per interaction type
- Daily/monthly spend
- Cost optimization recommendations

### 3. Performance Analytics (`performance_analytics.py`)

Monitor:
- Response latency (P50, P95, P99)
- Throughput metrics
- Error rates
- Performance trends

## Usage

### Basic Evaluation

```python
from llm_judge_evaluators import evaluate_tone, detect_hallucinations

# Tone evaluation using LLM-as-judge
tone_score = evaluate_tone(
    user_query="Help me fix this error",
    agent_response="I'll help you troubleshoot this issue step by step..."
)

# Hallucination detection
hallucination_result = detect_hallucinations(
    response="Edit categories.config.js and run npm run update-categories",
    codebase_files=["src/services/imageAnalysisService.js", "src/config/openai.js"]
)
```

### Cost Monitoring

```python
from cost_monitor import CostMonitor

monitor = CostMonitor()

# Track token usage
cost_data = monitor.track_request(
    model="gpt-4o",
    prompt_tokens=150,
    completion_tokens=75,
    request_type="image_analysis"
)

# Get cost summary
summary = monitor.get_cost_summary(days=7)
```

### Performance Analytics

```python
from performance_analytics import PerformanceAnalytics

analytics = PerformanceAnalytics()

# Track response time
analytics.track_response_time(
    interaction_type="image_analysis",
    response_time=2.5,
    success=True
)

# Get performance metrics
metrics = analytics.get_performance_metrics(hours=24)
```

## Integration with Node.js

The Python components are designed to work alongside the Node.js evaluation framework:

1. **Node.js** handles real-time evaluations and basic scoring
2. **Python** provides advanced LLM-as-judge evaluations for complex cases
3. **Arize** aggregates all data for comprehensive monitoring

## Configuration

Set environment variables:

```bash
export OPENAI_API_KEY="your_openai_api_key"
export ARIZE_SPACE_ID="your_arize_space_id"
export ARIZE_API_KEY="your_arize_api_key"
```

## Evaluation Criteria

### Tone Appropriateness (1-5 scale)

**Score 5 (Excellent):**
- Professional, helpful, and empathetic tone
- Clear explanations with appropriate detail level
- Constructive error messages with solutions

**Score 4 (Good):**
- Professional tone with minor inconsistencies
- Generally helpful with occasional unclear parts
- Good error handling with basic solutions

**Score 3 (Average):**
- Professional but sometimes impersonal
- Adequate explanations but could be clearer
- Basic error messages without detailed solutions

**Score 2 (Poor):**
- Inconsistent tone, sometimes unprofessional
- Unclear or confusing explanations
- Poor error handling without helpful guidance

**Score 1 (Very Poor):**
- Unprofessional or inappropriate tone
- Confusing or incorrect explanations
- No helpful error handling

### Hallucination Detection

**Common Hallucination Patterns:**
- Non-existent file paths (`categories.config.js`)
- Invalid npm commands (`npm run update-categories`)
- Fictional API endpoints
- Made-up configuration files
- Incorrect technical specifications

**Detection Methods:**
- File path validation against actual codebase
- Command validation against available scripts
- API endpoint validation against actual routes
- Technical specification verification

## Dashboard Integration

### Arize Dashboard Metrics

1. **Quality Metrics**
   - Average tone score (target: > 4.0)
   - Average correctness score (target: > 4.0)
   - Hallucination rate (target: < 5%)
   - Tool accuracy score (target: > 4.0)

2. **Performance Metrics**
   - P95 latency (target: < 7s)
   - Tokens per second
   - Error rate
   - Response time distribution

3. **Cost Metrics**
   - Cost per request type
   - Daily/monthly spend
   - Cost by feature
   - Token usage trends

### Alert Configuration

```yaml
quality_alerts:
  high_hallucination_rate:
    condition: "hallucination_rate > 5%"
    window: "1 hour"
    action: "slack_notification"
  
  poor_quality:
    condition: "avg_correctness < 3.5"
    window: "1 hour"
    action: "email_alert"

performance_alerts:
  high_latency:
    condition: "p95_latency > 10s"
    window: "5 minutes"
    action: "slack_notification"

cost_alerts:
  cost_spike:
    condition: "hourly_cost > $5"
    window: "1 hour"
    action: "email_alert"
```

## Production Monitoring

### Real-Time Monitoring

Monitor these metrics in production:

1. **Quality Metrics**
   - Response quality scores
   - Hallucination detection rate
   - User satisfaction indicators

2. **Performance Metrics**
   - Response latency
   - Throughput
   - Error rates

3. **Cost Metrics**
   - Token usage
   - API costs
   - Cost per successful request

### Continuous Improvement

Use evaluation data to:

1. **Identify Problem Patterns**
   - Common hallucination triggers
   - Low-quality response patterns
   - Performance bottlenecks

2. **A/B Test Improvements**
   - Prompt modifications
   - Tool selection changes
   - Response format updates

3. **Track Improvement Over Time**
   - Quality score trends
   - Cost optimization results
   - User satisfaction improvements

## Troubleshooting

### Common Issues

1. **High Hallucination Rate**
   - Check codebase file lists
   - Verify command validation
   - Review API endpoint lists

2. **Poor Tone Scores**
   - Analyze response patterns
   - Check for unprofessional language
   - Review empathy indicators

3. **High Costs**
   - Monitor token usage
   - Optimize prompts
   - Review model selection

### Debug Mode

Enable debug logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Next Steps

1. **Deploy Python Components**
   - Set up Python environment
   - Configure API keys
   - Test evaluation functions

2. **Integrate with Node.js**
   - Connect Python evaluators
   - Set up data flow
   - Test end-to-end evaluation

3. **Configure Arize Dashboard**
   - Create custom metrics
   - Set up alerts
   - Configure dashboards

4. **Monitor and Improve**
   - Track evaluation results
   - Analyze quality trends
   - Optimize based on findings
