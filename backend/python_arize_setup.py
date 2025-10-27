"""
Python-based Arize Tracing Configuration
Following the exact pattern from Arize dashboard setup
"""

import os
from dotenv import load_dotenv
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.instrumentation.requests import RequestsInstrumentor

# Load environment variables
load_dotenv()

# Arize configuration from environment variables
ARIZE_SPACE_ID = os.getenv('ARIZE_SPACE_ID', 'U3BhY2U6MzA1ODc6NU1udA==')
ARIZE_API_KEY = os.getenv('ARIZE_API_KEY', 'YOUR_API_KEY')
ARIZE_PROJECT_NAME = os.getenv('ARIZE_PROJECT_NAME', 'listify-agent')

def initialize_python_arize_tracing():
    """
    Initialize Python-based Arize tracing following the dashboard example
    This should be called BEFORE any code execution
    """
    try:
        print("🐍 Initializing Python-based Arize tracing...")
        print(f"📊 Space ID: {ARIZE_SPACE_ID}")
        print(f"🏷️  Project: {ARIZE_PROJECT_NAME}")
        
        # Create resource with project information
        resource = Resource.create({
            "service.name": "python-arize-service",
            "service.version": "1.0.0",
            "deployment.environment": "development",
            "model_id": ARIZE_PROJECT_NAME,
            "arize.project.name": ARIZE_PROJECT_NAME,
            "arize.space_id": ARIZE_SPACE_ID,
        })
        
        # Create tracer provider
        tracer_provider = TracerProvider(resource=resource)
        
        # Create OTLP exporter for Arize
        otlp_exporter = OTLPSpanExporter(
            endpoint="https://otlp.arize.com/v1",
            headers={
                "space_id": ARIZE_SPACE_ID,
                "api_key": ARIZE_API_KEY,
            }
        )
        
        # Add span processor
        span_processor = BatchSpanProcessor(otlp_exporter)
        tracer_provider.add_span_processor(span_processor)
        
        # Set the global tracer provider
        trace.set_tracer_provider(tracer_provider)
        
        # Instrument requests library
        RequestsInstrumentor().instrument()
        
        print("✅ Python-based Arize tracing initialized successfully")
        print("📡 Sending traces to Arize using OpenTelemetry OTLP exporter")
        
        return tracer_provider
        
    except Exception as error:
        print(f"❌ Failed to initialize Python-based Arize tracing: {error}")
        return None

def test_python_tracing():
    """
    Test the Python-based tracing with a simple operation
    """
    try:
        from opentelemetry import trace
        
        # Get the tracer
        tracer = trace.get_tracer(__name__)
        
        # Create a test span
        with tracer.start_as_current_span("python-test-operation") as span:
            span.set_attribute("test.type", "python_arize_integration")
            span.set_attribute("test.framework", "arize-otel")
            span.set_attribute("test.language", "python")
            
            # Simulate some work
            result = "Python-based Arize tracing is working!"
            span.set_attribute("test.result", result)
            
            print(f"✅ {result}")
            return result
            
    except Exception as error:
        print(f"❌ Python tracing test failed: {error}")
        return None

if __name__ == "__main__":
    # Initialize Python-based Arize tracing
    tracer_provider = initialize_python_arize_tracing()
    
    if tracer_provider:
        # Test the tracing
        test_python_tracing()
        print("\n🎯 Python-based Arize tracing setup complete!")
        print("📊 Check your Arize dashboard for Python traces")
        print("🔗 Direct link: https://app.arize.com/")
    else:
        print("❌ Failed to initialize Python-based Arize tracing")
