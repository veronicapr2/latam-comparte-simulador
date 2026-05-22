# Guía completa del proyecto Colombia Comparte Simulator

## 1. Descripción general del proyecto

Colombia Comparte Simulator es una aplicación web para simular recorridos de usuarios dentro del sistema Colombia Comparte. El modelo usa estados, recorridos base, una matriz de conteos, una matriz de probabilidades y simulación mediante cadenas de Markov.

Cada estado representa una pantalla, sección, botón, formulario o resultado posible. Los recorridos base indican caminos observados o definidos en el Colab original. A partir de esos recorridos, el backend cuenta transiciones, calcula probabilidades y simula nuevos usuarios para analizar éxito, abandono, error y seguimiento pendiente.

## 2. Objetivo del proyecto

El objetivo es visualizar el comportamiento simulado de usuarios, identificar finales exitosos y problemáticos, detectar puntos de abandono o error y proponer oportunidades de mejora para la experiencia digital de Colombia Comparte.

## 3. Requisitos del entregable

| Requisito | Dónde se cumple | Descripción |
|----------|-----------------|-------------|
| Seleccionar número de usuarios | Sidebar y `POST /api/simulate` | El usuario configura `num_users` y el backend simula esa cantidad. |
| Seleccionar máximo de pasos | Sidebar y `POST /api/simulate` | El usuario configura `max_steps`; la simulación se detiene al alcanzar el límite. |
| Mostrar estados del modelo | Página Estados y `GET /api/states` | Se muestran código, nombre, descripción, tipo y módulo. |
| Mostrar recorridos base | Página Recorridos base y `GET /api/routes` | Se listan los 499 recorridos extraídos del Colab. |
| Mostrar matriz de conteos | Página Matrices y `GET /api/matrix/counts` | Tabla con filas como estado actual y columnas como siguiente estado. |
| Mostrar matriz de probabilidades | Página Matrices y `GET /api/matrix/probabilities` | Tabla de probabilidades redondeadas y validación de filas. |
| Ejecutar simulación | Sidebar, página Simulación y `POST /api/simulate` | La simulación se ejecuta en FastAPI, no en React. |
| Vista previa de usuarios simulados | Página Simulación | Tabla con usuario, recorrido, estado final, resultado y pasos. |
| Resultados principales | Dashboard y página Resultados | Porcentajes, promedio de pasos, resultado común y tablas resumen. |
| Gráfica de resultados | Dashboard y Resultados | Recharts muestra barras o dona de distribución. |
| Identificar estado crítico | Página Estado crítico y servicios de análisis | Se calcula por simulación y por riesgo directo de matriz. |
| Interfaz de recomendación | Página Mejora recomendada | Presenta problema, causa, mejora, acción, indicador y resultado esperado. |
| Escenario mejorado | Página Mejora recomendada y `POST /api/analysis/improved-scenario` | Slider de reducción de abandono y comparación antes/después. |
| Proyecto organizado y documentado | Carpetas `backend`, `frontend`, READMEs | Separación limpia por capas y documentación completa. |
| Despliegue gratuito preparado | `render.yaml`, Vite build, documentación | Backend listo para Render y frontend listo para Vercel. |
| Variables de entorno | `.env.example` en backend y frontend | No se hardcodean URLs en componentes. |

## 4. Tecnologías usadas

- React + Vite para construir una interfaz rápida, modular y desplegable en Vercel.
- FastAPI para exponer una API REST clara y documentada automáticamente en `/docs`.
- Python para la lógica de matrices, simulación y análisis.
- Recharts para gráficas de distribución y comparación de escenarios.
- Variables de entorno para separar configuración local y producción.
- Vercel para desplegar el frontend gratuitamente.
- Render para desplegar el backend gratuitamente.

## 5. Estructura del proyecto

```text
colombia-comparte-simulator/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── cors.py
│   │   ├── data/
│   │   │   ├── states.py
│   │   │   └── base_routes.py
│   │   ├── models/
│   │   │   └── schemas.py
│   │   ├── services/
│   │   │   ├── matrix_service.py
│   │   │   ├── simulation_service.py
│   │   │   └── analysis_service.py
│   │   └── api/
│   │       └── routes.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── render.yaml
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── api/
│   │   │   └── client.js
│   │   ├── components/
│   │   ├── pages/
│   │   ├── styles/
│   │   │   └── global.css
│   │   └── utils/
│   │       └── formatters.js
│   ├── public/
│   │   ├── logos/
│   │   │   └── colombia-comparte-logo.png
│   │   └── images/
│   │       └── referencia-dashboard.png
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
├── README.md
└── README_PROYECTO.md
```

La carpeta `backend` contiene la API y la lógica del modelo. La carpeta `frontend` contiene la interfaz React. Los archivos README explican instalación, despliegue y continuación del proyecto.

## 6. Backend

El backend concentra toda la lógica sensible y de cálculo. React no calcula matrices ni simula usuarios; solo envía parámetros y muestra respuestas.

- Estados: `backend/app/data/states.py`.
- Recorridos base: `backend/app/data/base_routes.py`.
- Matriz de conteos: `backend/app/services/matrix_service.py`.
- Matriz de probabilidades: `backend/app/services/matrix_service.py`.
- Simulación: `backend/app/services/simulation_service.py`.
- Estado crítico: `backend/app/services/analysis_service.py`.
- Recomendaciones: `backend/app/services/analysis_service.py`.
- Endpoints: `backend/app/api/routes.py`.
- Configuración y CORS: `backend/app/core/config.py` y `backend/app/core/cors.py`.

Los datos reales extraídos del notebook actual son 115 estados (`S0` a `S114`) y 499 recorridos base. El Colab traía códigos, nombres, recorridos, estados finales y reglas de simulación. Las descripciones, módulos y tipos se derivaron de esos nombres y de la clasificación de estados finales.

## 7. Frontend

El frontend organiza la experiencia en páginas:

- Dashboard: resumen general, explicación del flujo y gráfica principal.
- Estados: tabla con buscador y filtros por tipo y módulo.
- Recorridos base: tabla de recorridos, filtros por resultado y vista visual del camino.
- Matrices: alterna entre conteos y probabilidades, con top de transiciones.
- Simulación: configuración usada y vista previa de usuarios simulados.
- Resultados: métricas, gráfica de dona, top de rutas y promedio de pasos.
- Estado crítico: detalle del estado problemático y ranking de riesgo.
- Mejora recomendada: recomendación ejecutiva y escenario mejorado.
- Escenario mejorado: integrado dentro de Mejora recomendada con slider y gráfica comparativa.

Componentes reutilizables:

- `Sidebar.jsx`: configuración y navegación.
- `Navbar.jsx`: encabezado y estado del backend.
- `StatCard.jsx`: tarjetas de métricas.
- `MatrixTable.jsx`: visualización de matrices.
- `RouteViewer.jsx`: línea visual de recorrido.
- `ResultChart.jsx`: gráficas de resultados y comparación.
- `CriticalStateCard.jsx`: resumen del estado crítico.

## 8. Variables de entorno

Frontend:

```env
VITE_API_URL=http://localhost:8000
```

Backend:

```env
APP_NAME=Colombia Comparte Simulator
ENV=development
ALLOWED_ORIGINS=http://localhost:5173
```

En producción estas variables deben configurarse en Vercel y Render. La URL pública del backend en Render debe ir en `VITE_API_URL` del frontend.

## 9. Cómo ejecutar el proyecto localmente

Backend:

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Luego abrir `http://localhost:5173` y verificar `http://localhost:8000/api/health`.

## 10. Endpoints del backend

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/health` | Retorna estado del backend, nombre de la app y entorno. |
| GET | `/api/states` | Retorna todos los estados con código, nombre, descripción, tipo y módulo. |
| GET | `/api/routes` | Retorna recorridos base enriquecidos con resultado, final y pasos. |
| GET | `/api/matrix/counts` | Retorna matriz de conteos y top de transiciones frecuentes. |
| GET | `/api/matrix/probabilities` | Retorna matriz de probabilidades, validación de filas y top de riesgos. |
| POST | `/api/simulate` | Recibe configuración y retorna simulación, resumen, estado crítico y recomendación. |
| GET | `/api/analysis/critical-state` | Retorna análisis crítico desde la matriz sin ejecutar simulación nueva. |
| POST | `/api/analysis/improved-scenario` | Recibe reducción de abandono y retorna comparación antes/después. |

Ejemplo de `POST /api/simulate`:

```json
{
  "num_users": 1000,
  "max_steps": 20,
  "initial_state": "S1"
}
```

## 11. Flujo general de la simulación

1. Se cargan los estados desde `states.py`.
2. Se cargan los recorridos base desde `base_routes.py`.
3. Se cuentan transiciones consecutivas entre estados.
4. Se genera la matriz de conteos.
5. Se normaliza cada fila para obtener la matriz de probabilidades.
6. Se simulan usuarios desde el estado inicial.
7. Cada usuario avanza según las probabilidades de transición.
8. La simulación se detiene al llegar a un estado final, no tener salidas o alcanzar el máximo de pasos.
9. Se clasifica el resultado como éxito, abandono, error, seguimiento pendiente u otro/neutro.
10. Se calculan métricas principales.
11. Se detecta el estado crítico.
12. Se genera una recomendación.

## 12. Cómo actualizar los datos del Colab

Si más adelante se cambia el Colab o se agregan estados, se deben actualizar principalmente:

- `backend/app/data/states.py`
- `backend/app/data/base_routes.py`

Formato esperado de estado:

```python
{
    "code": "S1",
    "name": "Header - Inicio",
    "description": "Punto de entrada principal del usuario en Header - Inicio.",
    "type": "inicial",
    "module": "Header",
}
```

Formato esperado de recorrido:

```python
{
    "id": "R001",
    "states": ["S1", "S24", "S96"],
    "description": "Recorrido base extraído del Colab original.",
}
```

Si el nuevo notebook trae matriz de conteos o probabilidades ya calculadas, se puede adaptar `matrix_service.py` para leerlas directamente. Si solo trae recorridos, el servicio actual las recalcula automáticamente.

## 13. Cómo agregar imágenes, logos o referencias visuales

Colocar logos en:

```text
frontend/public/logos/
```

Colocar imágenes de apoyo en:

```text
frontend/public/images/
```

Desde React se usan con rutas públicas:

```jsx
<img src="/logos/colombia-comparte-logo.png" alt="Colombia Comparte" />
```

La imagen `referencia-dashboard.png` se dejó como referencia visual del estilo entregado.

## 14. Cómo desplegar el backend en Render

1. Subir el proyecto a GitHub.
2. Crear un nuevo Web Service en Render.
3. Seleccionar el repositorio.
4. Configurar la carpeta raíz como `backend`.
5. Build command: `pip install -r requirements.txt`.
6. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
7. Agregar variables de entorno:
   - `APP_NAME=Colombia Comparte Simulator`
   - `ENV=production`
   - `ALLOWED_ORIGINS=https://tu-frontend.vercel.app`
8. Desplegar.
9. Copiar la URL pública del backend.

El archivo `backend/render.yaml` sirve como referencia para Render.

## 15. Cómo desplegar el frontend en Vercel

1. Importar el repositorio desde GitHub.
2. Seleccionar `frontend` como carpeta raíz.
3. Configurar la variable `VITE_API_URL` con la URL pública de Render.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Ejecutar deploy.
7. Probar la aplicación y revisar que `/api/health` responda desde el frontend.

## 16. Seguridad y buenas prácticas

- No guardar claves privadas en el frontend.
- No subir archivos `.env` reales.
- Usar `.env.example` como plantilla.
- La lógica de simulación, matrices y análisis vive en FastAPI.
- Las solicitudes HTTP pueden verse en Network del navegador; eso es normal.
- No exponer tokens, credenciales ni lógica sensible en React.
- En producción, evitar `ALLOWED_ORIGINS=*` y configurar el dominio real de Vercel.

## 17. Estado actual del proyecto

- [x] Estructura inicial creada.
- [x] Backend FastAPI creado.
- [x] Frontend React creado.
- [x] Estados cargados.
- [x] Recorridos base cargados.
- [x] Matriz de conteos generada.
- [x] Matriz de probabilidades generada.
- [x] Simulación implementada.
- [x] Dashboard implementado.
- [x] Página de resultados implementada.
- [x] Estado crítico implementado.
- [x] Recomendación implementada.
- [x] Escenario mejorado implementado.
- [x] Datos del Colab actual extraídos.
- [ ] Datos finales del Colab verificados con el equipo académico.
- [ ] Imágenes finales agregadas.
- [ ] Despliegue realizado.

## 18. Pendientes o mejoras futuras

- Exportar resultados a CSV desde la interfaz React.
- Descargar reporte PDF ejecutivo.
- Agregar más gráficas, como heatmap visual completo.
- Comparar varios escenarios mejorados en una misma vista.
- Agregar autenticación si se requiere restringir el acceso.
- Conectar con base de datos si el proyecto crece.
- Agregar pruebas automáticas de backend y frontend.
- Crear un script formal para reextraer datos desde nuevos notebooks.

## 19. Guía rápida para retomar el proyecto

1. Leer este `README_PROYECTO.md`.
2. Revisar el `README.md` principal.
3. Instalar dependencias del backend.
4. Instalar dependencias del frontend.
5. Crear los archivos `.env` desde `.env.example`.
6. Correr backend con Uvicorn.
7. Correr frontend con Vite.
8. Probar `/api/health`.
9. Ejecutar simulación desde la interfaz.
10. Verificar resultados, estado crítico y recomendación.

## 20. Explicación para exposición

Este proyecto modela cómo navegan los usuarios por la página Colombia Comparte. Un estado representa una acción o punto del sitio, por ejemplo entrar al inicio, abrir una noticia, completar un formulario o terminar en abandono.

Un recorrido es una secuencia de estados. Por ejemplo, un usuario puede iniciar en `S1`, pasar por una sección y finalizar en `S96`, que representa fin de recorrido dentro del sitio.

La matriz de conteos cuenta cuántas veces aparece cada transición entre estados en los recorridos base. Si un recorrido es `S1 -> S24 -> S96`, se suma una transición de `S1` a `S24` y otra de `S24` a `S96`.

La matriz de probabilidades se calcula dividiendo cada transición por el total de salidas del estado actual. Así, cada fila con salidas suma aproximadamente 1.

La simulación usa esas probabilidades para generar recorridos de usuarios. Cada usuario inicia en el estado configurado, avanza según la matriz y se detiene al llegar a un estado final, quedarse sin salidas o alcanzar el máximo de pasos.

Los resultados se interpretan agrupando los estados finales en éxito, abandono, error, seguimiento pendiente u otro/neutro. Esto permite entender qué porcentaje de usuarios termina bien, abandona o encuentra fricción.

El estado crítico se identifica de dos formas: primero, como el estado que aparece con más frecuencia justo antes de abandonar; segundo, como el estado con mayor probabilidad directa de ir hacia abandono, error o seguimiento en la matriz.

La recomendación ayuda a convertir el diagnóstico en acción. Si el estado crítico está relacionado con formularios, por ejemplo, la app sugiere reducir campos, agregar validación en tiempo real y mejorar la confirmación visual para aumentar la tasa de éxito.
