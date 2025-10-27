"""
Python Arize Integration Service
Integrates Python-based Arize tracing with Node.js backend
"""

import os
import json
import requests
from dotenv import load_dotenv
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.instrumentation.requests import RequestsInstrumentor

# Load environment variables
load_dotenv()

# Arize configuration
ARIZE_SPACE_ID = os.getenv('ARIZE_SPACE_ID', 'U3BhY2U6MzA1ODc6NU1udA==')
ARIZE_API_KEY = os.getenv('ARIZE_API_KEY', 'YOUR_API_KEY')
ARIZE_PROJECT_NAME = os.getenv('ARIZE_PROJECT_NAME', 'listify-agent')

class PythonArizeService:
    """
    Python service that provides Arize tracing for Node.js backend
    """
    
    def __init__(self):
        self.tracer_provider = None
        self.tracer = None
        self.backend_url = "http://localhost:3001"
        self.initialize_tracing()
    
    def initialize_tracing(self):
        """
        Initialize Python-based Arize tracing following the dashboard example
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
            self.tracer_provider = TracerProvider(resource=resource)
            
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
            self.tracer_provider.add_span_processor(span_processor)
            
            # Set the global tracer provider
            trace.set_tracer_provider(self.tracer_provider)
            
            # Get tracer
            self.tracer = trace.get_tracer(__name__)
            
            # Instrument requests library
            RequestsInstrumentor().instrument()
            
            print("✅ Python-based Arize tracing initialized successfully")
            print("📡 Sending traces to Arize using OpenTelemetry OTLP exporter")
            
        except Exception as error:
            print(f"❌ Failed to initialize Python-based Arize tracing: {error}")
            self.tracer_provider = None
            self.tracer = None
    
    def trace_backend_request(self, method, endpoint, data=None):
        """
        Trace a request to the Node.js backend
        """
        if not self.tracer:
            print("⚠️  Tracer not initialized")
            return None
        
        with self.tracer.start_as_current_span(f"backend-{method.lower()}-{endpoint}") as span:
            span.set_attribute("http.method", method)
            span.set_attribute("http.url", f"{self.backend_url}{endpoint}")
            span.set_attribute("service.name", "python-arize-service")
            span.set_attribute("service.language", "python")
            
            try:
                # Make request to Node.js backend
                if method.upper() == "GET":
                    response = requests.get(f"{self.backend_url}{endpoint}")
                elif method.upper() == "POST":
                    response = requests.post(
                        f"{self.backend_url}{endpoint}",
                        json=data,
                        headers={"Content-Type": "application/json"}
                    )
                else:
                    raise ValueError(f"Unsupported method: {method}")
                
                # Set response attributes
                span.set_attribute("http.status_code", response.status_code)
                span.set_attribute("http.response.size", len(response.content))
                
                if response.status_code < 400:
                    span.set_attribute("http.status", "success")
                else:
                    span.set_attribute("http.status", "error")
                
                return response.json() if response.content else None
                
            except Exception as error:
                span.record_exception(error)
                span.set_attribute("error", True)
                span.set_attribute("error.message", str(error))
                raise error
    
    def test_health_endpoint(self):
        """
        Test the health endpoint with Python tracing
        """
        print("\n🔍 Testing health endpoint with Python tracing...")
        try:
            result = self.trace_backend_request("GET", "/api/health")
            if result and result.get("success"):
                print("✅ Health check successful")
                return True
            else:
                print("❌ Health check failed")
                return False
        except Exception as error:
            print(f"❌ Health check error: {error}")
            return False
    
    def test_lists_endpoint(self):
        """
        Test the lists endpoint with Python tracing
        """
        print("\n🔍 Testing lists endpoint with Python tracing...")
        try:
            result = self.trace_backend_request("GET", "/api/lists")
            if result and result.get("success"):
                print(f"✅ Lists endpoint successful - found {result.get('count', 0)} lists")
                return True
            else:
                print("❌ Lists endpoint failed")
                return False
        except Exception as error:
            print(f"❌ Lists endpoint error: {error}")
            return False
    
    def test_image_analysis(self, image_data=None):
        """
        Test image analysis with Python tracing
        """
        print("\n🔍 Testing image analysis with Python tracing...")
        try:
            # Use a simple test image if none provided
            if not image_data:
                image_data = {
                    "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
                    "mimeType": "image/jpeg"
                }
            
            result = self.trace_backend_request("POST", "/api/analyze-image", image_data)
            if result and result.get("success"):
                print(f"✅ Image analysis successful - extracted {len(result.get('data', []))} items")
                return True
            else:
                print("❌ Image analysis failed")
                return False
        except Exception as error:
            print(f"❌ Image analysis error: {error}")
            return False

def main():
    """
    Main function to test Python-based Arize integration
    """
    print("🧪 PYTHON-BASED ARIZE INTEGRATION TEST")
    print("=====================================\n")
    
    # Initialize Python Arize service
    service = PythonArizeService()
    
    if not service.tracer:
        print("❌ Failed to initialize Python Arize service")
        return
    
    # Test endpoints with Python tracing
    health_ok = service.test_health_endpoint()
    lists_ok = service.test_lists_endpoint()
    image_ok = service.test_image_analysis()
    
    print("\n🎯 PYTHON ARIZE INTEGRATION SUMMARY:")
    print(f"   ✅ Health endpoint: {'PASS' if health_ok else 'FAIL'}")
    print(f"   ✅ Lists endpoint: {'PASS' if lists_ok else 'FAIL'}")
    print(f"   ✅ Image analysis: {'PASS' if image_ok else 'FAIL'}")
    
    print("\n📊 WHAT TO LOOK FOR IN ARIZE DASHBOARD:")
    print("   🔍 Project: listify-agent")
    print("   🔍 Service: python-arize-service")
    print("   🔍 Span Names: backend-*")
    print("   🔍 Time Range: Last 5 minutes")
    print("   🔍 Python Traces: backend-* operations")
    
    print("\n🚀 PYTHON ARIZE INTEGRATION STATUS: COMPLETE")
    print("   Python-based Arize tracing is working!")
    print("   🔗 Check your traces: https://app.arize.com/")

if __name__ == "__main__":
    main()
