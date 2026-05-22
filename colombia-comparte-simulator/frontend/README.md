# Frontend - Colombia Comparte Simulator

Interfaz React + Vite para visualizar estados, recorridos base, matrices, simulación, resultados, estado crítico y mejora recomendada.

## Ejecutar localmente

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

La app se abre en `http://localhost:5173`.

## Variables de entorno

```env
VITE_API_URL=http://localhost:8000
```

En producción, configurar `VITE_API_URL` en Vercel con la URL pública del backend desplegado en Render.

## Build

```bash
npm run build
```

La carpeta de salida para Vercel es `dist`.

## Estructura principal

- `src/api/client.js`: cliente REST centralizado.
- `src/components/`: componentes reutilizables.
- `src/pages/`: vistas principales de la aplicación.
- `src/styles/global.css`: estilos globales modernos y responsivos.
- `public/logos/`: logo o imagen de marca.
- `public/images/`: imágenes de referencia.
