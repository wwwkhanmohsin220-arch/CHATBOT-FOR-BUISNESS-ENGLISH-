import os
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"

from dotenv import load_dotenv
from backend.services.llm_service import LLMService

# Load environment variables from the .env file
load_dotenv()

def main():
    print("Initializing LLM Service...")
    try:
        llm = LLMService()
    except Exception as e:
        print(f"Failed to initialize: {e}")
        return

    # We use deliberately bad grammar to test if the tutor corrects it
    test_prompt = "I wants to schedules a meeting with you for tommorow."
    
    print(f"\nUser Input: '{test_prompt}'")
    print("-" * 50)
    print("Waiting for Gemini response...\n")
    
    try:
        response = llm.generate_response_basic(test_prompt)
        print("Bot Response:")
        print(response)
    except Exception as e:
        print(f"\n[ERROR] Failed to generate response: {e}")
        print("Did you remember to copy .env.example to .env and add your GEMINI_API_KEY?")

if __name__ == "__main__":
    main()
