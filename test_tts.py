import asyncio
import os
import urllib.request
import urllib.error
from dotenv import load_dotenv

load_dotenv("backend/.env")
api_key = os.getenv("ELEVENLABS_API_KEY")

# Use Rachel
voice_id = "21m00Tcm4TlvDq8ikWAM"
url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream"

request = urllib.request.Request(
    url,
    data=b'{"text": "Hello, this is a test."}',
    headers={
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    },
    method="POST",
)

try:
    with urllib.request.urlopen(request) as response:
        print("Success Rachel! Status:", response.status)
except urllib.error.HTTPError as e:
    print(f"HTTPError: {e.code}")
    print(e.read().decode('utf-8'))
except Exception as e:
    print(f"Error: {e}")
