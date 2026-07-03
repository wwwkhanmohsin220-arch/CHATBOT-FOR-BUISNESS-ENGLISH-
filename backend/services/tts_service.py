import os
import json
import asyncio
import websockets

class TTSService:
    def __init__(self):
        self.api_key = os.getenv("ELEVENLABS_API_KEY")
        # Default voice ID (Roger - Premade) that works on free tier
        self.voice_id = "CwhRBWXzGAHq8TQ4Fs17"
        
    async def stream_audio_from_text(self, text_iterator):
        """
        Takes an async generator yielding text chunks (from Gemini),
        streams them to ElevenLabs over WebSockets, and yields base64 audio chunks back.
        """
        if not self.api_key:
            print("[Warning] ELEVENLABS_API_KEY not found. TTS is disabled.")
            return

        uri = f"wss://api.elevenlabs.io/v1/text-to-speech/{self.voice_id}/stream-input?model_id=eleven_multilingual_v2"
        
        async with websockets.connect(uri) as websocket:
            # 1. Send the initial configuration payload
            bos_message = {
                "text": " ",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.8
                },
                "xi_api_key": self.api_key,
            }
            await websocket.send(json.dumps(bos_message))

            # 2. Concurrently read audio while sending text
            async def sender():
                async for chunk in text_iterator:
                    if chunk:
                        await websocket.send(json.dumps({"text": chunk, "try_trigger_generation": True}))
                # Send empty string to indicate end of text
                await websocket.send(json.dumps({"text": ""}))
            
            async def receiver():
                while True:
                    try:
                        response = await websocket.recv()
                        data = json.loads(response)
                        if "error" in data:
                            print(f"[ElevenLabs Error] {data['error']}")
                        if data.get("audio"):
                            yield data["audio"]
                        if data.get("isFinal"):
                            break
                    except websockets.exceptions.ConnectionClosed as e:
                        print(f"[ElevenLabs Closed] {e}")
                        break

            # Run both sender and receiver concurrently
            # Because we want to YIELD from receiver, we can't just asyncio.gather them normally if receiver is a generator.
            # We must schedule sender as a task and await the receiver loop.
            sender_task = asyncio.create_task(sender())
            
            async for audio_chunk in receiver():
                yield audio_chunk
            
            await sender_task
