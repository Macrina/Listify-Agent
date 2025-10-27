#!/usr/bin/env python3

"""
Test script to verify Python Arize integration
This script tests the Python Arize tracing setup
"""

import os
import sys
import time
from datetime import datetime

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_arize_setup():
    """Test the Arize setup module"""
    print("🧪 Testing Python Arize Integration...")
    
    try:
        # Import Arize setup
        print("1. Importing Arize setup...")
        from arize_setup import tracer_provider
        
        if tracer_provider:
            print("✅ Arize setup imported successfully")
            return True
        else:
            print("❌ Arize setup failed - no tracer provider")
            return False
            
    except ImportError as e:
        print(f"❌ Failed to import Arize setup: {e}")
        return False
    except Exception as e:
        print(f"❌ Error importing Arize setup: {e}")
        return False

def test_listify_service():
    """Test the Listify service with tracing"""
    print("2. Testing Listify service...")
    
    try:
        # Import the service
        from listify_service import ListifyAgentService
        
        # Create service instance
        service = ListifyAgentService()
        print("✅ Listify service created successfully")
        
        # Test text analysis
        print("3. Testing text analysis with tracing...")
        sample_text = """
        Shopping List:
        - Milk (2 gallons)
        - Bread (1 loaf, whole wheat)
        - Eggs (1 dozen)
        - Apples (5, red)
        - Chicken breast (1.5 lbs)
        """
        
        try:
            extracted_items = service.analyze_text(sample_text)
            print(f"✅ Text analysis completed - extracted {len(extracted_items)} items")
            
            if extracted_items:
                print("📝 Sample extracted items:")
                for item in extracted_items[:3]:
                    print(f"   - {item['item_name']} ({item['category']})")
            
            return True
            
        except Exception as e:
            print(f"❌ Text analysis failed: {e}")
            return False
            
    except ImportError as e:
        print(f"❌ Failed to import Listify service: {e}")
        return False
    except Exception as e:
        print(f"❌ Error testing Listify service: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 Starting Python Arize Integration Tests")
    print("=" * 50)
    
    # Check environment
    if not os.getenv('OPENAI_API_KEY'):
        print("⚠️  OPENAI_API_KEY not set - some tests may fail")
    
    # Run tests
    tests_passed = 0
    total_tests = 2
    
    if test_arize_setup():
        tests_passed += 1
        print("✅ Test 1 passed: Arize setup")
    else:
        print("❌ Test 1 failed: Arize setup")
    
    if test_listify_service():
        tests_passed += 1
        print("✅ Test 2 passed: Listify service")
    else:
        print("❌ Test 2 failed: Listify service")
    
    print("=" * 50)
    print(f"📊 Test Results: {tests_passed}/{total_tests} tests passed")
    
    if tests_passed == total_tests:
        print("🎉 All Python Arize integration tests passed!")
        print("📊 Check your Arize dashboard for traces with names:")
        print("   - listify-agent.text-analysis")
        print("   - openai.text.completion")
    else:
        print("❌ Some tests failed - check the errors above")
        return False
    
    # Wait for traces to be exported
    print("⏳ Waiting 5 seconds for traces to be exported...")
    time.sleep(5)
    print("✅ Test completed - traces should appear in Arize dashboard")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
