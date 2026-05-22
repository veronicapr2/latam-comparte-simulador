# Backend - Colombia Comparte Simulator

API REST construida con FastAPI. Contiene toda la lógica de simulación, construcción de matrices, clasificación de resultados, detección de estado crítico y simulación de escenarios mejorados.

## Ejecutar localmente

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

## Variables de entorno

```env
APP_NAME=Colombia Comparte Simulator
ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## Endpoints

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/health` | Estado del backend. |
| GET | `/api/states` | Estados reales extraídos del Colab. |
| GET | `/api/routes` | Recorridos base reales enriquecidos. |
| GET | `/api/matrix/counts` | Matriz de conteos. |
| GET | `/api/matrix/probabilities` | Matriz de probabilidades. |
| POST | `/api/simulate` | Simulación de usuarios. |
| GET | `/api/analysis/critical-state` | Estado crítico por matriz. |
| POST | `/api/analysis/improved-scenario` | Comparación antes/después. |

## Datos

- `app/data/states.py`: estados, nombres, tipos, módulos y clasificación final.
- `app/data/base_routes.py`: 499 recorridos base extraídos del notebook `ColComparte.ipynb`.

Si el Colab cambia, actualizar principalmente esos dos archivos.
