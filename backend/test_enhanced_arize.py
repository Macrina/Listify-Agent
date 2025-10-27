"""
Enhanced test script for Arize tracing with rich trace data
This script creates comprehensive traces with detailed attributes and metadata
"""

# Import Arize setup FIRST before any other imports
from arize_setup import tracer_provider

import time
import json
from datetime import datetime
from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode

# Get tracer
tracer = trace.get_tracer(__name__)

def test_enhanced_arize_tracing():
    """Test function to create rich, detailed traces"""
    
    print("🔍 Testing Enhanced Arize tracing with rich metadata...")
    
    # Test 1: Agent Operation Trace
    with tracer.start_as_current_span("listify-agent.test-operation") as span:
        # Enhanced span attributes
        span.set_attribute("span.kind", "agent")
        span.set_attribute("agent.name", "listify-agent")
        span.set_attribute("agent.version", "1.0.0")
        span.set_attribute("operation.name", "test_operation")
        span.set_attribute("operation.type", "testing")
        span.set_attribute("operation.category", "validation")
        
        # Input/Output simulation
        span.set_attribute("input.type", "test_data")
        span.set_attribute("input.test_id", "enhanced_trace_test_001")
        span.set_attribute("input.timestamp", datetime.now().isoformat())
        
        span.set_attribute("output.success", True)
        span.set_attribute("output.test_result", "passed")
        span.set_attribute("output.duration_ms", 1500)
        
        # Add rich metadata
        span.set_attribute("metadata.environment", "development")
        span.set_attribute("metadata.test_suite", "arize_integration")
        span.set_attribute("metadata.test_version", "2.0.0")
        
        print("✅ Enhanced agent trace created")
        
        # Test 2: LLM Operation Trace
        with tracer.start_as_current_span("openai.test.completion") as llm_span:
            # Enhanced LLM span attributes
            llm_span.set_attribute("span.kind", "llm")
            llm_span.set_attribute("llm.model_name", "gpt-4o")
            llm_span.set_attribute("llm.provider", "openai")
            llm_span.set_attribute("llm.task", "test_completion")
            llm_span.set_attribute("llm.temperature", 0.2)
            llm_span.set_attribute("llm.max_tokens", 1000)
            
            # Simulate LLM metrics
            llm_span.set_attribute("llm.token_count.prompt", 150)
            llm_span.set_attribute("llm.token_count.completion", 75)
            llm_span.set_attribute("llm.token_count.total", 225)
            llm_span.set_attribute("llm.response_length", 300)
            llm_span.set_attribute("llm.finish_reason", "stop")
            
            # Input/Output data
            llm_span.set_attribute("input.prompt", "Test prompt for enhanced tracing")
            llm_span.set_attribute("output.response", "Test response with enhanced metadata")
            llm_span.set_attribute("output.summary", "LLM test completion successful")
            
            print("✅ Enhanced LLM trace created")
            
            # Simulate processing time
            time.sleep(0.5)
            
            llm_span.set_attribute("output.success", True)
            llm_span.set_attribute("output.latency_ms", 500)
        
        # Test 3: Tool Operation Trace
        with tracer.start_as_current_span("listify-agent.tool.extraction") as tool_span:
            # Enhanced tool span attributes
            tool_span.set_attribute("span.kind", "tool")
            tool_span.set_attribute("tool.name", "list_extractor")
            tool_span.set_attribute("tool.version", "1.0.0")
            tool_span.set_attribute("tool.category", "ai_processing")
            
            # Tool-specific attributes
            tool_span.set_attribute("tool.input_type", "text")
            tool_span.set_attribute("tool.output_type", "structured_list")
            tool_span.set_attribute("tool.confidence", 0.95)
            
            # Input/Output data
            tool_span.set_attribute("input.data", "Sample text for list extraction")
            tool_span.set_attribute("output.items_extracted", 3)
            tool_span.set_attribute("output.categories", json.dumps(["groceries", "tasks", "other"]))
            tool_span.set_attribute("output.summary", "Successfully extracted 3 items from text")
            
            print("✅ Enhanced tool trace created")
            
            # Simulate processing time
            time.sleep(0.3)
            
            tool_span.set_attribute("output.success", True)
            tool_span.set_attribute("output.processing_time_ms", 300)
        
        # Final attributes
        span.set_attribute("output.total_operations", 3)
        span.set_attribute("output.all_successful", True)
        span.set_attribute("output.total_duration_ms", 2000)
    
    print("✅ Enhanced test traces completed")
    print("📊 Check your Arize dashboard for rich trace data!")
    print("   🔍 Project: listify-agent")
    print("   🔍 Span Names: listify-agent.test-operation, openai.test.completion, listify-agent.tool.extraction")
    print("   🔍 Rich Attributes: span.kind, agent.name, llm.model_name, tool.name")
    print("   🔍 Input/Output Data: Available in trace details")
    print("   🔍 Time Range: Last 5 minutes")

def test_image_analysis_trace():
    """Test function to simulate image analysis with rich tracing"""
    
    print("\n🖼️ Testing Image Analysis Trace...")
    
    with tracer.start_as_current_span("listify-agent.image-analysis") as span:
        # Enhanced span attributes
        span.set_attribute("span.kind", "agent")
        span.set_attribute("agent.name", "listify-agent")
        span.set_attribute("agent.version", "1.0.0")
        span.set_attribute("operation.name", "analyze_image")
        span.set_attribute("operation.type", "image_analysis")
        span.set_attribute("operation.category", "ai_vision")
        
        # Simulate image input
        span.set_attribute("input.type", "image")
        span.set_attribute("input.mime_type", "image/jpeg")
        span.set_attribute("input.image_size_bytes", 2048576)  # 2MB
        span.set_attribute("input.image_size_mb", 2.0)
        span.set_attribute("input.format", "jpeg")
        span.set_attribute("input.summary", "Image analysis request: image/jpeg, 2048576 bytes")
        
        # Model info
        span.set_attribute("llm.model_name", "gpt-4o")
        span.set_attribute("llm.provider", "openai")
        span.set_attribute("llm.task", "vision_analysis")
        
        # Simulate LLM call
        with tracer.start_as_current_span("openai.vision.completion") as llm_span:
            llm_span.set_attribute("span.kind", "llm")
            llm_span.set_attribute("llm.model_name", "gpt-4o")
            llm_span.set_attribute("llm.provider", "openai")
            llm_span.set_attribute("llm.task", "vision_analysis")
            llm_span.set_attribute("llm.temperature", 0.2)
            llm_span.set_attribute("llm.max_tokens", 2000)
            
            # Simulate token usage
            llm_span.set_attribute("llm.token_count.prompt", 500)
            llm_span.set_attribute("llm.token_count.completion", 300)
            llm_span.set_attribute("llm.token_count.total", 800)
            llm_span.set_attribute("llm.response_length", 1200)
            llm_span.set_attribute("llm.finish_reason", "stop")
            
            llm_span.set_attribute("output.summary", "LLM response: 800 tokens, 1200 chars")
            
            time.sleep(1.0)  # Simulate processing time
            
            llm_span.set_attribute("output.success", True)
            llm_span.set_attribute("output.latency_ms", 1000)
        
        # Simulate extracted items
        extracted_items = [
            {"item_name": "Milk", "category": "groceries"},
            {"item_name": "Bread", "category": "groceries"},
            {"item_name": "Eggs", "category": "groceries"}
        ]
        
        # Enhanced output attributes
        span.set_attribute("output.item_count", len(extracted_items))
        span.set_attribute("output.success", True)
        span.set_attribute("output.categories", json.dumps(["groceries"]))
        span.set_attribute("output.total_items", len(extracted_items))
        span.set_attribute("output.summary", f"Successfully extracted {len(extracted_items)} items from image")
        span.set_attribute("output.sample_items", json.dumps([item["item_name"] for item in extracted_items]))
        
        print("✅ Image analysis trace completed with rich metadata")

if __name__ == "__main__":
    print("🚀 Starting Enhanced Arize Tracing Tests...")
    
    # Run enhanced tests
    test_enhanced_arize_tracing()
    test_image_analysis_trace()
    
    print("\n✨ All enhanced tests completed!")
    print("🎯 Check your Arize dashboard for traces with:")
    print("   - Rich span attributes (span.kind, agent.name, llm.model_name)")
    print("   - Input/Output data summaries")
    print("   - Detailed LLM metrics (token counts, response lengths)")
    print("   - Tool operation details")
    print("   - Enhanced error handling and status codes")
