import requests

url = "http://127.0.0.1:8000/chat/stream"
payload = {
    "message": "Write a 600-word essay explaining why professional communication is vital in a corporate environment. Go into extreme detail.",
    "session_id": "stream-test-long"
}

# stream=True tells Python to read the network pipe token-by-token
with requests.post(url, json=payload, stream=True) as response:
    for chunk in response.iter_content(chunk_size=None, decode_unicode=True):
        if chunk:
            print(chunk, end="", flush=True)
print()