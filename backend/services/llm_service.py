# TODO (Person 1 - AI): Implement LLM integration with streaming responses
# Manage system prompts, call Gemini/OpenAI API, and stream token chunks.

import os
from google import genai

class LLMService:
    def __init__(self):
        # We read the API key from the environment
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("WARNING: GEMINI_API_KEY not found in environment variables.")
        
        # The new Google GenAI SDK
        self.client = genai.Client(api_key=api_key)
        self.model_id = 'gemini-2.5-flash'
        
    def generate_response_basic(self, prompt: str) -> str:
        """A simple, non-streaming call to verify Gemini is working."""
        
        system_instruction = (
            "You are a strict but encouraging Business English tutor. "
            "Correct any grammar mistakes the user makes and provide professional alternatives."
        )
        
        response = self.client.models.generate_content(
            model=self.model_id,
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                system_instruction=system_instruction
            )
        )
        
        return response.text
        
    async def generate_response_stream(self, prompt, context, history):
        # TODO: We will implement streaming in the next feature step!
        pass
