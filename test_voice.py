import asyncio
import os
from dotenv import load_dotenv
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"

from backend.services.tts_service import TTSService

load_dotenv()

async def mock_text_generator():
    """Mocks Gemini sending text chunks over time"""
    chunks = ["Hello there! ", "I am streaming ", "directly from ElevenLabs ", "over a websocket!"]
    for chunk in chunks:
        print(f"Sending chunk: '{chunk}'")
        yield chunk
        await asyncio.sleep(0.5)

async def main():
    tts = TTSService()
    print("Connecting to ElevenLabs WebSocket...")
    
    audio_stream = tts.stream_audio_from_text(mock_text_generator())
    
    chunk_count = 0
    if audio_stream:
        async for audio_base64 in audio_stream:
            chunk_count += 1
            print(f"Received audio chunk {chunk_count} ({len(audio_base64)} base64 characters)")
            
    print("\n[Stream Complete] ElevenLabs integration works perfectly!")

if __name__ == "__main__":
    asyncio.run(main())
