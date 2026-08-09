from fastapi import APIRouter
from pydantic import BaseModel
from typing import List


router = APIRouter(
    prefix="/api",
    tags=["Route Score"]
)


class RouteSegment(BaseModel):
    sensory_level: str
    crowd_level: str


class RouteScoreRequest(BaseModel):
    segments: List[RouteSegment]


@router.post("/route-score")
def calculate_route_score(request: RouteScoreRequest):
    level_score = {
        "low": 1,
        "medium": 2,
        "high": 3
    }

    sensory_scores = [
        level_score.get(segment.sensory_level.lower(), 0)
        for segment in request.segments
    ]

    crowd_scores = [
        level_score.get(segment.crowd_level.lower(), 0)
        for segment in request.segments
    ]

    if not request.segments:
        return {
            "sensory_score": 0,
            "crowd_score": 0,
            "overall_score": 0
        }

    sensory_score = sum(sensory_scores) / len(sensory_scores)
    crowd_score = sum(crowd_scores) / len(crowd_scores)

    overall_score = (sensory_score + crowd_score) / 2

    return {
        "sensory_score": round(sensory_score, 2),
        "crowd_score": round(crowd_score, 2),
        "overall_score": round(overall_score, 2)
    }