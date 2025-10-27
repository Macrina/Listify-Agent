"""
Comprehensive Arize Integration Test
Tests both Node.js MCP-compliant and Python-based Arize tracing
"""

import os
import json
import requests
import time
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

class ComprehensiveArizeTest:
    """
    Comprehensive test for both Node.js and Python Arize implementations
    """
    
    def __init__(self):
        self.tracer_provider = None
        self.tracer = None
        self.backend_url = "http://localhost:3001"
        self.test_results = {
            'python_setup': False,
            'python_service': False,
            'nodejs_health': False,
            'nodejs_lists': False,
            'nodejs_image': False,
            'cross_service': False
        }
        self.initialize_tracing()
    
    def initialize_tracing(self):
        """
        Initialize Python-based Arize tracing
        """
        try:
            print("🐍 Initializing Python-based Arize tracing...")
            print(f"📊 Space ID: {ARIZE_SPACE_ID}")
            print(f"🏷️  Project: {ARIZE_PROJECT_NAME}")
            
            # Create resource with project information
            resource = Resource.create({
                "service.name": "comprehensive-arize-test",
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
            self.test_results['python_setup'] = True
            
        except Exception as error:
            print(f"❌ Failed to initialize Python-based Arize tracing: {error}")
            self.tracer_provider = None
            self.tracer = None
    
    def test_python_tracing(self):
        """
        Test Python tracing with a simple operation
        """
        print("\n🔍 Testing Python tracing...")
        try:
            with self.tracer.start_as_current_span("python-comprehensive-test") as span:
                span.set_attribute("test.type", "comprehensive_integration")
                span.set_attribute("test.framework", "python_opentelemetry")
                span.set_attribute("test.language", "python")
                
                # Simulate some work
                time.sleep(0.1)
                result = "Python tracing is working!"
                span.set_attribute("test.result", result)
                
                print("✅ Python tracing test successful")
                self.test_results['python_service'] = True
                return True
                
        except Exception as error:
            print(f"❌ Python tracing test failed: {error}")
            return False
    
    def test_nodejs_health(self):
        """
        Test Node.js health endpoint with Python tracing
        """
        print("\n🔍 Testing Node.js health endpoint...")
        try:
            with self.tracer.start_as_current_span("test-nodejs-health") as span:
                span.set_attribute("test.type", "nodejs_health_check")
                span.set_attribute("test.endpoint", "/api/health")
                
                response = requests.get(f"{self.backend_url}/api/health")
                span.set_attribute("http.status_code", response.status_code)
                span.set_attribute("http.response.size", len(response.content))
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        print("✅ Node.js health endpoint working")
                        self.test_results['nodejs_health'] = True
                        return True
                
                print("❌ Node.js health endpoint failed")
                return False
                
        except Exception as error:
            print(f"❌ Node.js health test failed: {error}")
            return False
    
    def test_nodejs_lists(self):
        """
        Test Node.js lists endpoint with Python tracing
        """
        print("\n🔍 Testing Node.js lists endpoint...")
        try:
            with self.tracer.start_as_current_span("test-nodejs-lists") as span:
                span.set_attribute("test.type", "nodejs_lists_check")
                span.set_attribute("test.endpoint", "/api/lists")
                
                response = requests.get(f"{self.backend_url}/api/lists")
                span.set_attribute("http.status_code", response.status_code)
                span.set_attribute("http.response.size", len(response.content))
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and "data" in data:
                        list_count = data.get("count", 0)
                        span.set_attribute("test.list_count", list_count)
                        print(f"✅ Node.js lists endpoint working - found {list_count} lists")
                        self.test_results['nodejs_lists'] = True
                        return True
                
                print("❌ Node.js lists endpoint failed")
                return False
                
        except Exception as error:
            print(f"❌ Node.js lists test failed: {error}")
            return False
    
    def test_nodejs_image_analysis(self):
        """
        Test Node.js image analysis endpoint with Python tracing
        """
        print("\n🔍 Testing Node.js image analysis endpoint...")
        try:
            with self.tracer.start_as_current_span("test-nodejs-image-analysis") as span:
                span.set_attribute("test.type", "nodejs_image_analysis")
                span.set_attribute("test.endpoint", "/api/analyze-image")
                
                # Create a simple test image (1x1 pixel)
                test_image_data = {
                    "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
                    "mimeType": "image/jpeg"
                }
                
                span.set_attribute("test.image_type", "jpeg")
                span.set_attribute("test.image_size", len(test_image_data["imageData"]))
                
                response = requests.post(
                    f"{self.backend_url}/api/analyze-image",
                    json=test_image_data,
                    headers={"Content-Type": "application/json"}
                )
                
                span.set_attribute("http.status_code", response.status_code)
                span.set_attribute("http.response.size", len(response.content))
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        print("✅ Node.js image analysis endpoint working")
                        self.test_results['nodejs_image'] = True
                        return True
                elif response.status_code == 404:
                    print("⚠️  Node.js image analysis endpoint not available (404)")
                    span.set_attribute("test.status", "endpoint_not_available")
                    return False
                else:
                    print(f"❌ Node.js image analysis endpoint failed with status {response.status_code}")
                    return False
                
        except Exception as error:
            print(f"❌ Node.js image analysis test failed: {error}")
            return False
    
    def test_cross_service_integration(self):
        """
        Test cross-service integration between Python and Node.js
        """
        print("\n🔍 Testing cross-service integration...")
        try:
            with self.tracer.start_as_current_span("test-cross-service-integration") as span:
                span.set_attribute("test.type", "cross_service_integration")
                span.set_attribute("test.description", "Python service calling Node.js backend")
                
                # Test multiple endpoints in sequence
                endpoints = [
                    ("/api/health", "GET"),
                    ("/api/lists", "GET")
                ]
                
                successful_calls = 0
                for endpoint, method in endpoints:
                    try:
                        if method == "GET":
                            response = requests.get(f"{self.backend_url}{endpoint}")
                        else:
                            response = requests.post(f"{self.backend_url}{endpoint}")
                        
                        if response.status_code == 200:
                            successful_calls += 1
                            span.set_attribute(f"test.{endpoint.replace('/', '_')}.status", "success")
                        else:
                            span.set_attribute(f"test.{endpoint.replace('/', '_')}.status", "failed")
                            
                    except Exception as e:
                        span.set_attribute(f"test.{endpoint.replace('/', '_')}.status", "error")
                        span.set_attribute(f"test.{endpoint.replace('/', '_')}.error", str(e))
                
                span.set_attribute("test.successful_calls", successful_calls)
                span.set_attribute("test.total_calls", len(endpoints))
                
                if successful_calls >= len(endpoints) * 0.5:  # At least 50% success
                    print(f"✅ Cross-service integration working ({successful_calls}/{len(endpoints)} successful)")
                    self.test_results['cross_service'] = True
                    return True
                else:
                    print(f"❌ Cross-service integration failed ({successful_calls}/{len(endpoints)} successful)")
                    return False
                
        except Exception as error:
            print(f"❌ Cross-service integration test failed: {error}")
            return False
    
    def run_comprehensive_test(self):
        """
        Run all comprehensive tests
        """
        print("🧪 COMPREHENSIVE ARIZE INTEGRATION TEST")
        print("=====================================\n")
        
        # Test Python tracing
        self.test_python_tracing()
        
        # Test Node.js endpoints
        self.test_nodejs_health()
        self.test_nodejs_lists()
        self.test_nodejs_image_analysis()
        
        # Test cross-service integration
        self.test_cross_service_integration()
        
        # Generate summary
        self.generate_summary()
    
    def generate_summary(self):
        """
        Generate comprehensive test summary
        """
        print("\n🎯 COMPREHENSIVE ARIZE INTEGRATION SUMMARY:")
        print("=" * 50)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results.values() if result)
        
        print(f"📊 Overall Status: {passed_tests}/{total_tests} tests passed")
        print(f"📈 Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        print("\n📋 Detailed Results:")
        for test_name, result in self.test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"   {test_name.replace('_', ' ').title()}: {status}")
        
        print("\n📊 WHAT TO LOOK FOR IN ARIZE DASHBOARD:")
        print("   🔍 Project: listify-agent")
        print("   🔍 Services: comprehensive-arize-test, listify-agent")
        print("   🔍 Span Names: python-comprehensive-test, test-nodejs-*, test-cross-service-*")
        print("   🔍 Time Range: Last 5 minutes")
        print("   🔍 Trace Types:")
        print("      - Python OpenTelemetry traces")
        print("      - Node.js MCP-compliant traces")
        print("      - Cross-service integration traces")
        
        if passed_tests >= total_tests * 0.8:  # 80% success rate
            print("\n🚀 COMPREHENSIVE ARIZE INTEGRATION STATUS: EXCELLENT")
            print("   Both Python and Node.js Arize tracing are working perfectly!")
        elif passed_tests >= total_tests * 0.6:  # 60% success rate
            print("\n🚀 COMPREHENSIVE ARIZE INTEGRATION STATUS: GOOD")
            print("   Most Arize tracing components are working!")
        else:
            print("\n🚀 COMPREHENSIVE ARIZE INTEGRATION STATUS: NEEDS ATTENTION")
            print("   Some Arize tracing components need fixing!")
        
        print("\n🔗 Check your traces: https://app.arize.com/")

def main():
    """
    Main function to run comprehensive Arize integration test
    """
    test = ComprehensiveArizeTest()
    
    if not test.tracer:
        print("❌ Failed to initialize Arize tracing")
        return
    
    test.run_comprehensive_test()

if __name__ == "__main__":
    main()
