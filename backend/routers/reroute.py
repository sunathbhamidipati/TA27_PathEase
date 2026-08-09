from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional


router = APIRouter(
    prefix="/api",
    tags=["Reroute"]
)


class RerouteRequest(BaseModel):
    current_route: str
    crowd_level: str
    sensory_level: str


class RerouteResponse(BaseModel):
    reroute_needed: bool
    message: str
    alternative_route: Optional[str] = None


@router.post("/reroute", response_model=RerouteResponse)
def reroute(request: RerouteRequest):
    crowd_high = request.crowd_level.lower() == "high"
    sensory_high = request.sensory_level.lower() == "high"

    if crowd_high or sensory_high:
        return RerouteResponse(
            reroute_needed=True,
            message="High crowd or sensory load detected ahead.",
            alternative_route="Quietest Path"
        )

    return RerouteResponse(
        reroute_needed=False,
        message="Current route is still suitable.",
        alternative_route=None
    )