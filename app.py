from __future__ import annotations

import json
from pathlib import Path

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

from src.analytics import (
    calcular_metricas,
    comparar_escenarios,
    estado_critico_directo_desde_matriz,
    estado_previo_mas_frecuente_antes_abandono,
    estados_mas_visitados,
    ranking_estados_criticos,
    recorridos_mas_frecuentes,
    resultados_por_estado_final,
    resumen_ejecutivo,
    simular_escenario_mejorado,
    transiciones_mas_frecuentes,
)
from src.data_loader import cargar_datos_proyecto, exportar_datos_procesados
from src.model import construir_matriz_conteos, construir_matriz_probabilidades, filas_sin_transiciones
from src.recommendations import generar_recomendacion
from src.simulation import simular_varios_usuarios
from src.styles import get_custom_css


PROJECT_ROOT = Path(__file__).resolve().parent
LOGO_PATH = PROJECT_ROOT / "assets" / "logo_colombia_comparte.png"


st.set_page_config(
    page_title="Colombia Comparte Analytics",
    layout="wide",
    initial_sidebar_state="expanded",
)
st.markdown(get_custom_css(), unsafe_allow_html=True)


@st.cache_data(show_spinner="Cargando datos reales del notebook...")
def cargar_base() -> dict:
    datos = cargar_datos_proyecto(exportar=False)
    matriz_conteos = construir_matriz_conteos(datos["recorridos"], datos["estados"])
    matriz_probabilidades = construir_matriz_probabilidades(matriz_conteos)
    datos["matriz_conteos"] = matriz_conteos
    datos["matriz_probabilidades"] = matriz_probabilidades
    return datos


def ejecutar_simulacion(n_usuarios: int, max_pasos: int, estado_inicial: str, seed: int | None) -> pd.DataFrame:
    datos = st.session_state["datos"]
    return simular_varios_usuarios(
        n_usuarios=n_usuarios,
        matriz_probabilidades=datos["matriz_probabilidades"],
        estado_inicial=estado_inicial,
        max_pasos=max_pasos,
        estados_finales=datos["estados_finales"],
        nombres_estados=datos["nombres_estados"],
        seed=seed,
    )


def dataframe_to_csv(df: pd.DataFrame, include_index: bool = False) -> bytes:
    return df.to_csv(index=include_index, encoding="utf-8-sig").encode("utf-8-sig")


def dataframe_to_json(df: pd.DataFrame) -> str:
    return df.to_json(orient="records", force_ascii=False, indent=2)


def render_kpi(label: str, value: str | int | float, color: str = "#6d3bd1") -> None:
    st.markdown(
        f"""
        <div class="cc-card">
            <div class="cc-kpi-label">{label}</div>
            <div class="cc-kpi-value" style="color:{color};">{value}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def matriz_activa(matriz: pd.DataFrame) -> pd.DataFrame:
    filas = matriz.sum(axis=1) > 0
    columnas = matriz.sum(axis=0) > 0
    return matriz.loc[filas, columnas]


def plot_heatmap_matriz(matriz: pd.DataFrame, titulo: str) -> go.Figure:
    activa = matriz_activa(matriz)
    if len(activa) > 45:
        ranking = activa.sum(axis=1).sort_values(ascending=False).head(45).index
        activa = activa.loc[ranking, activa.columns.intersection(ranking.union(activa.sum(axis=0).sort_values(ascending=False).head(45).index))]
    fig = px.imshow(
        activa,
        color_continuous_scale="Purples",
        aspect="auto",
        labels={"x": "Estado destino", "y": "Estado origen", "color": "Probabilidad"},
        title=titulo,
    )
    fig.update_layout(height=620, margin=dict(l=10, r=10, t=50, b=10))
    return fig


def render_exportaciones(resultados: pd.DataFrame, estado_critico: str) -> None:
    datos = st.session_state["datos"]
    resumen = resumen_ejecutivo(resultados, estado_critico)
    st.download_button(
        "Exportar resultados CSV",
        dataframe_to_csv(resultados),
        file_name="resultados_simulacion.csv",
        mime="text/csv",
        use_container_width=True,
    )
    st.download_button(
        "Exportar resultados JSON",
        dataframe_to_json(resultados),
        file_name="resultados_simulacion.json",
        mime="application/json",
        use_container_width=True,
    )
    st.download_button(
        "Matriz de conteos CSV",
        dataframe_to_csv(datos["matriz_conteos"], include_index=True),
        file_name="matriz_conteos.csv",
        mime="text/csv",
        use_container_width=True,
    )
    st.download_button(
        "Matriz de probabilidades CSV",
        dataframe_to_csv(datos["matriz_probabilidades"], include_index=True),
        file_name="matriz_probabilidades.csv",
        mime="text/csv",
        use_container_width=True,
    )
    st.download_button(
        "Resumen ejecutivo CSV",
        dataframe_to_csv(resumen),
        file_name="resumen_ejecutivo.csv",
        mime="text/csv",
        use_container_width=True,
    )


def asegurar_simulacion_inicial() -> None:
    if "resultados" not in st.session_state:
        st.session_state["resultados"] = ejecutar_simulacion(
            st.session_state["n_usuarios"],
            st.session_state["max_pasos"],
            st.session_state["estado_inicial"],
            st.session_state["seed"],
        )


try:
    datos = cargar_base()
except Exception as exc:
    st.error(f"No fue posible cargar el notebook o construir el modelo: {exc}")
    st.stop()

st.session_state["datos"] = datos
estado_critico_matriz = estado_critico_directo_desde_matriz(datos["matriz_probabilidades"])
tipos_estados = dict(zip(datos["df_estados"]["Código"], datos["df_estados"]["Tipo de estado"]))

with st.sidebar:
    if LOGO_PATH.exists():
        st.image(str(LOGO_PATH), use_container_width=True)
    else:
        st.markdown(
            """
            <div class="cc-card" style="min-height:auto;text-align:center;">
                <div style="font-weight:900;color:#4c259f;font-size:1.05rem;">Colombia Comparte</div>
                <div style="color:#64748b;font-size:.82rem;">logo pendiente en assets/</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.title("Colombia Comparte Analytics")
    st.caption("Modelo local de recorridos con cadenas de Márkov.")

    st.session_state["n_usuarios"] = st.number_input(
        "Número de usuarios a simular",
        min_value=10,
        max_value=100000,
        value=int(st.session_state.get("n_usuarios", 10000)),
        step=100,
    )
    st.session_state["max_pasos"] = st.slider(
        "Máximo de pasos por usuario",
        min_value=2,
        max_value=100,
        value=int(st.session_state.get("max_pasos", 50)),
    )
    opciones_estado = datos["estados"]
    st.session_state["estado_inicial"] = st.selectbox(
        "Estado inicial",
        opciones_estado,
        index=opciones_estado.index(st.session_state.get("estado_inicial", "S1"))
        if st.session_state.get("estado_inicial", "S1") in opciones_estado
        else 1,
        format_func=lambda codigo: f"{codigo} - {datos['nombres_estados'].get(codigo, codigo)}",
    )
    seed_text = st.text_input("Semilla aleatoria opcional", value="" if st.session_state.get("seed") is None else str(st.session_state.get("seed")))
    st.session_state["seed"] = int(seed_text) if seed_text.strip().isdigit() else None

    if st.button("Ejecutar simulación", use_container_width=True, key="ejecutar_sidebar"):
        try:
            st.session_state["resultados"] = ejecutar_simulacion(
                st.session_state["n_usuarios"],
                st.session_state["max_pasos"],
                st.session_state["estado_inicial"],
                st.session_state["seed"],
            )
            st.success("Simulación ejecutada.")
        except Exception as exc:
            st.error(f"No se pudo ejecutar la simulación: {exc}")

    if "resultados" not in st.session_state:
        try:
            st.session_state["resultados"] = ejecutar_simulacion(
                st.session_state["n_usuarios"],
                st.session_state["max_pasos"],
                st.session_state["estado_inicial"],
                st.session_state["seed"],
            )
        except Exception as exc:
            st.error(f"No se pudo preparar la simulación inicial: {exc}")

    st.markdown("### Exportar resultados")
    if "resultados" in st.session_state:
        render_exportaciones(st.session_state["resultados"], estado_critico_matriz)
    else:
        st.info("Ejecuta o espera la simulación inicial para habilitar descargas.")

    st.markdown("### Información del modelo")
    st.write(f"Estados: **{len(datos['estados'])}**")
    st.write(f"Recorridos base: **{len(datos['recorridos'])}**")
    st.write(f"Estados sin transición: **{len(filas_sin_transiciones(datos['matriz_conteos']))}**")

asegurar_simulacion_inicial()
resultados = st.session_state["resultados"]
metricas = calcular_metricas(resultados)
estado_previo_abandono = estado_previo_mas_frecuente_antes_abandono(resultados)
estado_critico_operativo = (
    estado_previo_abandono["estado_previo"]
    if estado_previo_abandono["estado_previo"] != "Sin abandono detectado"
    else estado_critico_matriz
)

st.markdown(
    """
    <div class="cc-hero">
        <div class="cc-kicker">Dashboard analítico local</div>
        <h1>Colombia Comparte Analytics</h1>
        <p>
            Simulación interactiva de recorridos de usuario con cadenas de Márkov.
            El tablero permite detectar abandono, rutas frecuentes, estados de riesgo
            y oportunidades de mejora para la experiencia digital de Colombia Comparte.
        </p>
    </div>
    """,
    unsafe_allow_html=True,
)

kpi_cols = st.columns(8)
with kpi_cols[0]:
    render_kpi("Total estados", len(datos["estados"]), "#2563eb")
with kpi_cols[1]:
    render_kpi("Recorridos base", len(datos["recorridos"]), "#6d3bd1")
with kpi_cols[2]:
    render_kpi("Usuarios", metricas["usuarios"], "#152033")
with kpi_cols[3]:
    render_kpi("Éxito", f"{metricas['porcentaje_exito']}%", "#16a34a")
with kpi_cols[4]:
    render_kpi("Abandono", f"{metricas['porcentaje_abandono']}%", "#e11d48")
with kpi_cols[5]:
    render_kpi("Error", f"{metricas['porcentaje_error']}%", "#f59e0b")
with kpi_cols[6]:
    render_kpi("Prom. pasos", metricas["promedio_pasos"], "#2563eb")
with kpi_cols[7]:
    render_kpi("Estado crítico", estado_critico_operativo, "#e11d48")

tab_resumen, tab_estados, tab_recorridos, tab_matriz, tab_simulacion, tab_resultados, tab_diagnostico = st.tabs(
    [
        "Resumen ejecutivo",
        "Estados del modelo",
        "Recorridos base",
        "Matriz de transición",
        "Simulación",
        "Resultados",
        "Diagnóstico y mejora",
    ]
)

with tab_resumen:
    st.markdown(
        """
        <div class="cc-panel">
        <h3>Lectura ejecutiva del modelo</h3>
        <p>
        El modelo toma los recorridos base del notebook <strong>ColComparte.ipynb</strong>
        y los transforma en una cadena de Márkov. Cada estado representa una pantalla,
        botón, sección, formulario o resultado final de Colombia Comparte.
        </p>
        <p>
        La matriz de conteos registra cuántas veces aparece cada transición entre estados.
        La matriz de probabilidades normaliza esos conteos para estimar hacia dónde puede
        avanzar un usuario simulado. El estado crítico identifica el punto desde el cual
        el abandono directo o previo al abandono es más relevante.
        </p>
        <div class="cc-flow">
            <div class="cc-flow-step">Recorridos base</div>
            <div class="cc-flow-step">Matriz de conteos</div>
            <div class="cc-flow-step">Matriz de probabilidades</div>
            <div class="cc-flow-step">Simulación</div>
            <div class="cc-flow-step">Diagnóstico</div>
            <div class="cc-flow-step">Recomendación</div>
        </div>
        </div>
        """,
        unsafe_allow_html=True,
    )
    c1, c2, c3 = st.columns(3)
    with c1:
        st.metric("Estado crítico directo desde matriz", estado_critico_matriz)
    with c2:
        st.metric("Estado previo más frecuente antes del abandono", estado_previo_abandono["estado_previo"])
    with c3:
        st.metric("Estado final más frecuente", metricas["estado_final_mas_frecuente"])

with tab_estados:
    st.subheader("Estados del modelo")
    tipos = [
        "Inicial",
        "Intermedio",
        "Final exitoso",
        "Final negativo",
        "Error",
        "Seguimiento",
        "Salida externa",
        "Abandono",
    ]
    tipos_sel = st.multiselect("Filtrar por tipo de estado", tipos, default=tipos)
    df_estados_filtrado = datos["df_estados"][datos["df_estados"]["Tipo de estado"].isin(tipos_sel)]
    st.dataframe(df_estados_filtrado, use_container_width=True, hide_index=True, height=560)

with tab_recorridos:
    st.subheader("Recorridos base de usuarios")
    resultados_base = sorted(datos["df_recorridos"]["Resultado"].unique().tolist())
    resultados_sel = st.multiselect("Filtrar por resultado final", resultados_base, default=resultados_base)
    df_recorridos_filtrado = datos["df_recorridos"][datos["df_recorridos"]["Resultado"].isin(resultados_sel)]
    st.dataframe(df_recorridos_filtrado, use_container_width=True, hide_index=True, height=390)
    if not df_recorridos_filtrado.empty:
        recorrido_id = st.selectbox("Seleccionar recorrido para ver detalle", df_recorridos_filtrado["ID del recorrido"].tolist())
        seleccionado = df_recorridos_filtrado[df_recorridos_filtrado["ID del recorrido"] == recorrido_id].iloc[0]
        st.markdown('<div class="cc-panel">', unsafe_allow_html=True)
        st.write(f"**Estado final:** {seleccionado['Estado final']} · **Resultado:** {seleccionado['Resultado']}")
        st.write(seleccionado["Recorrido traducido"])
        pasos = [paso.strip() for paso in seleccionado["Recorrido codificado"].split("→")]
        st.plotly_chart(
            go.Figure(
                data=[
                    go.Scatter(
                        x=list(range(1, len(pasos) + 1)),
                        y=pasos,
                        mode="lines+markers+text",
                        text=pasos,
                        textposition="top center",
                        line=dict(color="#6d3bd1", width=4),
                        marker=dict(size=13, color="#2563eb"),
                    )
                ],
                layout=go.Layout(
                    height=330,
                    title="Camino seleccionado",
                    xaxis_title="Paso",
                    yaxis_title="Estado",
                    margin=dict(l=10, r=10, t=50, b=10),
                ),
            ),
            use_container_width=True,
        )
        st.markdown("</div>", unsafe_allow_html=True)

with tab_matriz:
    st.subheader("Matriz de transición")
    tipo_matriz = st.radio("Selecciona la matriz", ["Matriz de conteos", "Matriz de probabilidades"], horizontal=True)
    matriz = datos["matriz_conteos"] if tipo_matriz == "Matriz de conteos" else datos["matriz_probabilidades"]
    st.dataframe(matriz, use_container_width=True, height=420)
    st.info(
        "Cada fila representa el estado actual y cada columna el estado siguiente. "
        "En probabilidades, cada fila con transiciones suma 1."
    )
    st.plotly_chart(plot_heatmap_matriz(datos["matriz_probabilidades"], "Heatmap de probabilidades de transición"), use_container_width=True)
    st.markdown(
        f"""
        <div class="cc-alert">
        <strong>Diagnóstico directo:</strong> el estado con mayor probabilidad directa de abandono es
        <strong>{estado_critico_matriz}</strong> - {datos['nombres_estados'].get(estado_critico_matriz, estado_critico_matriz)}.
        </div>
        """,
        unsafe_allow_html=True,
    )

with tab_simulacion:
    st.subheader("Simulación de usuarios")
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Usuarios", st.session_state["n_usuarios"])
    c2.metric("Máximo de pasos", st.session_state["max_pasos"])
    c3.metric("Estado inicial", st.session_state["estado_inicial"])
    c4.metric("Semilla", "Aleatoria" if st.session_state["seed"] is None else st.session_state["seed"])

    if st.button("Ejecutar simulación", key="ejecutar_tab", use_container_width=True):
        try:
            st.session_state["resultados"] = ejecutar_simulacion(
                st.session_state["n_usuarios"],
                st.session_state["max_pasos"],
                st.session_state["estado_inicial"],
                st.session_state["seed"],
            )
            resultados = st.session_state["resultados"]
            st.success("Nueva simulación ejecutada.")
        except Exception as exc:
            st.error(f"No se pudo ejecutar la simulación: {exc}")

    st.markdown("#### Vista previa de usuarios simulados")
    st.dataframe(resultados.head(20), use_container_width=True, hide_index=True)

    tipos_resultado = sorted(resultados["Tipo de resultado"].unique().tolist())
    estados_finales_resultado = sorted(resultados["Estado final"].unique().tolist())
    f1, f2, f3 = st.columns(3)
    tipo_sel = f1.multiselect("Filtro por tipo de resultado", tipos_resultado, default=tipos_resultado)
    estado_final_sel = f2.multiselect("Filtro por estado final", estados_finales_resultado, default=estados_finales_resultado)
    pasos_rango = f3.slider(
        "Filtro por número de pasos",
        int(resultados["Número de pasos"].min()),
        int(resultados["Número de pasos"].max()),
        (int(resultados["Número de pasos"].min()), int(resultados["Número de pasos"].max())),
    )
    tabla_sim = resultados[
        resultados["Tipo de resultado"].isin(tipo_sel)
        & resultados["Estado final"].isin(estado_final_sel)
        & resultados["Número de pasos"].between(pasos_rango[0], pasos_rango[1])
    ]
    st.dataframe(tabla_sim, use_container_width=True, hide_index=True, height=520)

with tab_resultados:
    st.subheader("Resultados de la simulación")
    resultado_final = resultados_por_estado_final(resultados, datos["nombres_estados"])
    estados_visitados = estados_mas_visitados(resultados, datos["nombres_estados"])
    rutas_top = recorridos_mas_frecuentes(resultados)
    ranking = ranking_estados_criticos(datos["matriz_probabilidades"], datos["nombres_estados"])

    r1, r2, r3, r4, r5 = st.columns(5)
    r1.metric("Éxito", f"{metricas['porcentaje_exito']}%")
    r2.metric("Abandono", f"{metricas['porcentaje_abandono']}%")
    r3.metric("Error", f"{metricas['porcentaje_error']}%")
    r4.metric("Seguimiento pendiente", f"{metricas['porcentaje_seguimiento']}%")
    r5.metric("Promedio de pasos", metricas["promedio_pasos"])

    c1, c2 = st.columns(2)
    with c1:
        fig_bar = px.bar(
            resultado_final,
            x="Cantidad",
            y="Nombre",
            color="Tipo de resultado",
            orientation="h",
            title="Cantidad por resultado final",
            color_discrete_map={
                "Éxito": "#16a34a",
                "Abandono": "#e11d48",
                "Error": "#f59e0b",
                "Salida externa": "#2563eb",
                "Seguimiento pendiente": "#64748b",
            },
        )
        fig_bar.update_layout(height=540, yaxis={"categoryorder": "total ascending"})
        st.plotly_chart(fig_bar, use_container_width=True)
    with c2:
        tipo_counts = resultados["Tipo de resultado"].value_counts().reset_index()
        tipo_counts.columns = ["Tipo de resultado", "Cantidad"]
        fig_pie = px.pie(
            tipo_counts,
            names="Tipo de resultado",
            values="Cantidad",
            title="Distribución por tipo de resultado",
            hole=0.55,
            color="Tipo de resultado",
            color_discrete_map={
                "Éxito": "#16a34a",
                "Abandono": "#e11d48",
                "Error": "#f59e0b",
                "Salida externa": "#2563eb",
                "Seguimiento pendiente": "#64748b",
            },
        )
        fig_pie.update_layout(height=540)
        st.plotly_chart(fig_pie, use_container_width=True)

    c3, c4 = st.columns(2)
    with c3:
        pasos = resultados["Número de pasos"].value_counts().sort_index().reset_index()
        pasos.columns = ["Número de pasos", "Usuarios"]
        st.plotly_chart(px.bar(pasos, x="Número de pasos", y="Usuarios", title="Distribución de pasos por usuario", color_discrete_sequence=["#6d3bd1"]), use_container_width=True)
    with c4:
        st.plotly_chart(px.bar(ranking, x="Riesgo (%)", y="Nombre", orientation="h", title="Ranking de estados críticos", color_discrete_sequence=["#e11d48"]), use_container_width=True)

    st.plotly_chart(plot_heatmap_matriz(datos["matriz_probabilidades"], "Heatmap de transiciones"), use_container_width=True)

    t1, t2, t3 = st.columns(3)
    with t1:
        st.markdown("#### Recorridos más frecuentes")
        st.dataframe(rutas_top, use_container_width=True, hide_index=True)
    with t2:
        st.markdown("#### Estados finales más frecuentes")
        st.dataframe(resultado_final, use_container_width=True, hide_index=True)
    with t3:
        st.markdown("#### Estados más visitados")
        st.dataframe(estados_visitados, use_container_width=True, hide_index=True)

with tab_diagnostico:
    st.subheader("Diagnóstico y mejora")
    recomendacion = generar_recomendacion(
        estado_critico_operativo,
        datos["nombres_estados"],
        datos["descripciones_estados"],
        tipos_estados,
    )

    d1, d2, d3, d4 = st.columns(4)
    d1.metric("Estado crítico", estado_critico_operativo)
    d2.metric("Previo antes del abandono", estado_previo_abandono["estado_previo"])
    d3.metric("Usuarios que abandonan desde allí", estado_previo_abandono["abandonos_desde_estado"])
    d4.metric("% sobre total", f"{estado_previo_abandono['porcentaje_sobre_total']}%")
    st.metric("% sobre abandonos", f"{estado_previo_abandono['porcentaje_sobre_abandonos']}%")

    st.markdown('<div class="cc-panel">', unsafe_allow_html=True)
    st.markdown("#### Recomendación ejecutiva")
    for clave, valor in recomendacion.items():
        st.write(f"**{clave}:** {valor}")
    st.markdown("</div>", unsafe_allow_html=True)

    st.markdown("#### Simular escenario mejorado")
    estados_con_riesgo = ranking_estados_criticos(datos["matriz_probabilidades"], datos["nombres_estados"], top_n=50)
    opciones_criticas = estados_con_riesgo["Estado"].tolist() if not estados_con_riesgo.empty else datos["estados"]
    estado_mejora = st.selectbox(
        "Estado crítico a intervenir",
        opciones_criticas,
        index=opciones_criticas.index(estado_critico_operativo) if estado_critico_operativo in opciones_criticas else 0,
        format_func=lambda codigo: f"{codigo} - {datos['nombres_estados'].get(codigo, codigo)}",
    )
    reduccion = st.slider("Reducción del abandono desde ese estado", 0, 100, 30, step=5)
    estrategia = st.radio("Redistribuir probabilidad hacia", ["Rutas exitosas", "Rutas de continuación"], horizontal=True)

    if st.button("Ejecutar escenario mejorado", use_container_width=True):
        try:
            mejorado = simular_escenario_mejorado(
                matriz_probabilidades=datos["matriz_probabilidades"],
                estado_critico=estado_mejora,
                reduccion_abandono=reduccion,
                estrategia=estrategia,
                n_usuarios=st.session_state["n_usuarios"],
                estado_inicial=st.session_state["estado_inicial"],
                max_pasos=st.session_state["max_pasos"],
                estados_finales=datos["estados_finales"],
                nombres_estados=datos["nombres_estados"],
                seed=st.session_state["seed"],
            )
            st.session_state["mejorado"] = mejorado
        except Exception as exc:
            st.error(f"No se pudo simular el escenario mejorado: {exc}")

    if "mejorado" in st.session_state:
        comparacion = comparar_escenarios(resultados, st.session_state["mejorado"])
        st.dataframe(comparacion, use_container_width=True, hide_index=True)
        fig_comp = px.bar(
            comparacion,
            x="Métrica",
            y=["Escenario actual", "Escenario mejorado"],
            barmode="group",
            title="Comparación actual vs mejorado",
            color_discrete_sequence=["#6d3bd1", "#16a34a"],
        )
        st.plotly_chart(fig_comp, use_container_width=True)

        ca, cb, cc = st.columns(3)
        m_actual = calcular_metricas(resultados)
        m_mejorado = calcular_metricas(st.session_state["mejorado"])
        ca.metric("Éxito inicial vs mejorado", f"{m_actual['porcentaje_exito']}% → {m_mejorado['porcentaje_exito']}%")
        cb.metric("Abandono inicial vs mejorado", f"{m_actual['porcentaje_abandono']}% → {m_mejorado['porcentaje_abandono']}%")
        cc.metric("Error inicial vs mejorado", f"{m_actual['porcentaje_error']}% → {m_mejorado['porcentaje_error']}%")

try:
    exportar_datos_procesados(
        datos["df_estados"],
        datos["df_recorridos"],
        datos["matriz_conteos"],
        datos["matriz_probabilidades"],
        resultados,
    )
except Exception:
    pass
