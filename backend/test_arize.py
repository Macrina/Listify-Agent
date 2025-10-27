"""
Test script for Arize tracing setup
This script tests the Arize integration and sends sample traces
"""

# Import Arize setup FIRST before any other imports
from arize_setup import tracer_provider

import time
from opentelemetry import trace

# Get tracer
tracer = trace.get_tracer(__name__)

def test_arize_tracing():
    """Test function to create sample traces"""
    
    print("🔍 Testing Arize tracing...")
    
    # Create a test span
    with tracer.start_as_current_span("test_arize_integration") as span:
        span.set_attribute("test.type", "arize_integration_test")
        span.set_attribute("test.timestamp", str(time.time()))
        span.set_attribute("test.environment", "development")
        span.set_attribute("operation.name", "test_arize_tracing")
        span.set_attribute("operation.type", "test")
        
        print("✅ Test span created")
        
        # Simulate some work
        time.sleep(1)
        
        # Create a nested span
        with tracer.start_as_current_span("test_nested_operation") as nested_span:
            nested_span.set_attribute("nested.operation", "test_nested")
            nested_span.set_attribute("nested.value", 42)
            
            print("✅ Nested span created")
            
            # Simulate more work
            time.sleep(0.5)
            
            nested_span.set_attribute("nested.completed", True)
        
        span.set_attribute("test.completed", True)
        span.set_attribute("test.duration", 1.5)
    
    print("✅ Test spans completed")
    print("📊 Check your Arize dashboard for traces!")
    print("   🔍 Project: listify-agent")
    print("   🔍 Span Names: test_arize_integration, test_nested_operation")
    print("   🔍 Time Range: Last 5 minutes")

if __name__ == "__main__":
    print("🚀 Starting Arize tracing test...")
    test_arize_tracing()
    print("✨ Test completed!")
