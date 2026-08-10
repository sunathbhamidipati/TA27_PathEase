from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor


PROJECT_ROOT = Path(__file__).resolve().parents[1]
HOURLY_PATH = "hourly_clean.csv"
MODEL_PATH = Path(__file__).resolve().parent / "artifacts" / "crowd_model.joblib"

FEATURE_COLUMNS = [
    "Location_ID",
    "HourDay",
    "day_of_week",
    "is_weekend",
    "month",
]

_MODEL = None


def load_hourly_data(hourly_path=HOURLY_PATH):
    hourly = pd.read_csv(hourly_path)
    hourly["Sensing_Date"] = pd.to_datetime(hourly["Sensing_Date"])
    hourly["datetime"] = hourly["Sensing_Date"] + pd.to_timedelta(hourly["HourDay"], unit="h")
    return hourly.sort_values(["Location_ID", "datetime"])


def prepare_model_data(hourly):
    model_data = hourly[hourly["Is_Outlier"] == False].copy()
    model_data["day_of_week"] = model_data["datetime"].dt.dayofweek
    model_data["is_weekend"] = model_data["day_of_week"].apply(lambda x: 1 if x >= 5 else 0)
    model_data["month"] = model_data["datetime"].dt.month

    return model_data


def train_model(hourly_path=HOURLY_PATH, model_path=MODEL_PATH):
    hourly = load_hourly_data(hourly_path)
    model_data = prepare_model_data(hourly)

    x = model_data[FEATURE_COLUMNS]
    y = model_data["Total_of_Directions"]

    model = RandomForestRegressor(
        n_estimators=20,
        max_depth=10,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(x, y)

    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, model_path)

    return model


def get_model(model_path=MODEL_PATH):
    global _MODEL

    if _MODEL is None:
        if model_path.exists():
            _MODEL = joblib.load(model_path)
        else:
            _MODEL = train_model(model_path=model_path)

    return _MODEL


def count_to_level(count):
    if count <= 50:
        return "Low"
    if count <= 150:
        return "Medium"
    return "High"


def make_prediction_input(location_id, target_datetime):
    target_datetime = pd.to_datetime(target_datetime)

    return pd.DataFrame([{
        "Location_ID": location_id,
        "HourDay": target_datetime.hour,
        "day_of_week": target_datetime.dayofweek,
        "is_weekend": 1 if target_datetime.dayofweek >= 5 else 0,
        "month": target_datetime.month,
    }])


def predict_crowd(location_id, target_datetime):
    model = get_model()
    prediction_input = make_prediction_input(location_id, target_datetime)

    predicted_count = model.predict(prediction_input[FEATURE_COLUMNS])[0]

    return {
        "location_id": int(location_id),
        "target_datetime": str(pd.to_datetime(target_datetime)),
        "predicted_count": round(float(predicted_count), 1),
        "predicted_level": count_to_level(predicted_count),
    }


if __name__ == "__main__":
    train_model()
    example = predict_crowd(location_id=1, target_datetime="2026-11-02 16:00:00")
    print(example)
