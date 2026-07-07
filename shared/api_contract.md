# API Contract (v1)

> **@ai-restriction**
> **Primary Owners:** All (Umer, Talha, Mohsin)
> No AI agent may unilaterally alter these contracts. All changes to payloads, URLs, and websockets must be explicitly requested and acknowledged by the team.

This document defines the interface between the FastAPI backend and the Next.js frontend.

## REST Endpoints

### 1. Curriculum
- **GET** `/api/curriculum`
  - **Description**: Fetch all units and lessons.
  - **Response**:
    ```json
    {
      "units": [
        {
          "id": "u1",
          "title": "Business Greetings",
          "lessons": []
        }
      ]
    }
    ```

### 2. Progress
- **POST** `/api/progress/update`
  - **Description**: Update user's progress and XP.
  - **Payload**:
    ```json
    {
      "user_id": "string",
      "lesson_id": "string",
      "xp_gained": "number"
    }
    ```

## WebSockets

### 1. Voice Practice
- **Endpoint**: `ws://[host]/ws/voice`
- **Client to Server**:
  - Sent as binary (Audio Data) or JSON.
  - `{ "event": "start_session", "lesson_id": "string" }`
- **Server to Client**:
  - `{ "event": "transcript", "text": "string", "is_final": boolean }`
  - `{ "event": "ai_response_audio", "data": "[base64 or binary string]" }`
