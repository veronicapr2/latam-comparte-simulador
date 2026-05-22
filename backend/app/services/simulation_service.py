from __future__ import annotations

import random
from collections import Counter, defaultdict

from app.data.states import FINAL_STATES, STATE_CODES, STATE_NAMES
from app.services.matrix_service import Matrix, classify_result


def _weighted_choice(transitions: dict[str, float], rng: random.Random) -> str | None:
    weighted_items = [(state, probability) for state, probability in transitions.items() if probability > 0]
    total = sum(probability for _, probability in weighted_items)
    if total <= 0:
        return None

    threshold = rng.random() * total
    cumulative = 0.0
    for state, probability in weighted_items:
        cumulative += probability
        if cumulative >= threshold:
            return state
    return weighted_items[-1][0]


def simulate_user(
    probability_matrix: Matrix,
    initial_state: str,
    max_steps: int,
    rng: random.Random,
) -> list[str]:
    path = [initial_state]
    current_state = initial_state

    for _ in range(max_steps - 1):
        if current_state in FINAL_STATES:
            break

        transitions = probability_matrix.get(current_state, {})
        next_state = _weighted_choice(transitions, rng)
        if next_state is None:
            break

        path.append(next_state)
        current_state = next_state

    return path


def simulate_many_users(
    num_users: int,
    probability_matrix: Matrix,
    initial_state: str = "S1",
    max_steps: int = 20,
    seed: int | None = None,
) -> list[dict]:
    if initial_state not in STATE_CODES:
        raise ValueError(f"El estado inicial {initial_state} no existe en el modelo.")

    rng = random.Random(seed)
    simulation = []
    for user_index in range(1, num_users + 1):
        path = simulate_user(probability_matrix, initial_state, max_steps, rng)
        final_state = path[-1]
        result = classify_result(final_state)
        simulation.append(
            {
                "user": user_index,
                "path": path,
                "coded_route": " -> ".join(path),
                "translated_route": " -> ".join(STATE_NAMES.get(code, code) for code in path),
                "final_state": final_state,
                "final_state_name": STATE_NAMES.get(final_state, final_state),
                "result": result,
                "steps": len(path),
            }
        )
    return simulation


def summarize_simulation(simulation: list[dict]) -> dict:
    total_users = len(simulation)
    if total_users == 0:
        return {
            "total_users": 0,
            "result_counts": {},
            "result_percentages": {},
            "success_percentage": 0,
            "abandonment_percentage": 0,
            "error_percentage": 0,
            "follow_up_percentage": 0,
            "average_steps": 0,
            "most_common_result": "sin datos",
            "final_state_counts": [],
            "top_routes": [],
            "average_steps_by_result": [],
        }

    result_counter = Counter(row["result"] for row in simulation)
    final_state_counter = Counter(row["final_state"] for row in simulation)
    route_counter = Counter(row["coded_route"] for row in simulation)
    steps_by_result: dict[str, list[int]] = defaultdict(list)
    for row in simulation:
        steps_by_result[row["result"]].append(row["steps"])

    percentages = {
        result: round(count / total_users * 100, 2)
        for result, count in result_counter.items()
    }

    return {
        "total_users": total_users,
        "result_counts": dict(result_counter),
        "result_percentages": percentages,
        "success_percentage": percentages.get("éxito", 0),
        "abandonment_percentage": percentages.get("abandono", 0),
        "error_percentage": percentages.get("error", 0),
        "follow_up_percentage": percentages.get("seguimiento pendiente", 0),
        "average_steps": round(sum(row["steps"] for row in simulation) / total_users, 2),
        "most_common_result": result_counter.most_common(1)[0][0],
        "final_state_counts": [
            {
                "state": state,
                "name": STATE_NAMES.get(state, state),
                "count": count,
                "percentage": round(count / total_users * 100, 2),
            }
            for state, count in final_state_counter.most_common()
        ],
        "top_routes": [
            {"route": route, "count": count, "percentage": round(count / total_users * 100, 2)}
            for route, count in route_counter.most_common(5)
        ],
        "average_steps_by_result": [
            {
                "result": result,
                "average_steps": round(sum(steps) / len(steps), 2),
                "count": len(steps),
            }
            for result, steps in sorted(steps_by_result.items())
        ],
    }
