"""
Arize Tracing Setup for Listify Agent
This module initializes Arize tracing before any other code execution
"""

from arize.otel import register

# Initialize Arize tracing BEFORE any other code execution
tracer_provider = register(
    space_id="U3BhY2U6MzA1ODc6NU1udA==",
    api_key="ak-2d8257ec-0246-4df5-9fb9-009ceb997e04-VLQ1Yb5btSnOYEy7wiFlJxrR_aKlnO0M",
    project_name="listify-agent",  # name this to whatever you would like
)

print("✅ Arize tracing initialized successfully")
print(f"📊 Project: listify-agent")
print(f"🔑 Space ID: U3BhY2U6MzA1ODc6NU1udA==")
print(f"🔑 API Key: ak-2d8257ec-0246-4df5-9fb9-009ceb997e04-VLQ1Yb5btSnOYEy7wiFlJxrR_aKlnO0M")
