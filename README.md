# Colombia Comparte Simulator

Proyecto completo para simular recorridos de usuarios de la página Colombia Comparte usando estados, recorridos base, matriz de conteos, matriz de probabilidades y cadenas de Markov.

## Tecnologías

- Frontend: React + Vite.
- Backend: FastAPI + Python.
- Visualización: Recharts.
- Comunicación: API REST.
- Despliegue sugerido: Vercel para frontend y Render para backend.

## Estructura

```text
colombia-comparte-simulator/
├── backend/
│   ├── app/
│   ├── requirements.txt
│   ├── .env.example
│   └── render.yaml
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── .env.example
│   └── vite.config.js
├── README.md
└── README_PROYECTO.md
```

## Ejecutar backend localmente

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

Backend local: `http://localhost:8000`

## Ejecutar frontend localmente

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend local: `http://localhost:5173`

## Variables de entorno

Frontend:

```env
VITE_API_URL=http://localhost:8000
```

Backend:

```env
APP_NAME=Colombia Comparte Simulator
ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## Endpoints principales

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/health` | Verifica que el backend esté activo. |
| GET | `/api/states` | Retorna los estados del modelo. |
| GET | `/api/routes` | Retorna los recorridos base enriquecidos. |
| GET | `/api/matrix/counts` | Retorna la matriz de conteos. |
| GET | `/api/matrix/probabilities` | Retorna la matriz de probabilidades. |
| POST | `/api/simulate` | Ejecuta la simulación de usuarios. |
| GET | `/api/analysis/critical-state` | Retorna el análisis del estado crítico. |
| POST | `/api/analysis/improved-scenario` | Simula un escenario mejorado. |

## Despliegue

Backend en Render:

1. Subir el proyecto a GitHub.
2. Crear un Web Service.
3. Usar `backend` como carpeta raíz.
4. Build command: `pip install -r requirements.txt`.
5. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
6. Configurar `APP_NAME`, `ENV=production` y `ALLOWED_ORIGINS`.

Frontend en Vercel:

1. Importar el repositorio.
2. Usar `frontend` como carpeta raíz.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Configurar `VITE_API_URL` con la URL pública del backend en Render.

Para la guía completa, revisar `README_PROYECTO.md`.
