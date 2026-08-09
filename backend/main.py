import os

from fastapi import FastAPI
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

from routers.high_load import router as high_load_router
from routers.routes import router as routes_router
from routers.route_score import router as route_score_router

# Load your secret .env file
load_dotenv()

# Get the URL, and fix it if it starts with 'postgres://' (SQLAlchemy requires 'postgresql://')
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Connect to the database with strict SSL requirements
engine = create_engine(
    DATABASE_URL, 
    connect_args={"sslmode": "require"},
    pool_pre_ping=True
)

app = FastAPI(
    title="PathEase Backend API",
    version="1.0.0"
)

app.include_router(high_load_router)
app.include_router(routes_router)
app.include_router(route_score_router)

@app.get("/")
def read_root():
    return {"status": "PathEase Backend is live"}

@app.get("/test-db")
def test_db_connection():
    try:
        with engine.connect() as connection:
            # Try to fetch the current time directly from Vercel Postgres
            result = connection.execute(text("SELECT NOW()")).fetchone()
            return {"status": "Database connection successful!", "db_time": str(result[0])}
    except Exception as e:
        return {"status": "Database connection failed", "error": str(e)}