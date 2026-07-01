# TODO (Person 2 - Backend): Scaffold FastAPI app and mount endpoints
# Initialize FastAPI app, set up CORS middleware, include API router.
from fastapi import FastAPI

app = FastAPI(title="Business English Tutor API")

@app.get("/health")
async def health_check():
    return {"status": "ok"}
