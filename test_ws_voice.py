import asyncio
import base64
import json
from pathlib import Path

import websockets


WS_URL = "ws://127.0.0.1:8000/ws"
OUTPUT_FILE = Path("conversation_reply.mp3")


async def main():
    payload = {
        "action": "send_message",
        "text": "I wants to schedule meeting tomorrow. Please correct me and explain briefly.",
        "session_id": "voice-conversation-test",
    }

    audio_bytes = bytearray()

    async with websockets.connect(WS_URL) as websocket:
        await websocket.send(json.dumps(payload))
        print("Sent message to /ws")
        print("\nText response:\n")

        while True:
            raw_message = await websocket.recv()
            message = json.loads(raw_message)

            if message["type"] == "text_token":
                print(message["content"], end="", flush=True)

            elif message["type"] == "audio_chunk":
                audio_bytes.extend(base64.b64decode(message["audio_base64"]))
                print("\n[received audio chunk]", flush=True)

            elif message["type"] == "done":
                break

    print("\n\nStream complete.")

    if audio_bytes:
        OUTPUT_FILE.write_bytes(audio_bytes)
        print(f"Saved voice reply to {OUTPUT_FILE.resolve()}")
    else:
        print("No audio was received. Check ELEVENLABS_API_KEY and backend logs.")


if __name__ == "__main__":
    asyncio.run(main())
