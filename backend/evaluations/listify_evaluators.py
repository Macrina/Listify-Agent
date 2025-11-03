"""
Listify Agent LLM Evaluators
Implements three core evaluation metrics for list extraction quality
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import openai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class EvaluationResult:
    """Result of an evaluation metric"""
    score: float  # 0.0 to 1.0
    passed: bool  # True if score >= threshold
    confidence: float  # 0.0 to 1.0
    explanation: str
    details: Dict[str, Any]

class ListifyEvaluator:
    """Evaluator for Listify Agent list extraction quality"""
    
    def __init__(self, model: str = "gpt-4o", threshold: float = 0.7):
        """
        Initialize evaluator
        
        Args:
            model: OpenAI model to use for evaluation
            threshold: Minimum score to pass (0.0 to 1.0)
        """
        self.client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.model = model
        self.threshold = threshold
        self.valid_categories = [
            'groceries', 'tasks', 'contacts', 'events', 
            'inventory', 'ideas', 'recipes', 'shopping', 
            'bills', 'other'
        ]
        self.required_fields = ['item_name', 'category', 'quantity', 'notes', 'explanation']
    
    def evaluate_extraction_accuracy(
        self, 
        input_source: str,
        input_type: str,  # 'image', 'text', 'url'
        extracted_items: List[Dict[str, Any]],
        expected_items: Optional[List[str]] = None
    ) -> EvaluationResult:
        """
        Metric 1: Item Extraction Accuracy
        Did the LLM correctly identify and extract all relevant list items?
        
        Args:
            input_source: Original input (image description, text, or URL description)
            input_type: Type of input ('image', 'text', 'url')
            extracted_items: List of items extracted by the LLM
            expected_items: Optional list of expected item names (for known inputs)
        
        Returns:
            EvaluationResult with score, explanation, and details
        """
        items_json = json.dumps(extracted_items, indent=2)
        extracted_count = len(extracted_items)
        
        expected_info = ""
        if expected_items:
            expected_info = f"""
            Expected Items (for reference):
            {json.dumps(expected_items, indent=2)}
            """
        
        prompt = f"""You are an expert evaluator assessing the accuracy of list item extraction from {input_type} input.

Input Source: {input_source[:500]}
Extracted Items:
{items_json}
{expected_info}

Evaluate whether the LLM correctly identified and extracted ALL relevant list items from the input.

Consider:
1. **Completeness**: Are all visible/mentioned items extracted? None missing?
2. **Correctness**: Are item names accurately extracted (no typos, truncations, or misinterpretations)?
3. **Categorization**: Are categories appropriately assigned based on item content?
4. **False Positives**: Are there any items that don't exist in the input?
5. **Parsing Quality**: Are items properly structured and meaningful?

Score the extraction accuracy from 0.0 to 1.0:
- 1.0 = Perfect: All items extracted accurately, correctly categorized, no errors
- 0.8-0.9 = Excellent: Nearly all items extracted, minor issues
- 0.6-0.7 = Good: Most items extracted, some missing or incorrect
- 0.4-0.5 = Fair: Many items extracted but significant issues
- 0.0-0.3 = Poor: Major extraction errors, many missing items

Respond with JSON:
{{
    "score": <0.0-1.0>,
    "confidence": <0.0-1.0>,
    "explanation": "<detailed explanation of extraction quality>",
    "completeness": {{
        "items_found": <count>,
        "items_missing": [<list of missing items>],
        "false_positives": [<list of items not in input>]
    }},
    "accuracy": {{
        "correct_extractions": [<list>],
        "incorrect_extractions": [<list with issues>],
        "categorization_errors": [<list>]
    }},
    "strengths": ["<strength1>", "<strength2>"],
    "weaknesses": ["<weakness1>", "<weakness2>"]
}}
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=1500,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            
            return EvaluationResult(
                score=float(result["score"]),
                passed=float(result["score"]) >= self.threshold,
                confidence=float(result.get("confidence", 0.8)),
                explanation=result["explanation"],
                details={
                    "completeness": result.get("completeness", {}),
                    "accuracy": result.get("accuracy", {}),
                    "strengths": result.get("strengths", []),
                    "weaknesses": result.get("weaknesses", []),
                    "extracted_count": extracted_count
                }
            )
            
        except Exception as e:
            logger.error(f"Error in extraction accuracy evaluation: {e}")
            return EvaluationResult(
                score=0.0,
                passed=False,
                confidence=0.0,
                explanation=f"Evaluation failed: {str(e)}",
                details={}
            )
    
    def evaluate_structure_compliance(
        self,
        extracted_items: List[Dict[str, Any]]
    ) -> EvaluationResult:
        """
        Metric 2: Data Structure Compliance
        Did the LLM return items in the exact JSON format required?
        
        Args:
            extracted_items: List of items extracted by the LLM
        
        Returns:
            EvaluationResult with score, explanation, and details
        """
        items_json = json.dumps(extracted_items, indent=2)
        valid_categories_str = ", ".join(self.valid_categories)
        
        prompt = f"""You are an expert evaluator assessing data structure compliance of extracted list items.

Extracted Items:
{items_json}

Required JSON Structure:
- Each item MUST have these fields:
  * item_name (string, required) - The main text/title of the item
  * category (string, required) - Must be one of: {valid_categories_str}
  * quantity (string or null, optional) - Any number or quantity mentioned
  * notes (string or null, optional) - Additional details or context
  * explanation (string, optional) - Short explanation of the item

Valid Categories: {valid_categories_str}

Evaluate compliance from 0.0 to 1.0:
- 1.0 = Perfect: All items have all required fields, valid categories only
- 0.8-0.9 = Excellent: Minor issues (missing optional fields)
- 0.6-0.7 = Good: Some missing required fields or invalid categories
- 0.4-0.5 = Fair: Multiple compliance issues
- 0.0-0.3 = Poor: Major structural problems

Check for:
1. **Required Fields**: All items have item_name and category?
2. **Field Types**: Correct data types (strings, nulls)?
3. **Valid Categories**: Only uses allowed categories?
4. **Field Completeness**: All mandatory fields present?
5. **JSON Structure**: Valid JSON format, no syntax errors?

Respond with JSON:
{{
    "score": <0.0-1.0>,
    "confidence": <0.0-1.0>,
    "explanation": "<detailed explanation of compliance issues>",
    "structure_issues": {{
        "missing_item_name": [<indices>],
        "missing_category": [<indices>],
        "invalid_category": [{{"item": "<name>", "invalid_category": "<value>", "should_be": "<correct>"}}],
        "type_errors": [{{"item": "<name>", "field": "<field>", "issue": "<description>"}}],
        "format_errors": [<list of JSON/format issues>]
    }},
    "compliance_summary": {{
        "total_items": <count>,
        "fully_compliant": <count>,
        "partially_compliant": <count>,
        "non_compliant": <count>
    }},
    "category_usage": {{
        "<category>": <count>
    }},
    "strengths": ["<strength1>"],
    "weaknesses": ["<weakness1>"]
}}
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=1500,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            
            # Also do programmatic validation
            programmatic_score = self._validate_structure_programmatic(extracted_items)
            
            # Combine LLM score (70%) with programmatic validation (30%)
            combined_score = (float(result["score"]) * 0.7) + (programmatic_score * 0.3)
            
            return EvaluationResult(
                score=combined_score,
                passed=combined_score >= self.threshold,
                confidence=float(result.get("confidence", 0.9)),
                explanation=result["explanation"],
                details={
                    "structure_issues": result.get("structure_issues", {}),
                    "compliance_summary": result.get("compliance_summary", {}),
                    "category_usage": result.get("category_usage", {}),
                    "programmatic_score": programmatic_score,
                    "llm_score": float(result["score"]),
                    "strengths": result.get("strengths", []),
                    "weaknesses": result.get("weaknesses", [])
                }
            )
            
        except Exception as e:
            logger.error(f"Error in structure compliance evaluation: {e}")
            return EvaluationResult(
                score=0.0,
                passed=False,
                confidence=0.0,
                explanation=f"Evaluation failed: {str(e)}",
                details={}
            )
    
    def evaluate_content_quality(
        self,
        input_source: str,
        input_type: str,
        extracted_items: List[Dict[str, Any]]
    ) -> EvaluationResult:
        """
        Metric 3: Content Relevance & Quality
        Are extracted items useful, relevant, with meaningful explanations?
        
        Args:
            input_source: Original input
            input_type: Type of input ('image', 'text', 'url')
            extracted_items: List of items extracted by the LLM
        
        Returns:
            EvaluationResult with score, explanation, and details
        """
        items_json = json.dumps(extracted_items, indent=2)
        
        prompt = f"""You are an expert evaluator assessing the relevance and quality of extracted list items from {input_type} input.

Input Source: {input_source[:500]}
Extracted Items:
{items_json}

Evaluate whether the extracted items are:
1. **Relevant**: Actually present in or related to the input
2. **Useful**: Provide value to the user (not noise or irrelevant)
3. **Meaningful**: Explanations add context and help understand the item
4. **Well-Categorized**: Categories accurately reflect item purpose
5. **Complete**: Item names are descriptive enough to be actionable

Score content quality from 0.0 to 1.0:
- 1.0 = Perfect: All items highly relevant, useful, well-explained
- 0.8-0.9 = Excellent: Mostly high-quality, minor issues
- 0.6-0.7 = Good: Generally useful but some quality concerns
- 0.4-0.5 = Fair: Many items lack relevance or quality
- 0.0-0.3 = Poor: Low relevance, poor explanations, not useful

Consider:
- **Relevance**: Do items match what's in the input?
- **Usefulness**: Would a user find these items actionable?
- **Explanation Quality**: Are explanations helpful (1-2 sentences, contextual)?
- **Categorization Accuracy**: Do categories match item purpose?
- **Item Name Quality**: Are names descriptive enough?

Respond with JSON:
{{
    "score": <0.0-1.0>,
    "confidence": <0.0-1.0>,
    "explanation": "<detailed explanation of content quality>",
    "quality_analysis": {{
        "high_quality_items": [{{"item": "<name>", "reason": "<why>"}}],
        "low_quality_items": [{{"item": "<name>", "issues": ["<issue1>"]}}],
        "irrelevant_items": [<list of irrelevant items>],
        "missing_context": [<list of items needing better explanation>]
    }},
    "relevance_score": <0.0-1.0>,
    "usefulness_score": <0.0-1.0>,
    "explanation_quality_score": <0.0-1.0>,
    "categorization_accuracy_score": <0.0-1.0>,
    "strengths": ["<strength1>"],
    "weaknesses": ["<weakness1>"]
}}
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=1500,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            
            return EvaluationResult(
                score=float(result["score"]),
                passed=float(result["score"]) >= self.threshold,
                confidence=float(result.get("confidence", 0.8)),
                explanation=result["explanation"],
                details={
                    "quality_analysis": result.get("quality_analysis", {}),
                    "relevance_score": float(result.get("relevance_score", 0.5)),
                    "usefulness_score": float(result.get("usefulness_score", 0.5)),
                    "explanation_quality_score": float(result.get("explanation_quality_score", 0.5)),
                    "categorization_accuracy_score": float(result.get("categorization_accuracy_score", 0.5)),
                    "strengths": result.get("strengths", []),
                    "weaknesses": result.get("weaknesses", [])
                }
            )
            
        except Exception as e:
            logger.error(f"Error in content quality evaluation: {e}")
            return EvaluationResult(
                score=0.0,
                passed=False,
                confidence=0.0,
                explanation=f"Evaluation failed: {str(e)}",
                details={}
            )
    
    def _validate_structure_programmatic(self, items: List[Dict[str, Any]]) -> float:
        """
        Programmatic validation of structure compliance
        Returns score from 0.0 to 1.0
        """
        if not items or len(items) == 0:
            return 0.0
        
        total_score = 0.0
        for item in items:
            item_score = 0.0
            checks = 0
            
            # Check required fields
            if 'item_name' in item and item['item_name'] and isinstance(item['item_name'], str) and item['item_name'].strip():
                item_score += 0.4
            checks += 1
            
            if 'category' in item and item['category']:
                if item['category'] in self.valid_categories:
                    item_score += 0.4
                checks += 1
            
            # Check field types (quantity and notes can be null)
            if 'quantity' not in item or item['quantity'] is None or isinstance(item['quantity'], str):
                item_score += 0.1
            checks += 1
            
            if 'notes' not in item or item['notes'] is None or isinstance(item['notes'], str):
                item_score += 0.1
            checks += 1
            
            total_score += (item_score / checks) if checks > 0 else 0
        
        return total_score / len(items) if len(items) > 0 else 0.0
    
    def evaluate_all(
        self,
        input_source: str,
        input_type: str,
        extracted_items: List[Dict[str, Any]],
        expected_items: Optional[List[str]] = None
    ) -> Dict[str, EvaluationResult]:
        """
        Run all three evaluations and return combined results
        
        Returns:
            Dictionary with 'extraction_accuracy', 'structure_compliance', 'content_quality'
        """
        results = {
            'extraction_accuracy': self.evaluate_extraction_accuracy(
                input_source, input_type, extracted_items, expected_items
            ),
            'structure_compliance': self.evaluate_structure_compliance(extracted_items),
            'content_quality': self.evaluate_content_quality(input_source, input_type, extracted_items)
        }
        
        # Calculate overall score (weighted average)
        weights = {
            'extraction_accuracy': 0.4,  # Most important
            'structure_compliance': 0.3,
            'content_quality': 0.3
        }
        
        overall_score = sum(
            results[key].score * weights[key] 
            for key in weights
        )
        
        results['overall'] = EvaluationResult(
            score=overall_score,
            passed=overall_score >= self.threshold,
            confidence=sum(r.confidence for r in results.values()) / len(results),
            explanation=f"Overall score: {overall_score:.2f} (weighted average)",
            details={
                'weighted_scores': {
                    key: results[key].score * weights[key]
                    for key in weights
                },
                'all_passed': all(r.passed for r in results.values())
            }
        )
        
        return results


# Convenience functions for easy import
def evaluate_extraction_accuracy(
    input_source: str,
    input_type: str,
    extracted_items: List[Dict[str, Any]],
    expected_items: Optional[List[str]] = None,
    threshold: float = 0.7
) -> EvaluationResult:
    """Convenience function for extraction accuracy evaluation"""
    evaluator = ListifyEvaluator(threshold=threshold)
    return evaluator.evaluate_extraction_accuracy(input_source, input_type, extracted_items, expected_items)

def evaluate_structure_compliance(
    extracted_items: List[Dict[str, Any]],
    threshold: float = 0.7
) -> EvaluationResult:
    """Convenience function for structure compliance evaluation"""
    evaluator = ListifyEvaluator(threshold=threshold)
    return evaluator.evaluate_structure_compliance(extracted_items)

def evaluate_content_quality(
    input_source: str,
    input_type: str,
    extracted_items: List[Dict[str, Any]],
    threshold: float = 0.7
) -> EvaluationResult:
    """Convenience function for content quality evaluation"""
    evaluator = ListifyEvaluator(threshold=threshold)
    return evaluator.evaluate_content_quality(input_source, input_type, extracted_items)

def evaluate_all_metrics(
    input_source: str,
    input_type: str,
    extracted_items: List[Dict[str, Any]],
    expected_items: Optional[List[str]] = None,
    threshold: float = 0.7
) -> Dict[str, EvaluationResult]:
    """Convenience function to run all evaluations"""
    evaluator = ListifyEvaluator(threshold=threshold)
    return evaluator.evaluate_all(input_source, input_type, extracted_items, expected_items)


# Example usage
if __name__ == "__main__":
    evaluator = ListifyEvaluator()
    
    # Example extracted items
    test_items = [
        {
            "item_name": "Buy milk",
            "category": "groceries",
            "quantity": "2 gallons",
            "notes": "Prefer organic",
            "explanation": "Essential dairy product for daily nutrition"
        },
        {
            "item_name": "Call dentist",
            "category": "tasks",
            "quantity": None,
            "notes": "Schedule checkup",
            "explanation": "Routine dental appointment"
        }
    ]
    
    # Test structure compliance
    structure_result = evaluator.evaluate_structure_compliance(test_items)
    print(f"Structure Compliance: {structure_result.score:.2f}")
    print(f"Passed: {structure_result.passed}")
    print(f"Explanation: {structure_result.explanation}")
    
    # Test all metrics
    all_results = evaluator.evaluate_all(
        "Shopping list: Buy milk (2 gallons), Call dentist for checkup",
        "text",
        test_items
    )
    
    print("\n=== All Evaluation Results ===")
    for metric, result in all_results.items():
        print(f"\n{metric.upper()}:")
        print(f"  Score: {result.score:.2f}")
        print(f"  Passed: {result.passed}")
        print(f"  Confidence: {result.confidence:.2f}")
        print(f"  Explanation: {result.explanation[:200]}...")

