#!/usr/bin/env python3
"""
Standalone evaluation runner with Arize tracing
Accepts JSON input from stdin and outputs evaluation results to stdout
Also sends evaluation spans to Arize
"""

import sys
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Arize tracing if available
try:
    from arize.otel import register
    from opentelemetry import trace
    
    # Register Arize if credentials are available
    if os.getenv('ARIZE_SPACE_ID') and os.getenv('ARIZE_API_KEY'):
        tracer_provider = register(
            space_id=os.getenv('ARIZE_SPACE_ID'),
            api_key=os.getenv('ARIZE_API_KEY'),
            project_name=os.getenv('ARIZE_PROJECT_NAME', 'listify-agent')
        )
        print("✅ Arize tracing initialized", file=sys.stderr)
    else:
        print("⚠️  Arize credentials not found, tracing disabled", file=sys.stderr)
        tracer_provider = None
except ImportError:
    print("⚠️  Arize tracing not available", file=sys.stderr)
    tracer_provider = None

def main():
    """Read input from stdin, run evaluations with tracing, output to stdout"""
    try:
        # Read input from stdin
        input_data = json.load(sys.stdin)
        
        input_source = input_data.get('input_source', '')
        input_type = input_data.get('input_type', 'text')
        extracted_items = input_data.get('extracted_items', [])
        expected_items = input_data.get('expected_items', None)
        threshold = input_data.get('threshold', 0.7)
        
        # Use tracing-enabled evaluator if available
        if tracer_provider:
            from evaluations.listify_evaluators_with_tracing import ListifyEvaluatorWithTracing
            evaluator = ListifyEvaluatorWithTracing(threshold=threshold)
            results = evaluator.evaluate_all(
                input_source,
                input_type,
                extracted_items,
                expected_items
            )
        else:
            # Fallback to non-tracing evaluator
            from evaluations.listify_evaluators import ListifyEvaluator
            evaluator = ListifyEvaluator(threshold=threshold)
            results = evaluator.evaluate_all(
                input_source,
                input_type,
                extracted_items,
                expected_items
            )
        
        # Convert results to JSON-serializable format
        output = {}
        for key, result in results.items():
            output[key] = {
                'score': result.score,
                'passed': result.passed,
                'confidence': result.confidence,
                'explanation': result.explanation,
                'details': result.details
            }
        
        # Flush traces if using tracing
        if tracer_provider:
            tracer_provider.force_flush()
        
        # Output to stdout
        print(json.dumps(output, indent=2))
        
    except Exception as e:
        # Output error as JSON
        error_output = {
            'error': str(e),
            'type': type(e).__name__
        }
        print(json.dumps(error_output))
        sys.exit(1)

if __name__ == '__main__':
    main()

