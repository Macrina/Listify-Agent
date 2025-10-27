"""
Enhanced Listify Agent Python Service with Rich Arize Tracing
This service provides image analysis and list management with comprehensive tracing
"""

# Import Arize setup FIRST before any other imports
from arize_setup import tracer_provider

import os
import json
import base64
import re
from datetime import datetime
from typing import List, Dict, Any
from openai import OpenAI
from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode

# Instrument OpenAI client with openinference
from openinference.instrumentation.openai import OpenAIInstrumentor
OpenAIInstrumentor().instrument(tracer_provider=tracer_provider)

# Initialize OpenAI client
openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Get tracer
tracer = trace.get_tracer(__name__)

class ListifyAgentService:
    """Main service class for Listify Agent operations"""
    
    def __init__(self):
        self.tracer = tracer
        print("🚀 Listify Agent Python Service initialized with enhanced Arize tracing")
    
    def analyze_image(self, image_data: bytes, mime_type: str = 'image/jpeg') -> List[Dict[str, Any]]:
        """
        Analyze an image and extract list items using OpenAI Vision
        
        Args:
            image_data: Image bytes
            mime_type: MIME type of the image
            
        Returns:
            List of extracted items
        """
        with self.tracer.start_as_current_span("listify-agent.image-analysis") as span:
            try:
                # Enhanced span attributes for better trace visibility
                span.set_attribute("span.kind", "agent")
                span.set_attribute("agent.name", "listify-agent")
                span.set_attribute("agent.version", "1.0.0")
                span.set_attribute("operation.name", "analyze_image")
                span.set_attribute("operation.type", "image_analysis")
                span.set_attribute("operation.category", "ai_vision")
                
                # Input attributes
                span.set_attribute("input.type", "image")
                span.set_attribute("input.mime_type", mime_type)
                span.set_attribute("input.image_size_bytes", len(image_data))
                span.set_attribute("input.image_size_mb", round(len(image_data) / (1024 * 1024), 2))
                span.set_attribute("input.format", mime_type.split('/')[-1] if '/' in mime_type else 'unknown')
                
                # Model and service info
                span.set_attribute("llm.model_name", "gpt-4o")
                span.set_attribute("llm.provider", "openai")
                span.set_attribute("llm.task", "vision_analysis")
                span.set_attribute("service.name", "listify-agent")
                span.set_attribute("service.version", "1.0.0")
                span.set_attribute("service.environment", os.getenv('NODE_ENV', 'development'))
                
                # Add input data for trace visibility
                span.set_attribute("input.summary", f"Image analysis request: {mime_type}, {len(image_data)} bytes")
                
                print(f"🔍 Starting image analysis - Size: {len(image_data)} bytes, Type: {mime_type}")
                
                # Convert image to base64
                base64_image = base64.b64encode(image_data).decode('utf-8')
                
                # Create the prompt for list extraction
                prompt = """You are an expert at extracting and structuring information from images.

Analyze this image and extract ALL visible list items, tasks, notes, or structured information.

For EACH item you find, provide:
- item_name: The main text/title of the item (required)
- category: Choose the most appropriate category from: groceries, tasks, contacts, events, inventory, ideas, recipes, shopping, bills, other
- quantity: Any number or quantity mentioned (if visible, otherwise null)
- notes: Any additional details, context, or descriptions
- explanation: A short, helpful explanation of what this item is or why it might be useful (1-2 sentences)

Return ONLY a valid JSON array of objects. Each object must have the structure described above.

Example format:
[
  {
    "item_name": "Buy milk",
    "category": "groceries",
    "quantity": "2 gallons",
    "notes": "Prefer organic",
    "explanation": "Essential dairy product for daily nutrition and cooking needs."
  }
]

If no list items are found, return an empty array: []"""

                # Call OpenAI Vision API with enhanced tracing
                with self.tracer.start_as_current_span("openai.vision.completion") as llm_span:
                    # Enhanced LLM span attributes
                    llm_span.set_attribute("span.kind", "llm")
                    llm_span.set_attribute("llm.model_name", "gpt-4o")
                    llm_span.set_attribute("llm.provider", "openai")
                    llm_span.set_attribute("llm.task", "vision_analysis")
                    llm_span.set_attribute("llm.temperature", 0.2)
                    llm_span.set_attribute("llm.max_tokens", 2000)
                    llm_span.set_attribute("llm.response_format", "json_object")
                    
                    # Input/Output attributes
                    llm_span.set_attribute("input.prompt_length", len(prompt))
                    llm_span.set_attribute("input.image_size_bytes", len(image_data))
                    llm_span.set_attribute("input.mime_type", mime_type)
                    
                    response = openai_client.chat.completions.create(
                        model="gpt-4o",
                        messages=[
                            {
                                "role": "user",
                                "content": [
                                    {
                                        "type": "text",
                                        "text": prompt
                                    },
                                    {
                                        "type": "image_url",
                                        "image_url": {
                                            "url": f"data:{mime_type};base64,{base64_image}",
                                            "detail": "high"
                                        }
                                    }
                                ]
                            }
                        ],
                        max_tokens=2000,
                        temperature=0.2,
                    )
                    
                    # Enhanced LLM response attributes
                    llm_span.set_attribute("llm.token_count.prompt", response.usage.prompt_tokens)
                    llm_span.set_attribute("llm.token_count.completion", response.usage.completion_tokens)
                    llm_span.set_attribute("llm.token_count.total", response.usage.total_tokens)
                    llm_span.set_attribute("llm.response_length", len(response.choices[0].message.content))
                    llm_span.set_attribute("llm.finish_reason", response.choices[0].finish_reason)
                    
                    # Add output data for trace visibility
                    llm_span.set_attribute("output.summary", f"LLM response: {response.usage.total_tokens} tokens, {len(response.choices[0].message.content)} chars")
                
                content = response.choices[0].message.content
                print(f"📝 OpenAI response received - Length: {len(content)}")
                
                # Parse the JSON response
                extracted_items = []
                try:
                    # Clean the response to extract JSON
                    json_match = re.search(r'\[[\s\S]*\]', content)
                    if json_match:
                        extracted_items = json.loads(json_match.group(0))
                    else:
                        print("⚠️ No JSON array found, trying to parse entire content")
                        extracted_items = json.loads(content)
                except json.JSONDecodeError as parse_error:
                    print(f"❌ Failed to parse JSON response: {parse_error}")
                    print(f"Raw content: {content}")
                    extracted_items = []
                
                # Validate and clean the extracted items
                valid_items = []
                for item in extracted_items:
                    if item and isinstance(item.get('item_name'), str) and item['item_name'].strip():
                        valid_items.append({
                            'item_name': item['item_name'].strip(),
                            'category': item.get('category', 'other'),
                            'quantity': item.get('quantity'),
                            'notes': item.get('notes'),
                            'explanation': item.get('explanation'),
                            'source_type': 'photo',
                            'metadata': {
                                'analysis_timestamp': datetime.now().isoformat(),
                                'image_type': mime_type,
                                'confidence': 'high'
                            }
                        })
                
                # Enhanced output attributes
                span.set_attribute("output.item_count", len(valid_items))
                span.set_attribute("output.success", True)
                span.set_attribute("output.categories", json.dumps(list(set([item['category'] for item in valid_items]))))
                span.set_attribute("output.total_items", len(valid_items))
                
                # Add output data for trace visibility
                span.set_attribute("output.summary", f"Successfully extracted {len(valid_items)} items from image")
                if valid_items:
                    span.set_attribute("output.sample_items", json.dumps([item['item_name'] for item in valid_items[:3]]))
                
                print(f"✅ Successfully extracted {len(valid_items)} items from image")
                
                return valid_items
                
            except Exception as e:
                # Enhanced error attributes
                span.set_attribute("output.success", False)
                span.set_attribute("error.message", str(e))
                span.set_attribute("error.type", type(e).__name__)
                span.set_attribute("error.stack_trace", str(e))
                span.set_attribute("output.item_count", 0)
                span.set_status(Status(StatusCode.ERROR, str(e)))
                
                print(f"❌ Error in analyze_image: {e}")
                raise e
    
    def analyze_text(self, text: str) -> List[Dict[str, Any]]:
        """
        Analyze text input and extract list items
        
        Args:
            text: Text to analyze
            
        Returns:
            List of extracted items
        """
        with self.tracer.start_as_current_span("listify-agent.text-analysis") as span:
            try:
                # Enhanced span attributes
                span.set_attribute("span.kind", "agent")
                span.set_attribute("agent.name", "listify-agent")
                span.set_attribute("agent.version", "1.0.0")
                span.set_attribute("operation.name", "analyze_text")
                span.set_attribute("operation.type", "text_analysis")
                span.set_attribute("operation.category", "ai_text")
                
                # Input attributes
                span.set_attribute("input.type", "text")
                span.set_attribute("input.text_length", len(text))
                span.set_attribute("input.text_length_words", len(text.split()))
                span.set_attribute("input.text_preview", text[:100] + "..." if len(text) > 100 else text)
                
                # Model and service info
                span.set_attribute("llm.model_name", "gpt-4o")
                span.set_attribute("llm.provider", "openai")
                span.set_attribute("llm.task", "text_analysis")
                span.set_attribute("service.name", "listify-agent")
                span.set_attribute("service.version", "1.0.0")
                span.set_attribute("service.environment", os.getenv('NODE_ENV', 'development'))
                
                # Add input data for trace visibility
                span.set_attribute("input.summary", f"Text analysis request: {len(text)} characters, {len(text.split())} words")
                
                print(f"🔍 Starting text analysis - Length: {len(text)} characters")
                
                prompt = f"""You are an expert at extracting and structuring information from text.

Analyze this text and extract ALL list items, tasks, notes, or structured information.

For EACH item you find, provide:
- item_name: The main text/title of the item (required)
- category: Choose the most appropriate category from: groceries, tasks, contacts, events, inventory, ideas, recipes, shopping, bills, other
- quantity: Any number or quantity mentioned (if visible, otherwise null)
- notes: Any additional details, context, or descriptions
- explanation: A short, helpful explanation of what this item is or why it might be useful (1-2 sentences)

Return ONLY a valid JSON array of objects. Each object must have the structure described above.

Text to analyze:
{text}

If no list items are found, return an empty array: []"""

                # Call OpenAI API with enhanced tracing
                with self.tracer.start_as_current_span("openai.text.completion") as llm_span:
                    # Enhanced LLM span attributes
                    llm_span.set_attribute("span.kind", "llm")
                    llm_span.set_attribute("llm.model_name", "gpt-4o")
                    llm_span.set_attribute("llm.provider", "openai")
                    llm_span.set_attribute("llm.task", "text_analysis")
                    llm_span.set_attribute("llm.temperature", 0.2)
                    llm_span.set_attribute("llm.max_tokens", 2000)
                    
                    # Input attributes
                    llm_span.set_attribute("input.prompt_length", len(prompt))
                    llm_span.set_attribute("input.text_length", len(text))
                    
                    response = openai_client.chat.completions.create(
                        model="gpt-4o",
                        messages=[{"role": "user", "content": prompt}],
                        max_tokens=2000,
                        temperature=0.2,
                    )
                    
                    # Enhanced LLM response attributes
                    llm_span.set_attribute("llm.token_count.prompt", response.usage.prompt_tokens)
                    llm_span.set_attribute("llm.token_count.completion", response.usage.completion_tokens)
                    llm_span.set_attribute("llm.token_count.total", response.usage.total_tokens)
                    llm_span.set_attribute("llm.response_length", len(response.choices[0].message.content))
                    llm_span.set_attribute("llm.finish_reason", response.choices[0].finish_reason)
                    
                    # Add output data for trace visibility
                    llm_span.set_attribute("output.summary", f"LLM response: {response.usage.total_tokens} tokens, {len(response.choices[0].message.content)} chars")
                
                content = response.choices[0].message.content
                print(f"📝 OpenAI response received - Length: {len(content)}")
                
                # Parse the JSON response
                extracted_items = []
                try:
                    json_match = re.search(r'\[[\s\S]*\]', content)
                    if json_match:
                        extracted_items = json.loads(json_match.group(0))
                    else:
                        extracted_items = json.loads(content)
                except json.JSONDecodeError as parse_error:
                    print(f"❌ Failed to parse JSON response: {parse_error}")
                    extracted_items = []
                
                # Validate and clean the extracted items
                valid_items = []
                for item in extracted_items:
                    if item and isinstance(item.get('item_name'), str) and item['item_name'].strip():
                        valid_items.append({
                            'item_name': item['item_name'].strip(),
                            'category': item.get('category', 'other'),
                            'quantity': item.get('quantity'),
                            'notes': item.get('notes'),
                            'explanation': item.get('explanation'),
                            'source_type': 'text',
                            'metadata': {
                                'analysis_timestamp': datetime.now().isoformat(),
                                'text_length': len(text)
                            }
                        })
                
                # Enhanced output attributes
                span.set_attribute("output.item_count", len(valid_items))
                span.set_attribute("output.success", True)
                span.set_attribute("output.categories", json.dumps(list(set([item['category'] for item in valid_items]))))
                span.set_attribute("output.total_items", len(valid_items))
                
                # Add output data for trace visibility
                span.set_attribute("output.summary", f"Successfully extracted {len(valid_items)} items from text")
                if valid_items:
                    span.set_attribute("output.sample_items", json.dumps([item['item_name'] for item in valid_items[:3]]))
                
                print(f"✅ Successfully extracted {len(valid_items)} items from text")
                
                return valid_items
                
            except Exception as e:
                # Enhanced error attributes
                span.set_attribute("output.success", False)
                span.set_attribute("error.message", str(e))
                span.set_attribute("error.type", type(e).__name__)
                span.set_attribute("error.stack_trace", str(e))
                span.set_attribute("output.item_count", 0)
                span.set_status(Status(StatusCode.ERROR, str(e)))
                
                print(f"❌ Error in analyze_text: {e}")
                raise e

def main():
    """Main function to test the enhanced service"""
    print("🚀 Starting Enhanced Listify Agent Python Service with Rich Arize Tracing")
    
    # Initialize service
    service = ListifyAgentService()
    
    # Test with sample text
    sample_text = """
    Shopping List:
    1. Milk - 2 gallons
    2. Bread - whole wheat
    3. Eggs - organic, 1 dozen
    4. Apples - red delicious
    5. Chicken breast - 2 lbs
    """
    
    try:
        print("\n📝 Testing enhanced text analysis...")
        items = service.analyze_text(sample_text)
        print(f"✅ Extracted {len(items)} items:")
        for item in items:
            print(f"  - {item['item_name']} ({item['category']})")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
    
    print("\n✨ Enhanced service test completed!")

if __name__ == "__main__":
    main()
