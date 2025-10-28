#!/usr/bin/env python3
"""
Simple test script following ai-trip-planner pattern
Tests basic Arize tracing functionality
"""

# Override with YOUR exact API key for testing
import os
os.environ["ARIZE_SPACE_ID"] = "U3BhY2U6MzA1ODc6NU1udA=="
os.environ["ARIZE_API_KEY"] = "ak-2d8257ec-0246-4df5-9fb9-009ceb997e04-VLQ1Yb5btSnOYEy7wiFlJxrR_aKlnO0M"

# Import Arize setup (exactly like ai-trip-planner)
from arize_setup import tp, _TRACING

import openai
from opentelemetry import trace

def test_basic_tracing():
    """Test basic tracing functionality"""
    print("🔍 Testing Basic Arize Tracing...")
    print("=" * 50)
    
    if not _TRACING:
        print("⚠️  Tracing disabled - packages not available")
        return
    
    if not tp:
        print("⚠️  Tracer provider not initialized - check credentials")
        return
    
    print("✅ Tracing initialized successfully")
    
    # Test basic span creation
    tracer = trace.get_tracer(__name__)
    with tracer.start_as_current_span("test_basic_span") as span:
        span.set_attribute("test.type", "basic")
        span.set_attribute("test.message", "Testing basic span creation")
        print("✅ Basic span created")
    
    # Test OpenAI call if API key is available
    if os.getenv("OPENAI_API_KEY"):
        try:
            client = openai.OpenAI()
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "Say hello"}],
                max_tokens=10
            )
            print(f"✅ OpenAI call successful: {response.choices[0].message.content}")
        except Exception as e:
            print(f"❌ OpenAI call failed: {e}")
    else:
        print("⚠️  OPENAI_API_KEY not set - skipping OpenAI test")
    
    print("✅ Basic tracing test completed!")

if __name__ == "__main__":
    test_basic_tracing()
