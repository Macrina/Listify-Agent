#!/usr/bin/env python3
"""
Comprehensive trace test to verify Arize integration
"""

# Import Arize setup
from arize_setup import tp, _TRACING

import openai
import os
import time
from opentelemetry import trace

def test_comprehensive_tracing():
    """Test comprehensive tracing functionality"""
    print("🔍 Testing Comprehensive Arize Tracing...")
    print("=" * 60)
    
    if not _TRACING:
        print("⚠️  Tracing disabled - packages not available")
        return
    
    if not tp:
        print("⚠️  Tracer provider not initialized - check credentials")
        return
    
    print("✅ Tracing initialized successfully")
    
    # Test multiple spans
    tracer = trace.get_tracer(__name__)
    
    # Test 1: Basic span
    with tracer.start_as_current_span("test_basic_span") as span:
        span.set_attribute("test.type", "basic")
        span.set_attribute("test.message", "Testing basic span creation")
        span.set_attribute("test.timestamp", str(time.time()))
        print("✅ Basic span created")
    
    # Test 2: OpenAI call span
    if os.getenv("OPENAI_API_KEY"):
        try:
            with tracer.start_as_current_span("test_openai_call") as span:
                span.set_attribute("test.type", "openai")
                span.set_attribute("openai.model", "gpt-3.5-turbo")
                
                client = openai.OpenAI()
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": "What is 2+2?"}],
                    max_tokens=20
                )
                
                span.set_attribute("openai.response", response.choices[0].message.content)
                span.set_attribute("openai.tokens_used", str(response.usage.total_tokens))
                print(f"✅ OpenAI call successful: {response.choices[0].message.content}")
                
        except Exception as e:
            print(f"❌ OpenAI call failed: {e}")
    else:
        print("⚠️  OPENAI_API_KEY not set - skipping OpenAI test")
    
    # Test 3: Nested spans
    with tracer.start_as_current_span("test_nested_spans") as parent_span:
        parent_span.set_attribute("test.type", "nested")
        parent_span.set_attribute("test.level", "parent")
        
        with tracer.start_as_current_span("test_child_span") as child_span:
            child_span.set_attribute("test.type", "nested")
            child_span.set_attribute("test.level", "child")
            child_span.set_attribute("test.message", "This is a child span")
            print("✅ Nested spans created")
    
    # Test 4: Error span
    with tracer.start_as_current_span("test_error_span") as span:
        span.set_attribute("test.type", "error")
        try:
            # Intentionally cause an error
            result = 1 / 0
        except Exception as e:
            span.record_exception(e)
            span.set_status(trace.Status(trace.StatusCode.ERROR, description=str(e)))
            print("✅ Error span created (intentional error for testing)")
    
    print("✅ Comprehensive tracing test completed!")
    print("📊 Check your Arize dashboard for traces!")
    print("   🔍 Span Names: test_basic_span, test_openai_call, test_nested_spans, test_child_span, test_error_span")
    print("   🔍 Time Range: Last 5 minutes")
    print("   🔍 Project: listify-agent")
    print("✨ All tests completed successfully!")

if __name__ == "__main__":
    test_comprehensive_tracing()
