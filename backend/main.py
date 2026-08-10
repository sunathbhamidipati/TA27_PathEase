import os
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Import the ML functions from your teammate's script
from ml_predictor import get_model, count_to_level, FEATURE_COLUMNS

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
    # 1. Parse the requested time
    target_datetime = pd.to_datetime(target_time)
    
    # 2. Get all static sensor locations from your database
    with engine.connect() as conn:
        sensors = conn.execute(text("""
            SELECT sensor_id, latitude, longitude, street_name 
            FROM location_sensor
        """)).mappings().all()
        
    # 3. Build a batch Pandas DataFrame for the ML model
    input_data = []
    for s in sensors:
        input_data.append({
            "Location_ID": s["sensor_id"],
            "HourDay": target_datetime.hour,
            "day_of_week": target_datetime.dayofweek,
            "is_weekend": 1 if target_datetime.dayofweek >= 5 else 0,
            "month": target_datetime.month,
        })
        
    df_input = pd.DataFrame(input_data)
    
    # 4. Load the pre-trained model and predict ALL locations instantly
    model = get_model()
    predicted_counts = model.predict(df_input[FEATURE_COLUMNS])
    
    # 5. Package the results for the frontend map
    results = []
    for i, s in enumerate(sensors):
        count = predicted_counts[i]
        level = count_to_level(count)
        
        # Attach the map marker colors based on the teammate's thresholds
        if level == "Low":
            color = "Green"
        elif level == "Medium":
            color = "Yellow"
        else:
            color = "Red"
            
        results.append({
            "sensor_id": s["sensor_id"],
            "street_name": s["street_name"],
            "latitude": s["latitude"],
            "longitude": s["longitude"],
            "target_datetime": target_time,
            "predicted_count": round(float(count), 1),
            "predicted_level": level,
            "marker_color": color
        })
        
    return results
