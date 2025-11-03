"""
Listify Agent LLM Evaluators with Arize Tracing Integration
Sends evaluation results as spans to Arize for observability
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode
import openai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get tracer
tracer = trace.get_tracer(__name__)

@dataclass
class EvaluationResult:
    """Result of an evaluation metric"""
    score: float
    passed: bool
    confidence: float
    explanation: str
    details: Dict[str, Any]
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return asdict(self)

class ListifyEvaluatorWithTracing:
    """Evaluator with Arize tracing integration"""
    
    def __init__(self, model: str = "gpt-4o", threshold: float = 0.7):
        self.client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.model = model
        self.threshold = threshold
        self.valid_categories = [
            'groceries', 'tasks', 'contacts', 'events', 
            'inventory', 'ideas', 'recipes', 'shopping', 
            'bills', 'other'
        ]
        self.required_fields = ['item_name', 'category', 'quantity', 'notes', 'explanation']
    
    def _create_evaluation_span(self, metric_name: str, input_source: str, input_type: str, 
                                extracted_count: int) -> trace.Span:
        """Create a span for evaluation metric"""
        span = tracer.start_span(f"listify-agent.evaluation.{metric_name}", kind=trace.SpanKind.INTERNAL)
        
        # Set OpenInference attributes for evaluation spans
        span.set_attribute("openinference.span.kind", "EVALUATOR")
        span.set_attribute("evaluator.metric_name", metric_name)
        span.set_attribute("evaluator.input_type", input_type)
        span.set_attribute("evaluator.items_count", extracted_count)
        span.set_attribute("evaluator.input_preview", input_source[:200])
        span.set_attribute("evaluator.model", self.model)
        span.set_attribute("evaluator.threshold", self.threshold)
        
        return span
    
    def _record_evaluation_result(self, span: trace.Span, result: EvaluationResult, metric_name: str):
        """Record evaluation result as span attributes"""
        span.set_attribute("evaluator.score", result.score)
        span.set_attribute("evaluator.passed", result.passed)
        span.set_attribute("evaluator.confidence", result.confidence)
        span.set_attribute("evaluator.explanation", result.explanation[:500])  # Truncate for size
        
        # Add detailed metrics
        if result.details:
            for key, value in result.details.items():
                if isinstance(value, (str, int, float, bool)):
                    span.set_attribute(f"evaluator.{key}", value)
                elif isinstance(value, dict):
                    span.set_attribute(f"evaluator.{key}", json.dumps(value)[:500])
                elif isinstance(value, list):
                    span.set_attribute(f"evaluator.{key}", json.dumps(value)[:500])
        
        # Set span status based on result
        if result.passed:
            span.set_status(Status(StatusCode.OK, f"{metric_name} passed with score {result.score:.2f}"))
        else:
            span.set_status(Status(StatusCode.ERROR, f"{metric_name} failed with score {result.score:.2f}"))
        
        span.end()
    
    def evaluate_extraction_accuracy(
        self, 
        input_source: str,
        input_type: str,
        extracted_items: List[Dict[str, Any]],
        expected_items: Optional[List[str]] = None,
        parent_span: Optional[trace.Span] = None
    ) -> EvaluationResult:
        """Evaluate extraction accuracy with tracing"""
        
        # Create evaluation span
        with self._create_evaluation_span("extraction_accuracy", input_source, input_type, len(extracted_items)) as span:
            if parent_span:
                span.set_parent(parent_span)
            
            # Import the base evaluator
            from evaluations.listify_evaluators import ListifyEvaluator
            
            # Run evaluation
            base_evaluator = ListifyEvaluator(model=self.model, threshold=self.threshold)
            result = base_evaluator.evaluate_extraction_accuracy(
                input_source, input_type, extracted_items, expected_items
            )
            
            # Record result in span
            self._record_evaluation_result(span, result, "extraction_accuracy")
            
            return result
    
    def evaluate_structure_compliance(
        self,
        extracted_items: List[Dict[str, Any]],
        parent_span: Optional[trace.Span] = None
    ) -> EvaluationResult:
        """Evaluate structure compliance with tracing"""
        
        # Create evaluation span
        with self._create_evaluation_span("structure_compliance", "N/A", "structure", len(extracted_items)) as span:
            if parent_span:
                span.set_parent(parent_span)
            
            # Import and run evaluation
            from evaluations.listify_evaluators import ListifyEvaluator
            
            base_evaluator = ListifyEvaluator(model=self.model, threshold=self.threshold)
            result = base_evaluator.evaluate_structure_compliance(extracted_items)
            
            # Record result in span
            self._record_evaluation_result(span, result, "structure_compliance")
            
            return result
    
    def evaluate_content_quality(
        self,
        input_source: str,
        input_type: str,
        extracted_items: List[Dict[str, Any]],
        parent_span: Optional[trace.Span] = None
    ) -> EvaluationResult:
        """Evaluate content quality with tracing"""
        
        # Create evaluation span
        with self._create_evaluation_span("content_quality", input_source, input_type, len(extracted_items)) as span:
            if parent_span:
                span.set_parent(parent_span)
            
            # Import and run evaluation
            from evaluations.listify_evaluators import ListifyEvaluator
            
            base_evaluator = ListifyEvaluator(model=self.model, threshold=self.threshold)
            result = base_evaluator.evaluate_content_quality(input_source, input_type, extracted_items)
            
            # Record result in span
            self._record_evaluation_result(span, result, "content_quality")
            
            return result
    
    def evaluate_all(
        self,
        input_source: str,
        input_type: str,
        extracted_items: List[Dict[str, Any]],
        expected_items: Optional[List[str]] = None,
        parent_span: Optional[trace.Span] = None
    ) -> Dict[str, EvaluationResult]:
        """Run all evaluations with tracing"""
        
        # Create parent span for all evaluations
        with tracer.start_span("listify-agent.evaluation.all_metrics", kind=trace.SpanKind.INTERNAL) as all_metrics_span:
            if parent_span:
                all_metrics_span.set_parent(parent_span)
            
            all_metrics_span.set_attribute("openinference.span.kind", "EVALUATOR")
            all_metrics_span.set_attribute("evaluator.input_type", input_type)
            all_metrics_span.set_attribute("evaluator.items_count", len(extracted_items))
            all_metrics_span.set_attribute("evaluator.input_preview", input_source[:200])
            
            # Run individual evaluations
            results = {
                'extraction_accuracy': self.evaluate_extraction_accuracy(
                    input_source, input_type, extracted_items, expected_items, all_metrics_span
                ),
                'structure_compliance': self.evaluate_structure_compliance(extracted_items, all_metrics_span),
                'content_quality': self.evaluate_content_quality(input_source, input_type, extracted_items, all_metrics_span)
            }
            
            # Calculate overall score
            weights = {
                'extraction_accuracy': 0.4,
                'structure_compliance': 0.3,
                'content_quality': 0.3
            }
            
            overall_score = sum(results[key].score * weights[key] for key in weights)
            all_passed = all(r.passed for r in results.values())
            
            # Create overall result
            from evaluations.listify_evaluators import EvaluationResult as BaseEvaluationResult
            results['overall'] = BaseEvaluationResult(
                score=overall_score,
                passed=all_passed,
                confidence=sum(r.confidence for r in results.values()) / len(results),
                explanation=f"Overall score: {overall_score:.2f} (weighted average)",
                details={
                    'weighted_scores': {
                        key: results[key].score * weights[key]
                        for key in weights
                    },
                    'all_passed': all_passed
                }
            )
            
            # Record overall metrics in span
            all_metrics_span.set_attribute("evaluator.overall.score", overall_score)
            all_metrics_span.set_attribute("evaluator.overall.passed", all_passed)
            all_metrics_span.set_attribute("evaluator.extraction_accuracy.score", results['extraction_accuracy'].score)
            all_metrics_span.set_attribute("evaluator.structure_compliance.score", results['structure_compliance'].score)
            all_metrics_span.set_attribute("evaluator.content_quality.score", results['content_quality'].score)
            
            if all_passed:
                all_metrics_span.set_status(Status(StatusCode.OK, f"All evaluations passed. Overall: {overall_score:.2f}"))
            else:
                all_metrics_span.set_status(Status(StatusCode.ERROR, f"Some evaluations failed. Overall: {overall_score:.2f}"))
            
            return results


# Convenience function with tracing
def evaluate_all_with_tracing(
    input_source: str,
    input_type: str,
    extracted_items: List[Dict[str, Any]],
    expected_items: Optional[List[str]] = None,
    threshold: float = 0.7
) -> Dict[str, EvaluationResult]:
    """Convenience function to run all evaluations with tracing"""
    evaluator = ListifyEvaluatorWithTracing(threshold=threshold)
    return evaluator.evaluate_all(input_source, input_type, extracted_items, expected_items)

