# Listify Agent LLM Evaluations

This directory contains LLM evaluation metrics for the Listify Agent, implementing three core evaluation criteria:

1. **Item Extraction Accuracy** - Did the LLM correctly identify and extract all relevant list items?
2. **Data Structure Compliance** - Did the LLM return items in the exact JSON format required?
3. **Content Relevance & Quality** - Are extracted items useful, relevant, with meaningful explanations?

## Files

- `listify_evaluators.py` - Core evaluation classes and functions
- `run_evaluation.py` - Standalone evaluation runner (for Node.js integration)
- `requirements.txt` - Python dependencies for evaluations

## Installation

```bash
cd backend
pip install -r evaluations/requirements.txt
```

Or install directly:
```bash
pip install openai python-dotenv
```

## Usage

### Python API

```python
from evaluations.listify_evaluators import (
    ListifyEvaluator,
    evaluate_extraction_accuracy,
    evaluate_structure_compliance,
    evaluate_content_quality,
    evaluate_all_metrics
)

# Initialize evaluator
evaluator = ListifyEvaluator(threshold=0.7)

# Example extracted items
items = [
    {
        "item_name": "Buy milk",
        "category": "groceries",
        "quantity": "2 gallons",
        "notes": "Organic preferred",
        "explanation": "Essential dairy product"
    }
]

# Evaluate all metrics
results = evaluator.evaluate_all(
    input_source="Shopping list: Buy milk (2 gallons)",
    input_type="text",
    extracted_items=items,
    expected_items=["milk"]  # Optional
)

# Access results
print(f"Overall Score: {results['overall'].score:.2f}")
print(f"Extraction Accuracy: {results['extraction_accuracy'].score:.2f}")
print(f"Structure Compliance: {results['structure_compliance'].score:.2f}")
print(f"Content Quality: {results['content_quality'].score:.2f}")
```

### Individual Metrics

```python
# Metric 1: Extraction Accuracy
accuracy_result = evaluate_extraction_accuracy(
    input_source="Shopping list: Buy milk, eggs",
    input_type="text",
    extracted_items=items,
    expected_items=["milk", "eggs"]
)

# Metric 2: Structure Compliance
structure_result = evaluate_structure_compliance(items)

# Metric 3: Content Quality
quality_result = evaluate_content_quality(
    input_source="Shopping list: Buy milk",
    input_type="text",
    extracted_items=items
)
```

### Command Line

```bash
# Run comprehensive evaluation tests
python3 run_listify_evaluations.py

# Run unit tests
pytest test_listify_evaluations.py -v

# Run integration tests
python3 test_listify_integration.py
```

### Node.js Integration (Optional)

Enable evaluations in API responses by setting environment variable:

```bash
export ENABLE_EVALUATIONS=true
```

Then evaluations will run asynchronously after each successful extraction (doesn't block API responses).

## Evaluation Metrics

### 1. Item Extraction Accuracy (Weight: 40%)

**What it measures:**
- Completeness: Are all items extracted?
- Correctness: Are item names accurate?
- Categorization: Are categories appropriate?
- False Positives: Are there items not in the input?

**Score Range:** 0.0 to 1.0  
**Threshold:** 0.7 (default)

### 2. Data Structure Compliance (Weight: 30%)

**What it measures:**
- Required fields: All items have `item_name` and `category`?
- Field types: Correct data types (strings, nulls)?
- Valid categories: Only uses allowed categories (groceries, tasks, contacts, events, inventory, ideas, recipes, shopping, bills, other)?
- JSON structure: Valid JSON format?

**Score Range:** 0.0 to 1.0  
**Threshold:** 0.7 (default)

**Valid Categories:**
- groceries
- tasks
- contacts
- events
- inventory
- ideas
- recipes
- shopping
- bills
- other

### 3. Content Relevance & Quality (Weight: 30%)

**What it measures:**
- Relevance: Do items match the input?
- Usefulness: Would a user find these actionable?
- Explanation Quality: Are explanations helpful (1-2 sentences, contextual)?
- Categorization Accuracy: Do categories match item purpose?
- Item Name Quality: Are names descriptive enough?

**Score Range:** 0.0 to 1.0  
**Threshold:** 0.7 (default)

### Overall Score

Weighted average of all three metrics:
```
Overall = (Extraction Accuracy × 0.4) + (Structure Compliance × 0.3) + (Content Quality × 0.3)
```

## Evaluation Result Structure

```python
@dataclass
class EvaluationResult:
    score: float          # 0.0 to 1.0
    passed: bool          # True if score >= threshold
    confidence: float     # 0.0 to 1.0
    explanation: str      # Detailed explanation
    details: Dict         # Additional metrics and analysis
```

## Examples

### Perfect Extraction Example

```python
items = [
    {
        "item_name": "Buy 2 gallons of organic milk",
        "category": "groceries",
        "quantity": "2 gallons",
        "notes": "Organic preferred",
        "explanation": "Organic dairy product for better nutrition"
    }
]

result = evaluate_all_metrics(
    "Shopping list: Buy 2 gallons of organic milk",
    "text",
    items
)
# Expected: Overall score >= 0.9
```

### Poor Structure Example

```python
items = [
    {"category": "groceries"},  # Missing item_name
    {"item_name": "milk", "category": "invalid"}  # Invalid category
]

result = evaluate_structure_compliance(items)
# Expected: Score < 0.5, identifies missing fields and invalid categories
```

## Integration with CI/CD

Add to your CI/CD pipeline:

```yaml
# .github/workflows/evaluations.yml
name: LLM Evaluations

on: [push, pull_request]

jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.12'
      - run: pip install -r backend/evaluations/requirements.txt
      - run: python3 backend/run_listify_evaluations.py
```

## Debugging

Enable debug logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Dependencies

- `openai` - For LLM-as-judge evaluation
- `python-dotenv` - For environment variable loading
- `pytest` - For unit testing (optional)

## Environment Variables

- `OPENAI_API_KEY` - Required for LLM-as-judge evaluations

