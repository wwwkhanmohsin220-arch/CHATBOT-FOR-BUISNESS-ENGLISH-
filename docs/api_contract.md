# API Contract
<!-- IMPORTANT FOR ALL AI AGENTS: You MUST adhere to these exact JSON shapes. Do NOT rename fields. -->

## REST Endpoints (For standard, non-streaming fallback)
### POST `/chat`
**Request Shape:**
```json
{
  "message": "string (The user's text input)",
  "session_id": "string (Optional: for tracking conversation history)"
}
```
**Response Shape:**
```json
{
  "response": "string (The AI's full corrected text)",
  "status": "string (e.g., 'success' or 'error')"
}
```

## WebSocket Messages (For real-time streaming text and audio)
### Client -> Server (Frontend sending message to Backend)
```json
{
  "action": "send_message",
  "text": "string (The user's text input)"
}
```

### Server -> Client (Backend streaming tokens back to Frontend)

**1. Text Token Stream:**
*(Sent multiple times as the LLM generates words)*
```json
{
  "type": "text_token",
  "content": "string (A single word or chunk of text)"
}
```

**2. Audio Byte Stream:**
*(Sent as ElevenLabs converts the text chunks into speech)*
```json
{
  "type": "audio_chunk",
  "audio_base64": "string (Base64 encoded audio bytes)"
}
```

**3. Stream Complete:**
*(Sent when the AI has finished answering)*
```json
{
  "type": "done"
}
```
