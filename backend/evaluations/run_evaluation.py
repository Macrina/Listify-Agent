#!/usr/bin/env python3
"""
Standalone evaluation runner
Accepts JSON input from stdin and outputs evaluation results to stdout
"""

import sys
import json
from evaluations.listify_evaluators import ListifyEvaluator

def main():
    """Read input from stdin, run evaluations, output to stdout"""
    try:
        # Read input from stdin
        input_data = json.load(sys.stdin)
        
        input_source = input_data.get('input_source', '')
        input_type = input_data.get('input_type', 'text')
        extracted_items = input_data.get('extracted_items', [])
        expected_items = input_data.get('expected_items', None)
        threshold = input_data.get('threshold', 0.7)
        
        # Run evaluations
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

