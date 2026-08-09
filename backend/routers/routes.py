from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter(
    prefix="/api",
    tags=["Routes"]
)


class RouteRequest(BaseModel):
    start_location: str
    destination: str


class RouteOption(BaseModel):
    route_type: str
    travel_time: int
    distance: float
    sensory_level: str
    recommended: bool


@router.post("/routes", response_model=List[RouteOption])
def get_route_options(request: RouteRequest):
    routes = [
        RouteOption(
            route_type="Quietest",
            travel_time=24,
            distance=1.8,
            sensory_level="Low",
            recommended=True
        ),
        RouteOption(
            route_type="Balanced",
            travel_time=20,
            distance=1.6,
            sensory_level="Medium",
            recommended=False
        ),
        RouteOption(
            route_type="Fastest",
            travel_time=16,
            distance=1.4,
            sensory_level="High",
            recommended=False
        )
    ]

    return routes