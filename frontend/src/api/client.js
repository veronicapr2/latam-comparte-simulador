const API_URL = import.meta.env.VITE_API_URL

async function request(path, options = {}) {
  if (!API_URL) {
    throw new Error('Falta configurar VITE_API_URL en el archivo .env del frontend.')
  }

  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!response.ok) {
    let detail = 'Error al comunicarse con el backend.'
    try {
      const payload = await response.json()
      detail = payload.detail || detail
    } catch {
      detail = await response.text()
    }
    throw new Error(detail)
  }

  return response.json()
}

export const api = {
  health: () => request('/api/health'),
  states: () => request('/api/states'),
  routes: () => request('/api/routes'),
  countMatrix: () => request('/api/matrix/counts'),
  probabilityMatrix: () => request('/api/matrix/probabilities'),
  simulate: (payload) =>
    request('/api/simulate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  criticalState: () => request('/api/analysis/critical-state'),
  improvedScenario: (payload) =>
    request('/api/analysis/improved-scenario', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}

export { API_URL }
