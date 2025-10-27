"""
LLM-as-Judge Evaluators for Arize Evaluation Framework
Advanced evaluation functions using OpenAI GPT models
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
    score: float
    confidence: float
    explanation: str
    details: Dict[str, Any]

class LLMJudgeEvaluator:
    def __init__(self):
        self.client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.model = "gpt-4o-mini"  # Cost-effective model for evaluations
        
    def evaluate_tone(self, user_query: str, agent_response: str) -> EvaluationResult:
        """
        Evaluate tone appropriateness using LLM-as-judge
        """
        prompt = f"""
        You are an expert evaluator assessing the tone appropriateness of AI agent responses.
        
        User Query: "{user_query}"
        Agent Response: "{agent_response}"
        
        Rate the tone appropriateness on a scale of 1-5:
        5 = Excellent: Professional, helpful, empathetic, clear
        4 = Good: Professional with minor issues
        3 = Average: Adequate but could be better
        2 = Poor: Unprofessional or confusing
        1 = Very Poor: Inappropriate or unhelpful
        
        Consider:
        - Professionalism and politeness
        - Empathy and understanding
        - Clarity and helpfulness
        - Appropriateness for the context
        
        Respond with JSON:
        {{
            "score": <1-5>,
            "confidence": <0.0-1.0>,
            "explanation": "<detailed explanation>",
            "strengths": ["<strength1>", "<strength2>"],
            "weaknesses": ["<weakness1>", "<weakness2>"]
        }}
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=500
            )
            
            result = json.loads(response.choices[0].message.content)
            
            return EvaluationResult(
                score=result["score"],
                confidence=result["confidence"],
                explanation=result["explanation"],
                details={
                    "strengths": result.get("strengths", []),
                    "weaknesses": result.get("weaknesses", [])
                }
            )
            
        except Exception as e:
            logger.error(f"Error in tone evaluation: {e}")
            return EvaluationResult(
                score=3.0,
                confidence=0.0,
                explanation=f"Evaluation failed: {str(e)}",
                details={}
            )
    
    def evaluate_correctness(self, user_query: str, agent_response: str, context: Dict[str, Any] = None) -> EvaluationResult:
        """
        Evaluate response correctness using LLM-as-judge
        """
        context_info = ""
        if context:
            context_info = f"""
            Context Information:
            - Available files: {context.get('codebase_files', [])}
            - Valid commands: {context.get('valid_commands', [])}
            - Valid endpoints: {context.get('valid_endpoints', [])}
            """
        
        prompt = f"""
        You are an expert evaluator assessing the correctness of AI agent responses.
        
        User Query: "{user_query}"
        Agent Response: "{agent_response}"
        {context_info}
        
        Rate the correctness on a scale of 1-5:
        5 = Excellent: 100% accurate, complete, actionable
        4 = Good: Mostly accurate with minor errors
        3 = Average: Generally correct with some issues
        2 = Poor: Multiple errors or incomplete
        1 = Very Poor: Major errors or misleading
        
        Consider:
        - Factual accuracy
        - Completeness of response
        - Actionability of instructions
        - Technical correctness
        - Alignment with available resources
        
        Respond with JSON:
        {{
            "score": <1-5>,
            "confidence": <0.0-1.0>,
            "explanation": "<detailed explanation>",
            "accuracy_issues": ["<issue1>", "<issue2>"],
            "completeness_issues": ["<issue1>", "<issue2>"]
        }}
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=600
            )
            
            result = json.loads(response.choices[0].message.content)
            
            return EvaluationResult(
                score=result["score"],
                confidence=result["confidence"],
                explanation=result["explanation"],
                details={
                    "accuracy_issues": result.get("accuracy_issues", []),
                    "completeness_issues": result.get("completeness_issues", [])
                }
            )
            
        except Exception as e:
            logger.error(f"Error in correctness evaluation: {e}")
            return EvaluationResult(
                score=3.0,
                confidence=0.0,
                explanation=f"Evaluation failed: {str(e)}",
                details={}
            )
    
    def detect_hallucinations(self, agent_response: str, context: Dict[str, Any] = None) -> EvaluationResult:
        """
        Detect hallucinations using LLM-as-judge
        """
        context_info = ""
        if context:
            context_info = f"""
            Available Resources:
            - Files: {context.get('codebase_files', [])}
            - Commands: {context.get('valid_commands', [])}
            - Endpoints: {context.get('valid_endpoints', [])}
            """
        
        prompt = f"""
        You are an expert evaluator detecting hallucinations in AI agent responses.
        
        Agent Response: "{agent_response}"
        {context_info}
        
        Detect if the response contains hallucinations (non-existent files, commands, or features).
        
        Respond with JSON:
        {{
            "has_hallucinations": <true/false>,
            "confidence": <0.0-1.0>,
            "explanation": "<detailed explanation>",
            "hallucinated_items": [
                {{
                    "type": "<file_path|command|endpoint|feature>",
                    "item": "<specific item>",
                    "reason": "<why it's a hallucination>"
                }}
            ]
        }}
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=600
            )
            
            result = json.loads(response.choices[0].message.content)
            
            return EvaluationResult(
                score=0.0 if result["has_hallucinations"] else 1.0,
                confidence=result["confidence"],
                explanation=result["explanation"],
                details={
                    "hallucinated_items": result.get("hallucinated_items", [])
                }
            )
            
        except Exception as e:
            logger.error(f"Error in hallucination detection: {e}")
            return EvaluationResult(
                score=0.0,
                confidence=0.0,
                explanation=f"Evaluation failed: {str(e)}",
                details={}
            )
    
    def evaluate_tool_calling(self, user_query: str, agent_response: str, available_tools: List[str] = None) -> EvaluationResult:
        """
        Evaluate tool calling accuracy using LLM-as-judge
        """
        tools_info = ""
        if available_tools:
            tools_info = f"Available Tools: {available_tools}"
        
        prompt = f"""
        You are an expert evaluator assessing tool calling accuracy in AI agent responses.
        
        User Query: "{user_query}"
        Agent Response: "{agent_response}"
        {tools_info}
        
        Rate the tool calling accuracy on a scale of 1-5:
        5 = Excellent: Perfect tool selection, efficient usage, safe
        4 = Good: Correct tools with minor inefficiencies
        3 = Average: Generally correct tool usage
        2 = Poor: Suboptimal or incorrect tool selection
        1 = Very Poor: Wrong tools or dangerous usage
        
        Consider:
        - Tool selection appropriateness
        - Usage efficiency
        - Safety considerations
        - Parameter correctness
        
        Respond with JSON:
        {{
            "score": <1-5>,
            "confidence": <0.0-1.0>,
            "explanation": "<detailed explanation>",
            "tool_issues": ["<issue1>", "<issue2>"],
            "safety_concerns": ["<concern1>", "<concern2>"]
        }}
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=500
            )
            
            result = json.loads(response.choices[0].message.content)
            
            return EvaluationResult(
                score=result["score"],
                confidence=result["confidence"],
                explanation=result["explanation"],
                details={
                    "tool_issues": result.get("tool_issues", []),
                    "safety_concerns": result.get("safety_concerns", [])
                }
            )
            
        except Exception as e:
            logger.error(f"Error in tool calling evaluation: {e}")
            return EvaluationResult(
                score=3.0,
                confidence=0.0,
                explanation=f"Evaluation failed: {str(e)}",
                details={}
            )

# Convenience functions for easy import
def evaluate_tone(user_query: str, agent_response: str) -> EvaluationResult:
    """Evaluate tone appropriateness"""
    evaluator = LLMJudgeEvaluator()
    return evaluator.evaluate_tone(user_query, agent_response)

def evaluate_correctness(user_query: str, agent_response: str, context: Dict[str, Any] = None) -> EvaluationResult:
    """Evaluate response correctness"""
    evaluator = LLMJudgeEvaluator()
    return evaluator.evaluate_correctness(user_query, agent_response, context)

def detect_hallucinations(agent_response: str, context: Dict[str, Any] = None) -> EvaluationResult:
    """Detect hallucinations in response"""
    evaluator = LLMJudgeEvaluator()
    return evaluator.detect_hallucinations(agent_response, context)

def evaluate_tool_calling(user_query: str, agent_response: str, available_tools: List[str] = None) -> EvaluationResult:
    """Evaluate tool calling accuracy"""
    evaluator = LLMJudgeEvaluator()
    return evaluator.evaluate_tool_calling(user_query, agent_response, available_tools)

# Example usage
if __name__ == "__main__":
    # Test the evaluators
    evaluator = LLMJudgeEvaluator()
    
    # Test tone evaluation
    tone_result = evaluator.evaluate_tone(
        "Help me fix this error",
        "I'll help you troubleshoot this issue step by step. First, let's check the error logs..."
    )
    print(f"Tone Score: {tone_result.score}")
    print(f"Explanation: {tone_result.explanation}")
    
    # Test hallucination detection
    hallucination_result = evaluator.detect_hallucinations(
        "Edit categories.config.js and run npm run update-categories",
        context={
            "codebase_files": ["src/services/imageAnalysisService.js", "src/config/openai.js"],
            "valid_commands": ["npm start", "npm run dev", "npm install"]
        }
    )
    print(f"Has Hallucinations: {hallucination_result.score == 0.0}")
    print(f"Explanation: {hallucination_result.explanation}")
