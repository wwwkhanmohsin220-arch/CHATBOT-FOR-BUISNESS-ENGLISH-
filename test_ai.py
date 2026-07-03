import os
import asyncio
import sys
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"

from dotenv import load_dotenv
from backend.services.llm_service import LLMService
from backend.services.rag_service import RAGService

# Load environment variables from the .env file
load_dotenv()

async def main():
    print("Initializing Services...")
    try:
        llm = LLMService()
        rag = RAGService()
    except Exception as e:
        print(f"Failed to initialize: {e}")
        return

    # 1. Embed the sample document into ChromaDB
    sample_doc_path = "backend/services/sample_curriculum.txt"
    if os.path.exists(sample_doc_path):
        rag.embed_document(sample_doc_path)
    else:
        print(f"Warning: Could not find {sample_doc_path}")

    # 2. Test prompt
    test_prompt = "I wants to schedules a meeting with you for tommorow."
    
    print(f"\nUser Input: '{test_prompt}'")
    print("-" * 50)
    
    # 3. Retrieve relevant context from ChromaDB
    print("Retrieving context from ChromaDB...")
    context = rag.retrieve_context(test_prompt)
    if context:
        print(f"Context found:\n{context}\n")
    else:
        print("No context found.\n")

    print("Waiting for Gemini response (STREAMING)...\n")
    print("Bot Response: ", end="", flush=True)
    
    try:
        # 4. Stream response from LLM using the async generator
        async for chunk in llm.generate_response_stream(test_prompt, rag_context=context):
            print(chunk, end="", flush=True)
        print("\n\n[Stream Complete]")
    except Exception as e:
        print(f"\n[ERROR] Failed to generate stream: {e}")

if __name__ == "__main__":
    asyncio.run(main())
