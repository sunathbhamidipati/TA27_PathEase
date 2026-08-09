import os
from fastapi import FastAPI
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# 1. Connect to the Database
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    DATABASE_URL, 
    connect_args={"sslmode": "require"},
    pool_pre_ping=True
)

app = FastAPI()

@app.get("/")
def read_root():
    return {"status": "PathEase Backend is live"}

# --- NEW API ROUTES ---

@app.get("/api/sensors")
def get_sensors():
    with engine.connect() as conn:
        # Fetch all sensor locations
        query = text("SELECT * FROM location_sensor")
        # .mappings().all() turns the SQL rows into a list of dictionaries for JSON
        result = conn.execute(query).mappings().all()
        return result

@app.get("/api/refuges")
def get_refuges():
    with engine.connect() as conn:
        # Fetch all quiet/safe zones
        query = text("SELECT * FROM refuge_space")
        result = conn.execute(query).mappings().all()
        return result

@app.get("/api/traffic")
def get_traffic():
    with engine.connect() as conn:
        # Join the traffic data with the sensor locations to get the street names.
        # We use LIMIT 100 so we don't crash the browser trying to load 90,000 minute-by-minute rows!
        query = text("""
            SELECT s.street_name, s.latitude, s.longitude, t.pedestrian_count, t.sensory_indicator, t.timestamp 
            FROM traffic_reading t
            JOIN location_sensor s ON t.sensor_id = s.sensor_id
            ORDER BY t.timestamp DESC
            LIMIT 100
        """)
        result = conn.execute(query).mappings().all()
        return result