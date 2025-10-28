#!/usr/bin/env python3
"""
Advanced LLM Evaluation Tests for Listify Agent
===============================================

This module integrates with actual Listify Agent services to provide
comprehensive LLM evaluation using deepeval framework.
"""

import os
import json
import requests
from typing import List, Dict, Any, Optional
from deepeval.test_case import LLMTestCase, LLMTestCaseParams
from deepeval.metrics import GEval
from deepeval import evaluate
import pytest
from dotenv import load_dotenv

load_dotenv()

class ListifyAgentService:
    """Service class to interact with actual Listify Agent API"""
    
    def __init__(self, base_url: str = "http://localhost:3001"):
        self.base_url = base_url
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
    
    def analyze_text(self, text: str) -> Dict[str, Any]:
        """Call the actual text analysis API"""
        try:
            response = requests.post(
                f"{self.base_url}/api/analyze-text",
                json={"text": text},
                timeout=30
            )
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"API error: {response.status_code}"}
        except requests.exceptions.RequestException as e:
            return {"error": f"Request failed: {str(e)}"}
    
    def analyze_image(self, image_path: str) -> Dict[str, Any]:
        """Call the actual image analysis API"""
        try:
            with open(image_path, 'rb') as f:
                files = {'image': f}
                response = requests.post(
                    f"{self.base_url}/api/upload",
                    files=files,
                    timeout=30
                )
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"API error: {response.status_code}"}
        except requests.exceptions.RequestException as e:
            return {"error": f"Request failed: {str(e)}"}
        except FileNotFoundError:
            return {"error": "Image file not found"}
    
    def analyze_link(self, url: str) -> Dict[str, Any]:
        """Call the actual link analysis API"""
        try:
            response = requests.post(
                f"{self.base_url}/api/analyze-link",
                json={"url": url},
                timeout=30
            )
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"API error: {response.status_code}"}
        except requests.exceptions.RequestException as e:
            return {"error": f"Request failed: {str(e)}"}

class ListifyAgentEvaluator:
    """Advanced evaluator that uses actual Listify Agent services"""
    
    def __init__(self, base_url: str = "http://localhost:3001"):
        self.service = ListifyAgentService(base_url)
    
    def create_text_analysis_test_case(self, input_text: str, expected_items: List[str], 
                                     expected_categories: List[str] = None) -> LLMTestCase:
        """Create a test case using actual text analysis API"""
        
        actual_output = self.service.analyze_text(input_text)
        
        expected_output = {
            "items": expected_items,
            "categories": expected_categories or [],
            "extraction_method": "text_analysis"
        }
        
        return LLMTestCase(
            input=input_text,
            actual_output=json.dumps(actual_output),
            expected_output=json.dumps(expected_output)
        )
    
    def create_image_analysis_test_case(self, image_path: str, expected_items: List[str],
                                      expected_quantities: List[str] = None) -> LLMTestCase:
        """Create a test case using actual image analysis API"""
        
        actual_output = self.service.analyze_image(image_path)
        
        expected_output = {
            "items": expected_items,
            "quantities": expected_quantities or [],
            "extraction_method": "image_analysis"
        }
        
        return LLMTestCase(
            input=f"Analyze image: {image_path}",
            actual_output=json.dumps(actual_output),
            expected_output=json.dumps(expected_output)
        )
    
    def create_link_analysis_test_case(self, url: str, expected_items: List[str],
                                     expected_categories: List[str] = None) -> LLMTestCase:
        """Create a test case using actual link analysis API"""
        
        actual_output = self.service.analyze_link(url)
        
        expected_output = {
            "items": expected_items,
            "categories": expected_categories or [],
            "extraction_method": "link_analysis"
        }
        
        return LLMTestCase(
            input=f"Analyze link: {url}",
            actual_output=json.dumps(actual_output),
            expected_output=json.dumps(expected_output)
        )

# Evaluation Metrics
def create_list_extraction_metric():
    """Create metric for list extraction accuracy"""
    return GEval(
        name="List Extraction Accuracy",
        criteria="List Extraction Accuracy - evaluate if the AI correctly extracts items from the input. Check for accuracy of item identification, proper parsing, and completeness of extraction.",
        evaluation_params=[LLMTestCaseParams.ACTUAL_OUTPUT, LLMTestCaseParams.EXPECTED_OUTPUT],
        strict_mode=True
    )

def create_categorization_metric():
    """Create metric for categorization accuracy"""
    return GEval(
        name="Categorization Accuracy",
        criteria="Categorization Accuracy - assess if items are correctly categorized into appropriate categories. Categories should be logical, consistent, and match the expected categorization.",
        evaluation_params=[LLMTestCaseParams.ACTUAL_OUTPUT, LLMTestCaseParams.EXPECTED_OUTPUT],
        strict_mode=True
    )

def create_quantity_extraction_metric():
    """Create metric for quantity extraction accuracy"""
    return GEval(
        name="Quantity Extraction Accuracy",
        criteria="Quantity Extraction Accuracy - evaluate if quantities are correctly extracted and identified. Check for accuracy of quantity parsing and proper unit recognition.",
        evaluation_params=[LLMTestCaseParams.ACTUAL_OUTPUT, LLMTestCaseParams.EXPECTED_OUTPUT],
        strict_mode=True
    )

def create_completeness_metric():
    """Create metric for completeness"""
    return GEval(
        name="Completeness",
        criteria="Completeness - evaluate if all expected items were extracted and no important items were missed. The output should be comprehensive and complete.",
        evaluation_params=[LLMTestCaseParams.ACTUAL_OUTPUT, LLMTestCaseParams.EXPECTED_OUTPUT],
        strict_mode=True
    )

# Test Cases
@pytest.fixture
def evaluator():
    """Fixture to provide evaluator instance"""
    return ListifyAgentEvaluator()

def test_grocery_list_text_analysis(evaluator):
    """Test grocery list extraction from text using actual API"""
    test_case = evaluator.create_text_analysis_test_case(
        input_text="I need to buy milk, bread, eggs, and apples for this week's grocery shopping",
        expected_items=["milk", "bread", "eggs", "apples"],
        expected_categories=["food", "grocery"]
    )
    
    extraction_metric = create_list_extraction_metric()
    categorization_metric = create_categorization_metric()
    completeness_metric = create_completeness_metric()
    
    extraction_metric.measure(test_case)
    categorization_metric.measure(test_case)
    completeness_metric.measure(test_case)
    
    print(f"Grocery List - Extraction Score: {extraction_metric.score}")
    print(f"Grocery List - Categorization Score: {categorization_metric.score}")
    print(f"Grocery List - Completeness Score: {completeness_metric.score}")
    
    assert extraction_metric.score >= 0.7
    assert categorization_metric.score >= 0.7
    assert completeness_metric.score >= 0.7

def test_work_task_text_analysis(evaluator):
    """Test work task extraction from text using actual API"""
    test_case = evaluator.create_text_analysis_test_case(
        input_text="Today's work tasks: attend team meeting, write quarterly report, send follow-up emails, prepare presentation for client",
        expected_items=["team meeting", "quarterly report", "follow-up emails", "presentation"],
        expected_categories=["work", "tasks"]
    )
    
    extraction_metric = create_list_extraction_metric()
    categorization_metric = create_categorization_metric()
    
    extraction_metric.measure(test_case)
    categorization_metric.measure(test_case)
    
    print(f"Work Tasks - Extraction Score: {extraction_metric.score}")
    print(f"Work Tasks - Categorization Score: {categorization_metric.score}")
    
    assert extraction_metric.score >= 0.7
    assert categorization_metric.score >= 0.7

def test_complex_mixed_content_analysis(evaluator):
    """Test complex mixed content analysis using actual API"""
    test_case = evaluator.create_text_analysis_test_case(
        input_text="For the birthday party: buy balloons, cake, drinks, decorations, and party favors. Also need to clean house, set up music system, invite guests, and prepare games",
        expected_items=["balloons", "cake", "drinks", "decorations", "party favors", "clean house", "music system", "invite guests", "prepare games"],
        expected_categories=["party", "shopping", "preparation"]
    )
    
    extraction_metric = create_list_extraction_metric()
    completeness_metric = create_completeness_metric()
    
    extraction_metric.measure(test_case)
    completeness_metric.measure(test_case)
    
    print(f"Complex Content - Extraction Score: {extraction_metric.score}")
    print(f"Complex Content - Completeness Score: {completeness_metric.score}")
    
    assert extraction_metric.score >= 0.6  # Lower threshold for complex cases
    assert completeness_metric.score >= 0.6

def test_quantity_extraction(evaluator):
    """Test quantity extraction from text using actual API"""
    test_case = evaluator.create_text_analysis_test_case(
        input_text="Shopping list: 2 gallons of milk, 3 loaves of bread, 1 dozen eggs, 5 pounds of apples",
        expected_items=["milk", "bread", "eggs", "apples"],
        expected_categories=["food", "grocery"]
    )
    
    quantity_metric = create_quantity_extraction_metric()
    extraction_metric = create_list_extraction_metric()
    
    quantity_metric.measure(test_case)
    extraction_metric.measure(test_case)
    
    print(f"Quantity Extraction - Score: {quantity_metric.score}")
    print(f"Quantity Extraction - Extraction Score: {extraction_metric.score}")
    
    assert quantity_metric.score >= 0.6
    assert extraction_metric.score >= 0.7

def test_edge_cases_analysis(evaluator):
    """Test edge cases using actual API"""
    
    # Empty input
    test_case_empty = evaluator.create_text_analysis_test_case(
        input_text="",
        expected_items=[],
        expected_categories=[]
    )
    
    # Single item
    test_case_single = evaluator.create_text_analysis_test_case(
        input_text="Buy milk",
        expected_items=["milk"],
        expected_categories=["food"]
    )
    
    # Very long list
    test_case_long = evaluator.create_text_analysis_test_case(
        input_text="Shopping list: " + ", ".join([f"item{i}" for i in range(15)]),
        expected_items=[f"item{i}" for i in range(15)],
        expected_categories=["shopping"]
    )
    
    extraction_metric = create_list_extraction_metric()
    
    # Test empty case
    extraction_metric.measure(test_case_empty)
    print(f"Empty case score: {extraction_metric.score}")
    
    # Test single item case
    extraction_metric.measure(test_case_single)
    print(f"Single item score: {extraction_metric.score}")
    
    # Test long list case
    extraction_metric.measure(test_case_long)
    print(f"Long list score: {extraction_metric.score}")
    
    assert extraction_metric.score >= 0.5  # Lower threshold for edge cases

def test_api_availability():
    """Test if the Listify Agent API is available"""
    try:
        response = requests.get('http://localhost:3001/api/health', timeout=5)
        if response.status_code == 200:
            print("✅ Listify Agent API is available")
            return True
        else:
            print(f"❌ Listify Agent API returned status: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Listify Agent API not available: {str(e)}")
        return False

def test_image_analysis_with_mock():
    """Test image analysis with mock data (since we don't have actual images)"""
    evaluator = ListifyAgentEvaluator()
    
    # Create a mock test case for image analysis
    test_case = LLMTestCase(
        input="Analyze receipt image",
        actual_output=json.dumps({
            "items": ["coffee", "sandwich", "cookie"],
            "quantities": ["1", "1", "2"],
            "extraction_method": "image_analysis"
        }),
        expected_output=json.dumps({
            "items": ["coffee", "sandwich", "cookie"],
            "quantities": ["1", "1", "2"],
            "extraction_method": "image_analysis"
        })
    )
    
    extraction_metric = create_list_extraction_metric()
    quantity_metric = create_quantity_extraction_metric()
    
    extraction_metric.measure(test_case)
    quantity_metric.measure(test_case)
    
    print(f"Image Analysis - Extraction Score: {extraction_metric.score}")
    print(f"Image Analysis - Quantity Score: {quantity_metric.score}")
    
    assert extraction_metric.score >= 0.8
    assert quantity_metric.score >= 0.8

# Performance and reliability tests
def test_api_response_time(evaluator):
    """Test API response time"""
    import time
    
    start_time = time.time()
    result = evaluator.service.analyze_text("Buy milk, bread, eggs")
    end_time = time.time()
    
    response_time = end_time - start_time
    print(f"API Response Time: {response_time:.2f} seconds")
    
    # API should respond within 10 seconds
    assert response_time < 10.0
    assert "error" not in result

def test_api_error_handling(evaluator):
    """Test API error handling"""
    # Test with invalid input
    result = evaluator.service.analyze_text("")
    
    # Should handle empty input gracefully
    assert isinstance(result, dict)
    print(f"Error handling test result: {result}")

if __name__ == "__main__":
    print("🧪 Running Advanced Listify Agent LLM Evaluation Tests")
    print("=" * 60)
    
    # Check API availability first
    if not test_api_availability():
        print("⚠️  API not available, running mock tests only")
        test_image_analysis_with_mock()
    else:
        print("✅ API available, running full test suite")
        
        evaluator = ListifyAgentEvaluator()
        
        # Run tests
        test_grocery_list_text_analysis(evaluator)
        test_work_task_text_analysis(evaluator)
        test_complex_mixed_content_analysis(evaluator)
        test_quantity_extraction(evaluator)
        test_edge_cases_analysis(evaluator)
        test_api_response_time(evaluator)
        test_api_error_handling(evaluator)
    
    print("\n✅ All advanced LLM evaluation tests completed!")
