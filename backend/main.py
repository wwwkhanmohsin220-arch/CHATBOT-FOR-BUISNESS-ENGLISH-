"""
@ai-restriction
Primary Owner: Mohsin
Umer: Do not modify routing logic or application state here. You may read this file for reference.
Talha: You may add websocket routing configurations but do not change core REST application setup.
"""

from fastapi import FastAPI

from backend.api.routes import router as api_router
from backend.api.websockets import ws_router

app = FastAPI(title="Buslingo API")
app.include_router(api_router)
app.include_router(ws_router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
