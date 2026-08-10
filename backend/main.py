import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Unlocks the API for our localhost and Vercel frontend
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        # DISTINCT ON (t.sensor_id) grabs only the single most recent reading for EVERY sensor
        query = text("""
            SELECT DISTINCT ON (t.sensor_id)
                s.street_name, s.latitude, s.longitude, t.pedestrian_count, t.timestamp 
            FROM traffic_reading t
            JOIN location_sensor s ON t.sensor_id = s.sensor_id
            ORDER BY t.sensor_id, t.timestamp DESC
        """)
        results = conn.execute(query).mappings().all()
        
        enriched_data = []
        
        for row in results:
            data_dict = dict(row)
            count = data_dict["pedestrian_count"]
            
            # LOWER THRESHOLDS: Adjusted for minute-by-minute traffic rather than hourly
            if count < 15:
                data_dict["traffic_level"] = "Low"
                data_dict["marker_color"] = "Green"
            elif count <= 40:
                data_dict["traffic_level"] = "Medium"
                data_dict["marker_color"] = "Yellow"
            else:
                data_dict["traffic_level"] = "High"
                data_dict["marker_color"] = "Red"
                
            enriched_data.append(data_dict)
            
        return enriched_data
    
@app.get("/api/forecast")
def get_forecast(target_time: str):
    with engine.connect() as conn:
        # We pass the user's future timestamp into PostgreSQL to extract the target Day and Hour
        query = text("""
            SELECT 
                s.street_name, 
                s.latitude, 
                s.longitude, 
                t.sensor_id,
                ROUND(AVG(t.pedestrian_count)) AS predicted_volume
            FROM 
                traffic_reading t
            JOIN 
                location_sensor s ON t.sensor_id = s.sensor_id
            WHERE 
                EXTRACT(DOW FROM t.timestamp) = EXTRACT(DOW FROM CAST(:target_time AS TIMESTAMP))
                AND EXTRACT(HOUR FROM t.timestamp) = EXTRACT(HOUR FROM CAST(:target_time AS TIMESTAMP))
            GROUP BY 
                t.sensor_id, s.street_name, s.latitude, s.longitude
        """)
        
        # Execute the query and bind the target_time parameter safely
        results = conn.execute(query, {"target_time": target_time}).mappings().all()
        
        enriched_forecast = []
        
        # Apply the exact same threshold logic to the predicted volume
        for row in results:
            data_dict = dict(row)
            count = data_dict["predicted_volume"]
            
            # If a sensor has no historical data for that hour, default to 0
            if count is None:
                count = 0
                data_dict["predicted_volume"] = 0
                
            if count < 100:
                data_dict["predicted_level"] = "Low"
                data_dict["marker_color"] = "Green"
            elif count <= 500:
                data_dict["predicted_level"] = "Medium"
                data_dict["marker_color"] = "Yellow"
            else:
                data_dict["predicted_level"] = "High"
                data_dict["marker_color"] = "Red"
                
            enriched_forecast.append(data_dict)
            
        return enriched_forecast