import os
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine

# 1. Connect to the Database
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL, connect_args={"sslmode": "require"})

def import_csv_to_db():
    print("Starting data ingestion...")

    # --- 1. Import Location Sensors ---
    print("Loading Location_Sensor data...")
    sensors_df = pd.read_csv("sensors_clean.csv")
    sensors_mapped = pd.DataFrame({
        "sensor_id": sensors_df["Location_ID"],
        "latitude": sensors_df["Latitude"],
        "longitude": sensors_df["Longitude"],
        "street_name": sensors_df["Sensor_Description"]
    })
    sensors_mapped.to_sql("location_sensor", engine, if_exists="append", index=False)
    print("Sensors loaded successfully!")

    # Store valid IDs to filter the traffic datasets
    valid_sensor_ids = sensors_mapped["sensor_id"].unique()

    # --- 2. Import Refuge Spaces ---
    print("Loading Refuge_Space data...")
    landmarks_df = pd.read_csv("landmarks_clean.csv")
    landmarks_mapped = pd.DataFrame({
        "facility_name": landmarks_df["Feature_Name"],
        "facility_type": landmarks_df["Sub_Theme"],
        "latitude": landmarks_df["Latitude"],
        "longitude": landmarks_df["Longitude"]
    })
    landmarks_mapped.to_sql("refuge_space", engine, if_exists="append", index=False)
    print("Refuge spaces loaded successfully!")

    # --- 3. Import Hourly Traffic Readings ---
    print("Loading Hourly Traffic_Reading data...")
    traffic_df = pd.read_csv("hourly_clean.csv")
    
    # FILTER: Only keep rows where the Location_ID exists in the valid sensors list
    traffic_df = traffic_df[traffic_df["Location_ID"].isin(valid_sensor_ids)]
    
    traffic_df["timestamp"] = pd.to_datetime(traffic_df["Sensing_Date"]) + pd.to_timedelta(traffic_df["HourDay"], unit="h")
    
    traffic_mapped = pd.DataFrame({
        "sensor_id": traffic_df["Location_ID"],
        "timestamp": traffic_df["timestamp"],
        "pedestrian_count": traffic_df["Total_of_Directions"],
        "sensory_indicator": traffic_df["Crows_Density"]
    })
    traffic_mapped.to_sql("traffic_reading", engine, if_exists="append", index=False)
    print("Hourly traffic readings loaded successfully!")

    # --- 4. Import Minute Traffic Readings ---
    print("Loading Minute Traffic_Reading data...")
    minute_df = pd.read_csv("minute_clean.csv")
    
    # FILTER: Only keep rows where the Location_ID exists in the valid sensors list
    minute_df = minute_df[minute_df["Location_ID"].isin(valid_sensor_ids)]
    
    minute_mapped = pd.DataFrame({
        "sensor_id": minute_df["Location_ID"],
        "timestamp": pd.to_datetime(minute_df["Sensing_DateTime"]),
        "pedestrian_count": minute_df["Total_of_Directions"],
        "sensory_indicator": minute_df["Crows_Density"]
    })
    minute_mapped.to_sql("traffic_reading", engine, if_exists="append", index=False)
    print("Minute traffic readings loaded successfully!")

if __name__ == "__main__":
    import_csv_to_db()
    print("All data ingested completely!")