from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.core.config import get_settings
from app.data.states import STATES
from app.models.schemas import ImprovedScenarioRequest, SimulationRequest
from app.services.analysis_service import (
    compare_improved_scenario,
    detect_critical_state,
    generate_recommendation,
)
from app.services.matrix_service import (
    build_count_matrix,
    build_enriched_routes,
    build_probability_matrix,
    matrix_response,
    row_probability_checks,
    top_probability_transitions,
    top_transitions_from_counts,
)
from app.services.simulation_service import simulate_many_users, summarize_simulation

router = APIRouter(prefix="/api", tags=["Colombia Comparte Simulator"])


@router.get("/health")
def health() -> dict:
    settings = get_settings()
    return {"status": "ok", "app": settings.app_name, "environment": settings.env}


@router.get("/states")
def get_states() -> list[dict]:
    return STATES


@router.get("/routes")
def get_routes() -> list[dict]:
    return build_enriched_routes()


@router.get("/matrix/counts")
def get_count_matrix() -> dict:
    counts = build_count_matrix()
    return {
        **matrix_response(counts),
        "top_transitions": top_transitions_from_counts(counts),
    }


@router.get("/matrix/probabilities")
def get_probability_matrix() -> dict:
    counts = build_count_matrix()
    probabilities = build_probability_matrix(counts)
    risk_targets = {"S93", "S98", "S100", "S101", "S106", "S108", "S110", "S114"}
    return {
        **matrix_response(probabilities, decimals=6),
        "row_checks": row_probability_checks(probabilities),
        "top_abandonment_error_probabilities": top_probability_transitions(
            probabilities,
            target_states=risk_targets,
        ),
    }


@router.post("/simulate")
def simulate(request: SimulationRequest) -> dict:
    probabilities = build_probability_matrix()
    try:
        simulation = simulate_many_users(
            num_users=request.num_users,
            probability_matrix=probabilities,
            initial_state=request.initial_state,
            max_steps=request.max_steps,
            seed=request.seed,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    critical = detect_critical_state(probabilities, simulation)
    return {
        "simulation": simulation,
        "summary": summarize_simulation(simulation),
        "critical_state": critical,
        "recommendation": generate_recommendation(critical["state"]),
    }


@router.get("/analysis/critical-state")
def get_critical_state() -> dict:
    probabilities = build_probability_matrix()
    critical = detect_critical_state(probabilities)
    return {
        **critical,
        "recommendation": generate_recommendation(critical["state"]),
    }


@router.post("/analysis/improved-scenario")
def improved_scenario(request: ImprovedScenarioRequest) -> dict:
    probabilities = build_probability_matrix()
    try:
        return compare_improved_scenario(
            probability_matrix=probabilities,
            num_users=request.num_users,
            max_steps=request.max_steps,
            initial_state=request.initial_state,
            abandonment_reduction=request.abandonment_reduction,
            target_state=request.target_state,
            seed=request.seed,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
