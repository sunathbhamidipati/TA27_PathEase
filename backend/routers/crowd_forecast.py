from fastapi import APIRouter
from pydantic import BaseModel
from typing import List


router = APIRouter(
    prefix="/api",
    tags=["Crowd Forecast"]
)


class CrowdForecast(BaseModel):
    hour: int
    crowd_level: str
    crowd_score: float


@router.get("/crowd-forecast", response_model=List[CrowdForecast])
def get_crowd_forecast():
    return [
        CrowdForecast(
            hour=1,
            crowd_level="Low",
            crowd_score=1.2
        ),
        CrowdForecast(
            hour=2,
            crowd_level="Medium",
            crowd_score=2.0
        ),
        CrowdForecast(
            hour=3,
            crowd_level="High",
            crowd_score=2.8
        )
    ]