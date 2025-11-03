"""
Unit tests for Listify Agent LLM evaluations
Tests the three core evaluation metrics
"""

import pytest
from evaluations.listify_evaluators import (
    ListifyEvaluator,
    evaluate_extraction_accuracy,
    evaluate_structure_compliance,
    evaluate_content_quality,
    evaluate_all_metrics
)

class TestItemExtractionAccuracy:
    """Test Metric 1: Item Extraction Accuracy"""
    
    def test_complete_extraction(self):
        """Test when all items are correctly extracted"""
        input_text = "Buy milk, eggs, bread, and cheese"
        extracted_items = [
            {"item_name": "Buy milk", "category": "groceries", "quantity": None, "notes": None, "explanation": "Dairy product"},
            {"item_name": "eggs", "category": "groceries", "quantity": None, "notes": None, "explanation": "Protein source"},
            {"item_name": "bread", "category": "groceries", "quantity": None, "notes": None, "explanation": "Carbohydrate staple"},
            {"item_name": "cheese", "category": "groceries", "quantity": None, "notes": None, "explanation": "Dairy product"}
        ]
        
        result = evaluate_extraction_accuracy(input_text, "text", extracted_items, expected_items=["milk", "eggs", "bread", "cheese"])
        
        assert result.score >= 0.7, f"Expected high accuracy score, got {result.score}"
        assert result.passed, "Should pass with complete extraction"
        assert "completeness" in result.details
    
    def test_missing_items(self):
        """Test when some items are missing"""
        input_text = "Buy milk, eggs, bread, and cheese"
        extracted_items = [
            {"item_name": "milk", "category": "groceries", "quantity": None, "notes": None, "explanation": "Dairy"}
        ]
        
        result = evaluate_extraction_accuracy(input_text, "text", extracted_items, expected_items=["milk", "eggs", "bread", "cheese"])
        
        # Should have lower score due to missing items
        assert result.score < 0.7, "Should score lower when items are missing"
        assert "missing" in str(result.details.get("completeness", {})).lower() or "missing" in result.explanation.lower()
    
    def test_false_positives(self):
        """Test when items not in input are extracted"""
        input_text = "Buy milk and eggs"
        extracted_items = [
            {"item_name": "milk", "category": "groceries", "quantity": None, "notes": None, "explanation": "Dairy"},
            {"item_name": "eggs", "category": "groceries", "quantity": None, "notes": None, "explanation": "Protein"},
            {"item_name": "bread", "category": "groceries", "quantity": None, "notes": None, "explanation": "Not in list"}
        ]
        
        result = evaluate_extraction_accuracy(input_text, "text", extracted_items)
        
        assert result.score < 1.0, "Should score lower with false positives"
        assert "false" in str(result.details.get("completeness", {})).lower() or "false" in result.explanation.lower()


class TestDataStructureCompliance:
    """Test Metric 2: Data Structure Compliance"""
    
    def test_perfect_structure(self):
        """Test when all items have correct structure"""
        items = [
            {
                "item_name": "Buy milk",
                "category": "groceries",
                "quantity": "2 gallons",
                "notes": "Organic preferred",
                "explanation": "Essential dairy product"
            },
            {
                "item_name": "Call dentist",
                "category": "tasks",
                "quantity": None,
                "notes": None,
                "explanation": "Schedule checkup"
            }
        ]
        
        result = evaluate_structure_compliance(items)
        
        assert result.score >= 0.9, f"Expected high compliance score, got {result.score}"
        assert result.passed, "Should pass with perfect structure"
        assert "structure_issues" in result.details
    
    def test_missing_required_fields(self):
        """Test when required fields are missing"""
        items = [
            {"category": "groceries"},  # Missing item_name
            {"item_name": "milk"}  # Missing category
        ]
        
        result = evaluate_structure_compliance(items)
        
        assert result.score < 0.7, "Should score lower with missing required fields"
        assert result.details.get("structure_issues", {}).get("missing_item_name") is not None or \
               result.details.get("structure_issues", {}).get("missing_category") is not None
    
    def test_invalid_categories(self):
        """Test when invalid categories are used"""
        items = [
            {"item_name": "milk", "category": "invalid_category", "quantity": None, "notes": None, "explanation": "Test"}
        ]
        
        result = evaluate_structure_compliance(items)
        
        assert result.score < 0.7, "Should score lower with invalid categories"
        assert len(result.details.get("structure_issues", {}).get("invalid_category", [])) > 0
    
    def test_all_valid_categories(self):
        """Test that all valid categories are accepted"""
        valid_items = []
        valid_categories = ['groceries', 'tasks', 'contacts', 'events', 'inventory', 'ideas', 'recipes', 'shopping', 'bills', 'other']
        
        for i, category in enumerate(valid_categories):
            valid_items.append({
                "item_name": f"Test item {i}",
                "category": category,
                "quantity": None,
                "notes": None,
                "explanation": "Test"
            })
        
        result = evaluate_structure_compliance(valid_items)
        
        assert result.score >= 0.9, "All valid categories should score high"
        assert len(result.details.get("structure_issues", {}).get("invalid_category", [])) == 0


class TestContentRelevanceQuality:
    """Test Metric 3: Content Relevance & Quality"""
    
    def test_high_quality_items(self):
        """Test with high-quality, relevant items"""
        input_text = "Shopping list: Buy organic milk (2 gallons), Free-range eggs (1 dozen), Whole wheat bread"
        items = [
            {
                "item_name": "Buy organic milk",
                "category": "groceries",
                "quantity": "2 gallons",
                "notes": "Organic preferred",
                "explanation": "Organic dairy product for better nutrition and animal welfare"
            },
            {
                "item_name": "Free-range eggs",
                "category": "groceries",
                "quantity": "1 dozen",
                "notes": None,
                "explanation": "Eggs from free-range chickens, higher quality protein source"
            }
        ]
        
        result = evaluate_content_quality(input_text, "text", items)
        
        assert result.score >= 0.7, f"Expected high quality score, got {result.score}"
        assert result.passed, "Should pass with high-quality items"
        assert "quality_analysis" in result.details
    
    def test_low_quality_items(self):
        """Test with low-quality, irrelevant items"""
        input_text = "Shopping list: Buy milk, eggs"
        items = [
            {
                "item_name": "random text",
                "category": "other",
                "quantity": None,
                "notes": None,
                "explanation": ""
            }
        ]
        
        result = evaluate_content_quality(input_text, "text", items)
        
        assert result.score < 0.7, "Should score lower with low-quality items"
        assert len(result.details.get("quality_analysis", {}).get("low_quality_items", [])) > 0 or \
               len(result.details.get("quality_analysis", {}).get("irrelevant_items", [])) > 0
    
    def test_poor_explanations(self):
        """Test when explanations are missing or poor"""
        input_text = "Buy milk"
        items = [
            {
                "item_name": "milk",
                "category": "groceries",
                "quantity": None,
                "notes": None,
                "explanation": ""  # Empty explanation
            }
        ]
        
        result = evaluate_content_quality(input_text, "text", items)
        
        # Should score lower due to poor explanations
        assert result.details.get("explanation_quality_score", 1.0) < 0.8


class TestCombinedEvaluations:
    """Test running all evaluations together"""
    
    def test_evaluate_all_metrics(self):
        """Test running all three metrics together"""
        input_text = "Shopping list: Buy milk (2 gallons), eggs (1 dozen), bread"
        items = [
            {
                "item_name": "Buy milk",
                "category": "groceries",
                "quantity": "2 gallons",
                "notes": "Organic preferred",
                "explanation": "Essential dairy product for daily nutrition"
            },
            {
                "item_name": "eggs",
                "category": "groceries",
                "quantity": "1 dozen",
                "notes": None,
                "explanation": "Protein source for breakfast"
            },
            {
                "item_name": "bread",
                "category": "groceries",
                "quantity": None,
                "notes": None,
                "explanation": "Carbohydrate staple food"
            }
        ]
        
        results = evaluate_all_metrics(input_text, "text", items, expected_items=["milk", "eggs", "bread"])
        
        assert "extraction_accuracy" in results
        assert "structure_compliance" in results
        assert "content_quality" in results
        assert "overall" in results
        
        # Overall score should be weighted average
        assert 0.0 <= results["overall"].score <= 1.0
        assert "weighted_scores" in results["overall"].details


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

