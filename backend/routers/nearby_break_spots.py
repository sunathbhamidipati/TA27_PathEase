from fastapi import APIRouter
from pydantic import BaseModel
from typing import List


router = APIRouter(
    prefix="/api",
    tags=["Nearby Break Spots"]
)


class BreakSpot(BaseModel):
    name: str
    spot_type: str
    distance: int
    sensory_level: str
    description: str


@router.get("/nearby-break-spots", response_model=List[BreakSpot])
def get_nearby_break_spots():
    return [
        BreakSpot(
            name="State Library",
            spot_type="Library",
            distance=200,
            sensory_level="Low",
            description="Quiet indoor space suitable for a sensory break."
        ),
        BreakSpot(
            name="City Park",
            spot_type="Park",
            distance=350,
            sensory_level="Low",
            description="Open green space with lower sensory load."
        ),
        BreakSpot(
            name="Quiet Cafe",
            spot_type="Cafe",
            distance=500,
            sensory_level="Medium",
            description="Indoor seating available for a short break."
        )
    ]