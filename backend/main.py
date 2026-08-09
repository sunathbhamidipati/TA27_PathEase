from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"status": "PathEase Backend is live"}