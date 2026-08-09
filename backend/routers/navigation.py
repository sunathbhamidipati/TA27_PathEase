from fastapi import APIRouter
from pydantic import BaseModel


router = APIRouter(
    prefix="/api",
    tags=["Navigation"]
)


class NavigationRequest(BaseModel):
    route_name: str
    current_step: int
    distance_remaining: int


class NavigationResponse(BaseModel):
    route_name: str
    current_step: int
    instruction: str
    distance_remaining: int
    arrived: bool


@router.post("/navigation", response_model=NavigationResponse)
def get_navigation(request: NavigationRequest):
    if request.distance_remaining <= 0:
        return NavigationResponse(
            route_name=request.route_name,
            current_step=request.current_step,
            instruction="You have arrived at your destination.",
            distance_remaining=0,
            arrived=True
        )

    instructions = [
        "Continue straight.",
        "Turn left at the next intersection.",
        "Continue for 200 metres.",
        "Turn right and follow the quieter path."
    ]

    instruction_index = request.current_step % len(instructions)

    return NavigationResponse(
        route_name=request.route_name,
        current_step=request.current_step,
        instruction=instructions[instruction_index],
        distance_remaining=request.distance_remaining,
        arrived=False
    )