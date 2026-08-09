from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter(
    prefix="/api",
    tags=["Sensory Load"]
)


class TrafficSegment(BaseModel):
    segment_id: int
    street_name: str
    pedestrian_count: int
    sensory_level: str


class TrafficRequest(BaseModel):
    segments: List[TrafficSegment]


@router.post("/high-load-segments")
def get_high_load_segments(request: TrafficRequest):
    high_load_segments = [
        segment
        for segment in request.segments
        if segment.sensory_level.lower() == "high"
    ]

    return {
        "count": len(high_load_segments),
        "high_load_segments": high_load_segments
    }