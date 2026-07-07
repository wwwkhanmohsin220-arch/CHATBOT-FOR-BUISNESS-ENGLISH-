# TODO (Person 2 - Backend): Scaffold FastAPI app and mount endpoints
# Initialize FastAPI app, set up CORS middleware, include API router.
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from .api.routes import router

app = FastAPI(title="Business English Tutor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/health")
async def health_check():
    return {"status": "ok"}
@app.get("/")
async def root():
    return {"message": "Welcome to the Business English Tutor API!"}
