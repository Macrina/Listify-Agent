"""
Arize Tracing Setup for Listify Agent
This module initializes Arize tracing using arize.otel.register
"""

from arize.otel import register

# Initialize Arize tracing using arize.otel.register
tracer_provider = register(
    space_id="U3BhY2U6MzA1ODc6NU1udA==",  # in app space settings page
    api_key="ak-2d8257ec-0246-4df5-9fb9-009ceb997e04-VLQ1Yb5btSnOYEy7wiFlJxrR_aKlnO0M",  # in app space settings page
    project_name="listify-agent",
)

print("✅ Arize tracing initialized successfully")
print(f"📊 Project: listify-agent")
print(f"🔑 Space ID: U3BhY2U6MzA1ODc6NU1udA==")
print(f"🔑 API Key: ak-2d8257ec-0246-4df5-9fb9-009ceb997e04-VLQ1Yb5btSnOYEy7wiFlJxrR_aKlnO0M")