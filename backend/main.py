"""
@ai-restriction
Primary Owner: Talha
Umer: Do not modify routing logic or application state here. You may read this file for reference.
Mohsin: You may add websocket routing configurations but do not change core REST application setup.
"""

from fastapi import FastAPI

app = FastAPI(title="Buslingo API")

@app.get("/health")
def health_check():
    return {"status": "ok"}
