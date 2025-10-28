# Load environment variables from .env file FIRST
import os
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())

# Apply LiteLLM fix: set correct headers before importing arize modules
# This fixes the StatusCode.INTERNAL error by using space_id instead of space_key
space_id = os.getenv("ARIZE_SPACE_ID")
api_key = os.getenv("ARIZE_API_KEY")

# Minimal observability via Arize/OpenInference (optional)
try:
    from arize.otel import register
    from openinference.instrumentation.langchain import LangChainInstrumentor
    from openinference.instrumentation.litellm import LiteLLMInstrumentor
    from openinference.instrumentation import using_prompt_template, using_metadata, using_attributes
    from opentelemetry import trace
    _TRACING = True
except Exception:
    def using_prompt_template(**kwargs):  # type: ignore
        from contextlib import contextmanager
        @contextmanager
        def _noop():
            yield
        return _noop()
    def using_metadata(*args, **kwargs):  # type: ignore
        from contextlib import contextmanager
        @contextmanager
        def _noop():
            yield
        return _noop()
    def using_attributes(*args, **kwargs):  # type: ignore
        from contextlib import contextmanager
        @contextmanager
        def _noop():
            yield
        return _noop()
    _TRACING = False

# Initialize tracing once at startup, not per request
tp = None
if _TRACING:
    try:
        if space_id and api_key:
            # Use arize.otel.register first
            tp = register(space_id=space_id, api_key=api_key, project_name="listify-agent")
            
            # Then override with our LiteLLM fix headers
            os.environ["OTEL_EXPORTER_OTLP_TRACES_HEADERS"] = f"api_key={api_key},space_id={space_id}"
            os.environ["OTEL_EXPORTER_OTLP_TRACES_ENDPOINT"] = "https://otlp.arize.com/v1/traces"
            
            LangChainInstrumentor().instrument(tracer_provider=tp, include_chains=True, include_agents=True, include_tools=True)
            LiteLLMInstrumentor().instrument(tracer_provider=tp, skip_dep_check=True)
    except Exception:
        pass