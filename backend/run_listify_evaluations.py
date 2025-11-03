#!/usr/bin/env python3
"""
Run Listify Agent LLM Evaluations
Main script to execute all evaluation tests
"""

import sys
import os
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv
from evaluations.listify_evaluators import ListifyEvaluator

load_dotenv()

def main():
    """Run evaluation tests"""
    print("🧪 Running Listify Agent LLM Evaluations\n")
    
    evaluator = ListifyEvaluator(threshold=0.7)
    
    # Test Case 1: Text Analysis
    print("=" * 60)
    print("Test 1: Text Analysis Evaluation")
    print("=" * 60)
    
    input_text = """
    Shopping List:
    - Buy 2 gallons of organic milk
    - Get 1 dozen free-range eggs  
    - Pick up whole wheat bread
    - Don't forget cheese and butter
    """
    
    extracted_items = [
        {
            "item_name": "Buy 2 gallons of organic milk",
            "category": "groceries",
            "quantity": "2 gallons",
            "notes": "Organic preferred",
            "explanation": "Organic dairy product for better nutrition and animal welfare"
        },
        {
            "item_name": "Get 1 dozen free-range eggs",
            "category": "groceries",
            "quantity": "1 dozen",
            "notes": None,
            "explanation": "Protein source from free-range chickens, higher quality"
        },
        {
            "item_name": "Pick up whole wheat bread",
            "category": "groceries",
            "quantity": None,
            "notes": None,
            "explanation": "Whole grain bread for healthier carbohydrates and fiber"
        },
        {
            "item_name": "Don't forget cheese and butter",
            "category": "groceries",
            "quantity": None,
            "notes": None,
            "explanation": "Dairy products for cooking and spreading"
        }
    ]
    
    results = evaluator.evaluate_all(
        input_text,
        "text",
        extracted_items,
        expected_items=["milk", "eggs", "bread", "cheese", "butter"]
    )
    
    print_results(results)
    
    # Test Case 2: Image Analysis
    print("\n" + "=" * 60)
    print("Test 2: Image Analysis Evaluation")
    print("=" * 60)
    
    image_description = "Handwritten shopping list visible in image: Milk, Eggs, Bread, Apples, Chicken breast"
    
    image_items = [
        {"item_name": "Milk", "category": "groceries", "quantity": None, "notes": None, "explanation": "Dairy product"},
        {"item_name": "Eggs", "category": "groceries", "quantity": None, "notes": None, "explanation": "Protein source"},
        {"item_name": "Bread", "category": "groceries", "quantity": None, "notes": None, "explanation": "Bakery staple"},
        {"item_name": "Apples", "category": "groceries", "quantity": None, "notes": None, "explanation": "Fresh fruit"},
        {"item_name": "Chicken breast", "category": "groceries", "quantity": None, "notes": None, "explanation": "Lean protein"}
    ]
    
    image_results = evaluator.evaluate_all(
        image_description,
        "image",
        image_items,
        expected_items=["Milk", "Eggs", "Bread", "Apples", "Chicken"]
    )
    
    print_results(image_results)
    
    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Text Analysis Overall Score: {results['overall'].score:.2f} {'✅' if results['overall'].passed else '❌'}")
    print(f"Image Analysis Overall Score: {image_results['overall'].score:.2f} {'✅' if image_results['overall'].passed else '❌'}")
    print("=" * 60)


def print_results(results):
    """Print formatted evaluation results"""
    for metric_name, result in results.items():
        if metric_name == 'overall':
            print(f"\n{'='*60}")
        
        status = "✅ PASS" if result.passed else "❌ FAIL"
        print(f"\n{metric_name.upper().replace('_', ' ')}: {status}")
        print(f"  Score: {result.score:.2f} / 1.0")
        print(f"  Confidence: {result.confidence:.2f}")
        print(f"  Explanation: {result.explanation[:150]}...")
        
        if metric_name != 'overall' and result.details:
            # Print key details
            if 'strengths' in result.details and result.details['strengths']:
                print(f"  Strengths: {', '.join(result.details['strengths'][:3])}")
            if 'weaknesses' in result.details and result.details['weaknesses']:
                print(f"  Weaknesses: {', '.join(result.details['weaknesses'][:3])}")


if __name__ == "__main__":
    try:
        main()
        sys.exit(0)
    except KeyboardInterrupt:
        print("\n\n⚠️  Evaluation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error running evaluations: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

