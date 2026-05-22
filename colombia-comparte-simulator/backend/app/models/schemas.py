from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class StateSchema(BaseModel):
    code: str
    name: str
    description: str
    type: str
    module: str


class RouteSchema(BaseModel):
    id: str
    states: list[str]
    description: str
    coded_route: str
    translated_route: str
    final_state: str
    final_state_name: str
    result: str
    steps: int


class SimulationRequest(BaseModel):
    num_users: int = Field(default=1000, ge=1, le=50000)
    max_steps: int = Field(default=20, ge=2, le=200)
    initial_state: str = Field(default="S1")
    seed: int | None = Field(default=None)


class ImprovedScenarioRequest(SimulationRequest):
    abandonment_reduction: float = Field(default=0.2, ge=0, le=1)
    target_state: str | None = Field(default=None)


class ApiMessage(BaseModel):
    status: str
    app: str
    environment: str


class GenericResponse(BaseModel):
    data: Any
