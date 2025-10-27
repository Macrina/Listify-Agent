"""
Arize Tracing Setup for Listify Agent
This module initializes Arize tracing using OpenTelemetry OTLP exporter
"""

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource

# Initialize Arize tracing using OpenTelemetry OTLP exporter
def initialize_arize_tracing():
    """Initialize Arize tracing with the provided credentials"""
    
    # Create resource with service information
    resource = Resource.create({
        "service.name": "listify-agent",
        "service.version": "1.0.0",
        "model_id": "listify-agent-model",
        "model_version": "v1.0.0",
        "arize.space_id": "U3BhY2U6MzA1ODc6NU1udA==",
        "arize.project.name": "listify-agent",
    })
    
    # Create tracer provider
    tracer_provider = TracerProvider(resource=resource)
    
    # Create OTLP exporter for Arize
    otlp_exporter = OTLPSpanExporter(
        endpoint="https://otlp.arize.com/v1",
        headers={
            "space_id": "U3BhY2U6MzA1ODc6NU1udA==",
            "api_key": "ak-2d8257ec-0246-4df5-9fb9-009ceb997e04-VLQ1Yb5btSnOYEy7wiFlJxrR_aKlnO0M",
        }
    )
    
    # Add span processor
    span_processor = BatchSpanProcessor(otlp_exporter)
    tracer_provider.add_span_processor(span_processor)
    
    # Set the global tracer provider
    trace.set_tracer_provider(tracer_provider)
    
    return tracer_provider

# Initialize tracing
tracer_provider = initialize_arize_tracing()

print("✅ Arize tracing initialized successfully")
print(f"📊 Project: listify-agent")
print(f"🔑 Space ID: U3BhY2U6MzA1ODc6NU1udA==")
print(f"🔑 API Key: ak-2d8257ec-0246-4df5-9fb9-009ceb997e04-VLQ1Yb5btSnOYEy7wiFlJxrR_aKlnO0M")
