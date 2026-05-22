const STORAGE_KEY = 'latinoamericaComparte.simulationHistory'
const SIMULATED_USERS_PREVIEW_LIMIT = 30

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readHistory() {
  if (!canUseStorage()) {
    return []
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeHistory(history) {
  if (!canUseStorage()) {
    return history
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch (error) {
    if (error?.name !== 'QuotaExceededError' && error?.code !== 22) {
      throw error
    }

    const trimmedHistory = history
      .map((item) => compactSimulationEntry(item))
      .slice(0, Math.max(1, Math.floor(history.length / 2)))

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory))
    return trimmedHistory
  }

  return history
}

function compactSimulatedUsers(simulatedUsers = []) {
  return simulatedUsers.slice(0, SIMULATED_USERS_PREVIEW_LIMIT).map((user) => ({
    user: user.user,
    coded_route: user.coded_route,
    translated_route: user.translated_route,
    final_state: user.final_state,
    final_state_name: user.final_state_name,
    result: user.result,
    steps: user.steps,
  }))
}

function compactImprovedScenario(improvedScenario = null) {
  if (!improvedScenario) {
    return null
  }

  return {
    target_state: improvedScenario.target_state,
    abandonment_reduction: improvedScenario.abandonment_reduction,
    current_summary: improvedScenario.current_summary,
    improved_summary: improvedScenario.improved_summary,
    comparison: improvedScenario.comparison,
    conclusion: improvedScenario.conclusion,
    recommendation: improvedScenario.recommendation,
  }
}

export function compactSimulationEntry(entry) {
  if (!entry) {
    return entry
  }

  return {
    id: entry.id,
    createdAt: entry.createdAt,
    createdAtLabel: entry.createdAtLabel,
    config: entry.config,
    results: entry.results,
    criticalState: entry.criticalState,
    recommendation: entry.recommendation,
    improvedScenario: compactImprovedScenario(entry.improvedScenario),
    simulatedUsersPreview: compactSimulatedUsers(entry.simulatedUsersPreview || entry.simulatedUsers || []),
    simulatedUsersCount:
      entry.simulatedUsersCount ?? entry.results?.total_users ?? entry.simulatedUsers?.length ?? 0,
  }
}

export function buildSimulationHistoryEntry({ response, config, improvedScenario = null }) {
  const now = new Date()
  return {
    id: `SIM-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    createdAt: now.toISOString(),
    createdAtLabel: now.toLocaleString('es-CO'),
    config: {
      users: config?.num_users ?? 0,
      maxSteps: config?.max_steps ?? 0,
      initialState: config?.initial_state ?? '',
    },
    results: response?.summary || {},
    criticalState: response?.critical_state || null,
    recommendation: response?.recommendation || null,
    improvedScenario: compactImprovedScenario(improvedScenario),
    simulatedUsersPreview: compactSimulatedUsers(response?.simulation || []),
    simulatedUsersCount: response?.summary?.total_users ?? response?.simulation?.length ?? 0,
  }
}

export function getSimulationHistory() {
  return readHistory()
    .map((item) => compactSimulationEntry(item))
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
}

export function getSimulationById(id) {
  return getSimulationHistory().find((item) => item.id === id) || null
}

export function saveSimulationHistory(simulation) {
  const history = getSimulationHistory()
  const nextHistory = [compactSimulationEntry(simulation), ...history.filter((item) => item.id !== simulation.id)]
  return writeHistory(nextHistory)
}

export function updateSimulationHistoryRecommendation(id, recommendation) {
  if (!id || !recommendation) {
    return getSimulationHistory()
  }

  const history = getSimulationHistory()
  const nextHistory = history.map((item) => (item.id === id ? compactSimulationEntry({ ...item, recommendation }) : item))
  return writeHistory(nextHistory)
}

export function deleteSimulationHistory(id) {
  const nextHistory = getSimulationHistory().filter((item) => item.id !== id)
  return writeHistory(nextHistory)
}

export function clearSimulationHistory() {
  if (!canUseStorage()) {
    return []
  }

  window.localStorage.removeItem(STORAGE_KEY)
  return []
}

export { STORAGE_KEY }
