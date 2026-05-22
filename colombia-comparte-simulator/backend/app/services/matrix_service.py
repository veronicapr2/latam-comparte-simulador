from __future__ import annotations

from collections import Counter
from copy import deepcopy

from app.data.base_routes import BASE_ROUTES
from app.data.states import (
    ABANDONMENT_STATES,
    ERROR_STATES,
    FOLLOW_UP_STATES,
    RESULT_BY_FINAL_STATE,
    STATE_BY_CODE,
    STATE_CODES,
    STATE_NAMES,
)

Matrix = dict[str, dict[str, float]]


def classify_result(final_state: str) -> str:
    return RESULT_BY_FINAL_STATE.get(final_state, "otro/neutro")


def build_enriched_routes() -> list[dict]:
    enriched = []
    for route in BASE_ROUTES:
        states = route["states"]
        final_state = states[-1]
        enriched.append(
            {
                **route,
                "coded_route": " -> ".join(states),
                "translated_route": " -> ".join(STATE_NAMES.get(code, code) for code in states),
                "final_state": final_state,
                "final_state_name": STATE_NAMES.get(final_state, final_state),
                "result": classify_result(final_state),
                "steps": len(states),
            }
        )
    return enriched


def build_count_matrix() -> dict[str, dict[str, int]]:
    matrix = {origin: {target: 0 for target in STATE_CODES} for origin in STATE_CODES}
    for route in BASE_ROUTES:
        sequence = route["states"]
        for origin, target in zip(sequence, sequence[1:]):
            matrix[origin][target] += 1
    return matrix


def build_probability_matrix(count_matrix: dict[str, dict[str, int]] | None = None) -> Matrix:
    counts = count_matrix or build_count_matrix()
    probabilities: Matrix = {}
    for origin, row in counts.items():
        total = sum(row.values())
        probabilities[origin] = {
            target: (count / total if total else 0.0)
            for target, count in row.items()
        }
    return probabilities


def matrix_response(matrix: dict[str, dict[str, float | int]], decimals: int | None = None) -> dict:
    if decimals is not None:
        payload = {
            row: {column: round(float(value), decimals) for column, value in values.items()}
            for row, values in matrix.items()
        }
    else:
        payload = deepcopy(matrix)
    return {"states": STATE_CODES, "matrix": payload}


def top_transitions_from_counts(count_matrix: dict[str, dict[str, int]], top_n: int = 12) -> list[dict]:
    transitions = []
    for origin, row in count_matrix.items():
        for target, count in row.items():
            if count > 0:
                transitions.append(
                    {
                        "from": origin,
                        "from_name": STATE_NAMES.get(origin, origin),
                        "to": target,
                        "to_name": STATE_NAMES.get(target, target),
                        "count": count,
                    }
                )
    return sorted(transitions, key=lambda item: item["count"], reverse=True)[:top_n]


def top_probability_transitions(
    probability_matrix: Matrix,
    target_states: set[str] | None = None,
    top_n: int = 12,
) -> list[dict]:
    transitions = []
    targets = target_states or set(STATE_CODES)
    for origin, row in probability_matrix.items():
        for target, probability in row.items():
            if target in targets and probability > 0:
                transitions.append(
                    {
                        "from": origin,
                        "from_name": STATE_NAMES.get(origin, origin),
                        "to": target,
                        "to_name": STATE_NAMES.get(target, target),
                        "probability": round(probability, 4),
                        "percentage": round(probability * 100, 2),
                    }
                )
    return sorted(transitions, key=lambda item: item["probability"], reverse=True)[:top_n]


def row_probability_checks(probability_matrix: Matrix) -> list[dict]:
    checks = []
    for origin, row in probability_matrix.items():
        total = sum(row.values())
        if total > 0:
            checks.append(
                {
                    "state": origin,
                    "state_name": STATE_NAMES.get(origin, origin),
                    "sum": round(total, 6),
                    "is_valid": abs(total - 1) <= 0.000001,
                }
            )
    return checks


def frequent_base_route_results() -> list[dict]:
    counter = Counter(route["result"] for route in build_enriched_routes())
    return [{"result": result, "count": count} for result, count in counter.most_common()]


def matrix_risk_ranking(probability_matrix: Matrix, top_n: int = 10) -> list[dict]:
    ranking = []
    for origin, row in probability_matrix.items():
        abandonment_probability = sum(row.get(target, 0.0) for target in ABANDONMENT_STATES)
        error_probability = sum(row.get(target, 0.0) for target in ERROR_STATES)
        follow_up_probability = sum(row.get(target, 0.0) for target in FOLLOW_UP_STATES)
        total_risk = abandonment_probability + error_probability + follow_up_probability
        if total_risk > 0:
            state = STATE_BY_CODE.get(origin, {})
            ranking.append(
                {
                    "state": origin,
                    "name": STATE_NAMES.get(origin, origin),
                    "type": state.get("type", ""),
                    "module": state.get("module", ""),
                    "abandonment_probability": round(abandonment_probability, 4),
                    "error_probability": round(error_probability, 4),
                    "follow_up_probability": round(follow_up_probability, 4),
                    "risk_probability": round(total_risk, 4),
                    "risk_percentage": round(total_risk * 100, 2),
                }
            )
    return sorted(ranking, key=lambda item: item["risk_probability"], reverse=True)[:top_n]


def clone_probability_matrix(probability_matrix: Matrix) -> Matrix:
    return {origin: dict(row) for origin, row in probability_matrix.items()}
