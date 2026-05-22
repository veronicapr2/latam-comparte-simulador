from __future__ import annotations

from collections import Counter

from app.data.states import (
    ABANDONMENT_STATES,
    ERROR_STATES,
    FOLLOW_UP_STATES,
    STATE_BY_CODE,
    STATE_NAMES,
)
from app.services.matrix_service import Matrix, clone_probability_matrix, matrix_risk_ranking
from app.services.simulation_service import simulate_many_users, summarize_simulation


def previous_state_before_abandonment(simulation: list[dict]) -> dict:
    abandonment_rows = [row for row in simulation if row["final_state"] in ABANDONMENT_STATES and len(row["path"]) >= 2]
    total_abandonments = len(abandonment_rows)
    if total_abandonments == 0:
        return {
            "state": None,
            "name": "Sin abandono detectado",
            "abandonments_from_state": 0,
            "percentage_over_abandonments": 0,
            "percentage_over_total": 0,
            "ranking": [],
        }

    counter = Counter(row["path"][-2] for row in abandonment_rows)
    total_users = len(simulation) or 1
    ranking = [
        {
            "state": state,
            "name": STATE_NAMES.get(state, state),
            "abandonments_from_state": count,
            "percentage_over_abandonments": round(count / total_abandonments * 100, 2),
            "percentage_over_total": round(count / total_users * 100, 2),
        }
        for state, count in counter.most_common(10)
    ]
    leader = ranking[0]
    return {**leader, "ranking": ranking}


def state_direct_probabilities(probability_matrix: Matrix, state_code: str) -> dict:
    row = probability_matrix.get(state_code, {})
    abandonment_probability = sum(row.get(target, 0.0) for target in ABANDONMENT_STATES)
    error_probability = sum(row.get(target, 0.0) for target in ERROR_STATES)
    follow_up_probability = sum(row.get(target, 0.0) for target in FOLLOW_UP_STATES)
    return {
        "direct_abandonment_probability": round(abandonment_probability, 4),
        "direct_abandonment_percentage": round(abandonment_probability * 100, 2),
        "direct_error_probability": round(error_probability, 4),
        "direct_error_percentage": round(error_probability * 100, 2),
        "direct_follow_up_probability": round(follow_up_probability, 4),
        "direct_follow_up_percentage": round(follow_up_probability * 100, 2),
    }


def detect_critical_state(probability_matrix: Matrix, simulation: list[dict] | None = None) -> dict:
    ranking_by_matrix = matrix_risk_ranking(probability_matrix, top_n=10)
    matrix_critical = ranking_by_matrix[0] if ranking_by_matrix else None
    simulation_critical = previous_state_before_abandonment(simulation or [])

    selected_state = simulation_critical.get("state") or (matrix_critical or {}).get("state")
    state = STATE_BY_CODE.get(selected_state or "", {})
    direct = state_direct_probabilities(probability_matrix, selected_state) if selected_state else {}

    return {
        "state": selected_state,
        "name": STATE_NAMES.get(selected_state, "Sin estado crítico"),
        "description": state.get("description", ""),
        "type": state.get("type", ""),
        "module": state.get("module", ""),
        "abandonments_from_state": simulation_critical.get("abandonments_from_state", 0),
        "percentage_over_abandonments": simulation_critical.get("percentage_over_abandonments", 0),
        "percentage_over_total": simulation_critical.get("percentage_over_total", 0),
        **direct,
        "critical_by_simulation": simulation_critical,
        "critical_by_matrix": matrix_critical,
        "ranking": ranking_by_matrix,
    }


def generate_recommendation(state_code: str | None) -> dict:
    if not state_code or state_code not in STATE_BY_CODE:
        return {
            "estado_analizado": "Sin estado crítico",
            "problema_detectado": "No se detectaron abandonos suficientes para priorizar un punto del recorrido.",
            "posible_causa": "La simulación no produjo un patrón dominante de abandono.",
            "mejora_recomendada": "Ejecutar una simulación con más usuarios o revisar más recorridos base.",
            "accion_esperada": "Obtener una señal más estable para priorizar mejoras.",
            "indicador_para_validar": "Distribución de resultados finales.",
            "resultado_esperado": "Diagnóstico más preciso del comportamiento de usuarios.",
        }

    state = STATE_BY_CODE[state_code]
    name = state["name"]
    module = state["module"].lower()

    recommendation = {
        "estado_analizado": f"{state_code} - {name}",
        "problema_detectado": "El estado concentra riesgo de abandono, error o seguimiento pendiente.",
        "posible_causa": "El usuario puede encontrar fricción, falta de claridad o demasiados pasos para continuar.",
        "mejora_recomendada": "Simplificar el siguiente paso, reforzar los mensajes de ayuda y hacer visible la acción principal.",
        "accion_esperada": "Aumentar la continuidad del recorrido y reducir finales negativos.",
        "indicador_para_validar": "Tasa de usuarios que avanza desde el estado crítico hacia un resultado exitoso.",
        "resultado_esperado": "Menos abandono y mayor proporción de usuarios con resultado exitoso.",
    }

    if "contacto" in module or "formulario" in name.lower():
        recommendation.update(
            {
                "problema_detectado": "Muchos usuarios se detienen o fallan alrededor del formulario de contacto.",
                "posible_causa": "Formulario largo, campos poco claros o ausencia de confirmación visual.",
                "mejora_recomendada": "Reducir campos, agregar validación en tiempo real, ayudas breves y confirmación clara antes del envío.",
                "indicador_para_validar": "Tasa de formularios enviados exitosamente hacia S97.",
                "resultado_esperado": "Menos abandono y más usuarios llegando al envío exitoso.",
            }
        )
    elif "tu aula" in module:
        recommendation.update(
            {
                "problema_detectado": "El acceso o recuperación de cuenta genera fricción en el recorrido.",
                "posible_causa": "Credenciales incompletas, mensajes de error poco accionables o recuperación poco visible.",
                "mejora_recomendada": "Mejorar mensajes de error, ofrecer recuperación visible y validar campos antes de enviar.",
                "indicador_para_validar": "Tasa de acceso exitoso hacia S107.",
                "resultado_esperado": "Menos accesos denegados y menos abandonos en inicio de sesión.",
            }
        )
    elif "donaciones" in module:
        recommendation.update(
            {
                "problema_detectado": "El flujo de donación puede estar perdiendo usuarios antes del envío exitoso.",
                "posible_causa": "Falta de confianza, demasiados campos o información insuficiente sobre el proceso.",
                "mejora_recomendada": "Mostrar pasos claros, señales de seguridad, validación temprana y resumen antes de donar.",
                "indicador_para_validar": "Tasa de donaciones exitosas hacia S102.",
                "resultado_esperado": "Más usuarios completan el formulario de donación.",
            }
        )

    return recommendation


def apply_abandonment_reduction(
    probability_matrix: Matrix,
    critical_state: str,
    reduction: float,
) -> Matrix:
    improved = clone_probability_matrix(probability_matrix)
    row = improved.get(critical_state)
    if not row:
        return improved

    removed_probability = 0.0
    for target in ABANDONMENT_STATES:
        current = row.get(target, 0.0)
        if current > 0:
            delta = current * reduction
            row[target] = current - delta
            removed_probability += delta

    if removed_probability <= 0:
        return improved

    preferred_targets = [
        target
        for target, probability in row.items()
        if probability > 0 and target not in ABANDONMENT_STATES and target not in ERROR_STATES and target not in FOLLOW_UP_STATES
    ]
    if not preferred_targets:
        preferred_targets = ["S96"]

    current_weight = sum(row.get(target, 0.0) for target in preferred_targets)
    if current_weight > 0:
        for target in preferred_targets:
            row[target] = row.get(target, 0.0) + removed_probability * (row.get(target, 0.0) / current_weight)
    else:
        increment = removed_probability / len(preferred_targets)
        for target in preferred_targets:
            row[target] = row.get(target, 0.0) + increment

    total = sum(row.values())
    if total > 0:
        for target in row:
            row[target] = row[target] / total
    return improved


def compare_improved_scenario(
    probability_matrix: Matrix,
    num_users: int,
    max_steps: int,
    initial_state: str,
    abandonment_reduction: float,
    target_state: str | None = None,
    seed: int | None = None,
) -> dict:
    baseline = simulate_many_users(num_users, probability_matrix, initial_state, max_steps, seed)
    baseline_summary = summarize_simulation(baseline)
    critical = detect_critical_state(probability_matrix, baseline)
    selected_state = target_state or critical["state"]
    improved_matrix = apply_abandonment_reduction(probability_matrix, selected_state, abandonment_reduction)
    improved = simulate_many_users(num_users, improved_matrix, initial_state, max_steps, seed)
    improved_summary = summarize_simulation(improved)

    metrics = [
        ("éxito", "success_percentage"),
        ("abandono", "abandonment_percentage"),
        ("error", "error_percentage"),
        ("seguimiento pendiente", "follow_up_percentage"),
    ]
    comparison = []
    for label, key in metrics:
        before = baseline_summary[key]
        after = improved_summary[key]
        comparison.append(
            {
                "metric": label,
                "before": before,
                "after": after,
                "difference_points": round(after - before, 2),
            }
        )

    abandonment_delta = next(item["difference_points"] for item in comparison if item["metric"] == "abandono")
    success_delta = next(item["difference_points"] for item in comparison if item["metric"] == "éxito")
    conclusion = (
        f"La mejora simulada reduce el abandono en {abs(abandonment_delta):.2f} puntos porcentuales "
        f"y cambia el éxito en {success_delta:.2f} puntos porcentuales."
    )

    return {
        "critical_state": detect_critical_state(improved_matrix, baseline),
        "target_state": selected_state,
        "abandonment_reduction": abandonment_reduction,
        "current_summary": baseline_summary,
        "improved_summary": improved_summary,
        "comparison": comparison,
        "conclusion": conclusion,
        "recommendation": generate_recommendation(selected_state),
        "preview": improved[:20],
    }
