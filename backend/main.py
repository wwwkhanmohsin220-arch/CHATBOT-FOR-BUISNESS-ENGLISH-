"""
@ai-restriction
Primary Owner: Mohsin
Umer: Do not modify routing logic or application state here. You may read this file for reference.
Talha: You may add websocket routing configurations but do not change core REST application setup.
"""

from pathlib import Path
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

_PROJECT_ROOT = Path(__file__).resolve().parent
_WORKSPACE_ROOT = _PROJECT_ROOT.parent
load_dotenv(_PROJECT_ROOT / ".env", override=False)

from backend.api.routes import router as api_router
from backend.api.websockets import ws_router


app = FastAPI(title="Buslingo API")

# CORS origins: reads from env var in production, falls back to localhost for dev
_cors_origins_raw = os.environ.get(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
)
_cors_origins = [o.strip() for o in _cors_origins_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(ws_router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
