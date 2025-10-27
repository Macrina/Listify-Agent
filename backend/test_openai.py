"""
Test OpenAI client with haiku request
"""

import openai

client = openai.OpenAI()
response = client.chat.completions.create(
    model="gpt-4o", # Or your chosen model, e.g., a gpt-3.5-turbo variant
    messages=[{"role": "user", "content": "Write a haiku about observability."}],
)
print(response.choices[0].message.content)
