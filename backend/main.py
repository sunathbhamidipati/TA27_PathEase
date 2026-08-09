from fastapi import FastAPI
from routers.high_load import router as high_load_router

app = FastAPI(
    title="PathEase Backend API",
    version="1.0.0"
)

app.include_router(high_load_router)


@app.get("/")
def read_root():
    return {"status": "PathEase Backend is live"}