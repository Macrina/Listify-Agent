#!/usr/bin/env python3
"""
LLM Evaluation Test Runner for Listify Agent
===========================================

This script runs LLM evaluation tests and generates reports for CI/CD integration.
"""

import os
import json
import sys
import time
from datetime import datetime
from typing import Dict, List, Any
import subprocess
import requests
from dotenv import load_dotenv

load_dotenv()

class LLMEvaluationRunner:
    """Main runner class for LLM evaluation tests"""
    
    def __init__(self):
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "tests": [],
            "summary": {
                "total_tests": 0,
                "passed": 0,
                "failed": 0,
                "skipped": 0,
                "average_score": 0.0
            }
        }
        self.api_available = self._check_api_availability()
    
    def _check_api_availability(self) -> bool:
        """Check if the Listify Agent API is available"""
        try:
            response = requests.get('http://localhost:3001/api/health', timeout=5)
            return response.status_code == 200
        except requests.exceptions.RequestException:
            return False
    
    def run_basic_tests(self):
        """Run basic LLM evaluation tests"""
        print("🧪 Running Basic LLM Evaluation Tests...")
        
        try:
            result = subprocess.run([
                sys.executable, 
                "test_llm_evaluations.py"
            ], capture_output=True, text=True, timeout=300)
            
            self._parse_test_results("basic", result)
            
        except subprocess.TimeoutExpired:
            self._add_test_result("basic", "timeout", 0.0, "Test execution timed out")
        except Exception as e:
            self._add_test_result("basic", "error", 0.0, f"Test execution failed: {str(e)}")
    
    def run_advanced_tests(self):
        """Run advanced LLM evaluation tests with actual API"""
        if not self.api_available:
            print("⚠️  API not available, skipping advanced tests")
            self._add_test_result("advanced", "skipped", 0.0, "API not available")
            return
        
        print("🧪 Running Advanced LLM Evaluation Tests...")
        
        try:
            result = subprocess.run([
                sys.executable, 
                "test_advanced_llm_evaluations.py"
            ], capture_output=True, text=True, timeout=300)
            
            self._parse_test_results("advanced", result)
            
        except subprocess.TimeoutExpired:
            self._add_test_result("advanced", "timeout", 0.0, "Test execution timed out")
        except Exception as e:
            self._add_test_result("advanced", "error", 0.0, f"Test execution failed: {str(e)}")
    
    def run_pytest_tests(self):
        """Run tests using pytest framework"""
        print("🧪 Running Pytest LLM Evaluation Tests...")
        
        try:
            result = subprocess.run([
                sys.executable, "-m", "pytest", 
                "test_llm_evaluations.py", 
                "test_advanced_llm_evaluations.py",
                "-v", "--tb=short"
            ], capture_output=True, text=True, timeout=300)
            
            self._parse_pytest_results(result)
            
        except subprocess.TimeoutExpired:
            self._add_test_result("pytest", "timeout", 0.0, "Pytest execution timed out")
        except Exception as e:
            self._add_test_result("pytest", "error", 0.0, f"Pytest execution failed: {str(e)}")
    
    def _parse_test_results(self, test_type: str, result: subprocess.CompletedProcess):
        """Parse test results from subprocess output"""
        if result.returncode == 0:
            # Extract scores from output
            scores = self._extract_scores_from_output(result.stdout)
            avg_score = sum(scores) / len(scores) if scores else 0.0
            
            self._add_test_result(
                test_type, 
                "passed", 
                avg_score, 
                f"All tests passed. Average score: {avg_score:.2f}"
            )
        else:
            self._add_test_result(
                test_type, 
                "failed", 
                0.0, 
                f"Tests failed. Error: {result.stderr}"
            )
    
    def _parse_pytest_results(self, result: subprocess.CompletedProcess):
        """Parse pytest results"""
        if result.returncode == 0:
            self._add_test_result("pytest", "passed", 1.0, "All pytest tests passed")
        else:
            self._add_test_result("pytest", "failed", 0.0, f"Pytest tests failed: {result.stderr}")
    
    def _extract_scores_from_output(self, output: str) -> List[float]:
        """Extract scores from test output"""
        scores = []
        lines = output.split('\n')
        
        for line in lines:
            if "Score:" in line:
                try:
                    # Extract score from lines like "Correctness Score: 0.85"
                    score_str = line.split("Score:")[1].strip()
                    score = float(score_str)
                    scores.append(score)
                except (IndexError, ValueError):
                    continue
        
        return scores
    
    def _add_test_result(self, test_name: str, status: str, score: float, message: str):
        """Add a test result to the results dictionary"""
        test_result = {
            "name": test_name,
            "status": status,
            "score": score,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        
        self.results["tests"].append(test_result)
        self.results["summary"]["total_tests"] += 1
        
        if status == "passed":
            self.results["summary"]["passed"] += 1
        elif status == "failed":
            self.results["summary"]["failed"] += 1
        elif status == "skipped":
            self.results["summary"]["skipped"] += 1
    
    def generate_report(self):
        """Generate evaluation report"""
        # Calculate average score
        scores = [test["score"] for test in self.results["tests"] if test["score"] > 0]
        if scores:
            self.results["summary"]["average_score"] = sum(scores) / len(scores)
        
        # Generate console report
        print("\n" + "="*60)
        print("📊 LLM EVALUATION REPORT")
        print("="*60)
        print(f"Timestamp: {self.results['timestamp']}")
        print(f"API Available: {'✅ Yes' if self.api_available else '❌ No'}")
        print(f"Total Tests: {self.results['summary']['total_tests']}")
        print(f"Passed: {self.results['summary']['passed']}")
        print(f"Failed: {self.results['summary']['failed']}")
        print(f"Skipped: {self.results['summary']['skipped']}")
        print(f"Average Score: {self.results['summary']['average_score']:.2f}")
        
        print("\n📋 Test Details:")
        for test in self.results["tests"]:
            status_emoji = "✅" if test["status"] == "passed" else "❌" if test["status"] == "failed" else "⏭️"
            print(f"  {status_emoji} {test['name']}: {test['status']} (Score: {test['score']:.2f})")
            print(f"     {test['message']}")
        
        # Save report to file
        report_file = f"llm_evaluation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n📄 Report saved to: {report_file}")
        
        return self.results
    
    def run_all_tests(self):
        """Run all LLM evaluation tests"""
        print("🚀 Starting LLM Evaluation Test Suite")
        print("="*50)
        
        start_time = time.time()
        
        # Run different test suites
        self.run_basic_tests()
        self.run_advanced_tests()
        self.run_pytest_tests()
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        print(f"\n⏱️  Total execution time: {execution_time:.2f} seconds")
        
        # Generate final report
        results = self.generate_report()
        
        # Return appropriate exit code
        if results["summary"]["failed"] > 0:
            print("\n❌ Some tests failed!")
            return 1
        elif results["summary"]["passed"] == 0:
            print("\n⚠️  No tests passed!")
            return 2
        else:
            print("\n✅ All tests completed successfully!")
            return 0

def main():
    """Main entry point"""
    runner = LLMEvaluationRunner()
    exit_code = runner.run_all_tests()
    sys.exit(exit_code)

if __name__ == "__main__":
    main()
