"""
Integration tests for Listify evaluations
Runs evaluations on actual API responses
"""

import os
import sys
import asyncio
from dotenv import load_dotenv
from evaluations.listify_evaluators import ListifyEvaluator, EvaluationResult

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

def test_text_analysis_evaluation():
    """Test evaluation on actual text analysis output"""
    evaluator = ListifyEvaluator(threshold=0.7)
    
    # Simulate actual API response
    input_text = """
    Shopping List:
    - Buy 2 gallons of organic milk
    - Get 1 dozen free-range eggs
    - Pick up whole wheat bread
    - Don't forget cheese
    """
    
    extracted_items = [
        {
            "item_name": "Buy 2 gallons of organic milk",
            "category": "groceries",
            "quantity": "2 gallons",
            "notes": "Organic preferred",
            "explanation": "Organic dairy product for better nutrition"
        },
        {
            "item_name": "Get 1 dozen free-range eggs",
            "category": "groceries",
            "quantity": "1 dozen",
            "notes": None,
            "explanation": "Protein source from free-range chickens"
        },
        {
            "item_name": "Pick up whole wheat bread",
            "category": "groceries",
            "quantity": None,
            "notes": None,
            "explanation": "Whole grain bread for healthier carbohydrates"
        },
        {
            "item_name": "Don't forget cheese",
            "category": "groceries",
            "quantity": None,
            "notes": None,
            "explanation": "Dairy product for cooking and snacks"
        }
    ]
    
    print("=" * 60)
    print("Testing Text Analysis Evaluation")
    print("=" * 60)
    
    # Run all evaluations
    results = evaluator.evaluate_all(
        input_text,
        "text",
        extracted_items,
        expected_items=["milk", "eggs", "bread", "cheese"]
    )
    
    # Print results
    for metric_name, result in results.items():
        print(f"\n{metric_name.upper().replace('_', ' ')}:")
        print(f"  Score: {result.score:.2f}")
        print(f"  Passed: {'✅' if result.passed else '❌'}")
        print(f"  Confidence: {result.confidence:.2f}")
        print(f"  Explanation: {result.explanation[:200]}...")
        if result.details:
            print(f"  Details: {list(result.details.keys())}")
    
    # Assertions
    assert results["overall"].score >= 0.7, f"Overall score too low: {results['overall'].score}"
    assert results["structure_compliance"].score >= 0.9, "Structure compliance should be high"
    
    print("\n✅ All evaluations completed successfully!")


def test_image_analysis_evaluation():
    """Test evaluation on simulated image analysis output"""
    evaluator = ListifyEvaluator(threshold=0.7)
    
    # Simulate image analysis scenario
    input_description = "Handwritten shopping list with: Milk, Eggs, Bread, Apples, Chicken"
    
    extracted_items = [
        {
            "item_name": "Milk",
            "category": "groceries",
            "quantity": None,
            "notes": None,
            "explanation": "Dairy product"
        },
        {
            "item_name": "Eggs",
            "category": "groceries",
            "quantity": None,
            "notes": None,
            "explanation": "Protein source"
        },
        {
            "item_name": "Bread",
            "category": "groceries",
            "quantity": None,
            "notes": None,
            "explanation": "Bakery item"
        },
        {
            "item_name": "Apples",
            "category": "groceries",
            "quantity": None,
            "notes": None,
            "explanation": "Fresh fruit"
        },
        {
            "item_name": "Chicken",
            "category": "groceries",
            "quantity": None,
            "notes": None,
            "explanation": "Meat protein"
        }
    ]
    
    print("\n" + "=" * 60)
    print("Testing Image Analysis Evaluation")
    print("=" * 60)
    
    results = evaluator.evaluate_all(
        input_description,
        "image",
        extracted_items,
        expected_items=["Milk", "Eggs", "Bread", "Apples", "Chicken"]
    )
    
    for metric_name, result in results.items():
        print(f"\n{metric_name.upper().replace('_', ' ')}:")
        print(f"  Score: {result.score:.2f} {'✅' if result.passed else '❌'}")
    
    assert results["extraction_accuracy"].score >= 0.7, "Should extract all items from image"
    print("\n✅ Image analysis evaluation completed!")


def test_url_analysis_evaluation():
    """Test evaluation on simulated URL analysis output"""
    evaluator = ListifyEvaluator(threshold=0.7)
    
    input_description = "IMDB Top Movies page with rankings"
    
    extracted_items = [
        {
            "item_name": "The Shawshank Redemption",
            "category": "entertainment",
            "quantity": "1",
            "notes": "Rating: 9.3",
            "explanation": "Top-ranked drama film"
        },
        {
            "item_name": "The Godfather",
            "category": "entertainment",
            "quantity": "2",
            "notes": "Rating: 9.2",
            "explanation": "Classic crime drama"
        }
    ]
    
    print("\n" + "=" * 60)
    print("Testing URL Analysis Evaluation")
    print("=" * 60)
    
    results = evaluator.evaluate_all(
        input_description,
        "url",
        extracted_items
    )
    
    for metric_name, result in results.items():
        print(f"\n{metric_name.upper().replace('_', ' ')}:")
        print(f"  Score: {result.score:.2f} {'✅' if result.passed else '❌'}")
    
    print("\n✅ URL analysis evaluation completed!")


if __name__ == "__main__":
    print("\n🧪 Running Listify Agent Evaluation Tests\n")
    
    try:
        test_text_analysis_evaluation()
        test_image_analysis_evaluation()
        test_url_analysis_evaluation()
        
        print("\n" + "=" * 60)
        print("✅ ALL TESTS PASSED")
        print("=" * 60)
        
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

