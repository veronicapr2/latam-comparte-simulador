import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from './api/client'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import StatesPage from './pages/StatesPage'
import RoutesPage from './pages/RoutesPage'
import MatricesPage from './pages/MatricesPage'
import SimulationPage from './pages/SimulationPage'
import ResultsPage from './pages/ResultsPage'
import CriticalStatePage from './pages/CriticalStatePage'
import RecommendationPage from './pages/RecommendationPage'
import SimulationHistoryPage from './pages/SimulationHistory'
import { DEFAULT_RECOMMENDATION_MODEL, generateNlpRecommendation } from './services/nlpRecommendation'
import {
  buildSimulationHistoryEntry,
  clearSimulationHistory,
  deleteSimulationHistory,
  getSimulationHistory,
  saveSimulationHistory,
  updateSimulationHistoryRecommendation,
} from './utils/simulationHistory'

const defaultConfig = {
  num_users: 1000,
  max_steps: 20,
  initial_state: 'S1',
}

const RECOMMENDATION_MODEL = DEFAULT_RECOMMENDATION_MODEL
const RECOMMENDATION_GROUP = 'LatinoAmerica Comparte'

const pageTitles = {
  dashboard: 'Dashboard',
  states: 'Estados',
  routes: 'Recorridos base',
  countsMatrix: 'Matriz de conteos',
  probabilityMatrix: 'Matriz de probabilidades',
  simulation: 'Simulación',
  results: 'Resultados',
  critical: 'Estado crítico',
  history: 'Historial de simulaciones',
}

export default function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [health, setHealth] = useState(null)
  const [states, setStates] = useState([])
  const [routes, setRoutes] = useState([])
  const [countMatrix, setCountMatrix] = useState(null)
  const [probabilityMatrix, setProbabilityMatrix] = useState(null)
  const [simulationResponse, setSimulationResponse] = useState(null)
  const [criticalState, setCriticalState] = useState(null)
  const [recommendation, setRecommendation] = useState(null)
  const [recommendationStatus, setRecommendationStatus] = useState({ isGenerating: false })
  const [improvedScenario, setImprovedScenario] = useState(null)
  const [simulationHistory, setSimulationHistory] = useState([])
  const [selectedHistoryId, setSelectedHistoryId] = useState(null)
  const [config, setConfig] = useState(defaultConfig)
  const [isLoading, setIsLoading] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [isImproving, setIsImproving] = useState(false)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const [error, setError] = useState('')
  const recommendationRequestRef = useRef(0)
  const documentTitle = pageTitles[activePage] || 'Dashboard'

  useEffect(() => {
    document.title = documentTitle
  }, [documentTitle])

  useEffect(() => {
    let isMounted = true

    async function loadInitialData() {
      try {
        setIsLoading(true)
        const [healthData, statesData, routesData, countData, probabilityData, criticalData] =
          await Promise.all([
            api.health(),
            api.states(),
            api.routes(),
            api.countMatrix(),
            api.probabilityMatrix(),
            api.criticalState(),
          ])

        if (!isMounted) return
        setHealth(healthData)
        setStates(statesData)
        setRoutes(routesData)
        setCountMatrix(countData)
        setProbabilityMatrix(probabilityData)
        setCriticalState(criticalData)
        setRecommendation(criticalData.recommendation)

        const initialSimulation = await api.simulate(defaultConfig)
        if (!isMounted) return
        setSimulationResponse(initialSimulation)
        setCriticalState(initialSimulation.critical_state)
        setRecommendation(initialSimulation.recommendation)

        const storedHistory = getSimulationHistory()
        setSimulationHistory(storedHistory)
        setSelectedHistoryId(storedHistory[0]?.id || null)
      } catch (loadError) {
        if (isMounted) setError(loadError.message)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadInitialData()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!simulationResponse) return

    let isCurrent = true
    const requestId = recommendationRequestRef.current + 1
    recommendationRequestRef.current = requestId

    setRecommendation(simulationResponse.recommendation || null)
    setRecommendationStatus({
      isGenerating: true,
      model: RECOMMENDATION_MODEL,
      group: RECOMMENDATION_GROUP,
    })

    async function buildRecommendation() {
      const generatedRecommendation = await generateNlpRecommendation(simulationResponse, {
        model: RECOMMENDATION_MODEL,
        group: RECOMMENDATION_GROUP,
      })

      if (!isCurrent || recommendationRequestRef.current !== requestId) return

      setRecommendation(generatedRecommendation)
      setRecommendationStatus({
        isGenerating: false,
        model: RECOMMENDATION_MODEL,
        group: RECOMMENDATION_GROUP,
        source: generatedRecommendation.recommendation_source,
        modelUsed: generatedRecommendation.model_used,
      })

      if (simulationResponse.history_id) {
        const nextHistory = updateSimulationHistoryRecommendation(simulationResponse.history_id, generatedRecommendation)
        setSimulationHistory(nextHistory)
        try {
          window.dispatchEvent(new Event('simulation-history-updated'))
        } catch {}
      }
    }

    buildRecommendation().catch((recommendationError) => {
      if (!isCurrent || recommendationRequestRef.current !== requestId) return
      setRecommendationStatus({
        isGenerating: false,
        model: RECOMMENDATION_MODEL,
        group: RECOMMENDATION_GROUP,
        error: recommendationError.message,
      })
    })

    return () => {
      isCurrent = false
    }
  }, [simulationResponse])

  const summary = simulationResponse?.summary
  const simulation = simulationResponse?.simulation || []
  const selectedHistorySimulation = simulationHistory.find((item) => item.id === selectedHistoryId) || simulationHistory[0] || null

  const modules = useMemo(() => {
    return [...new Set(states.map((state) => state.module))].sort()
  }, [states])

  async function runSimulation(nextPage = 'simulation') {
    try {
      setIsRunning(true)
      setError('')
      const response = await api.simulate(config)
      const improvedScenarioSnapshot =
        improvedScenario?.comparison?.length && improvedScenario?.target_state === response?.critical_state?.state
          ? improvedScenario
          : null
      const builtEntry = buildSimulationHistoryEntry({
        response,
        config,
        improvedScenario: improvedScenarioSnapshot,
      })
      const historySaved = saveSimulationHistory(builtEntry)
      // notify listeners that history changed
      try {
        window.dispatchEvent(new Event('simulation-history-updated'))
      } catch {}

      const historyEntry = builtEntry
      setSimulationResponse({ ...response, history_id: historyEntry.id })
      setCriticalState(response.critical_state)
      setRecommendation(response.recommendation)
      setImprovedScenario(null)
      setSimulationHistory(historySaved)
      setSelectedHistoryId(historyEntry.id)
      setActivePage(nextPage)
    } catch (runError) {
      setError(runError.message)
    } finally {
      setIsRunning(false)
    }
  }

  async function runImprovedScenario(abandonmentReduction, targetState) {
    try {
      setIsImproving(true)
      setError('')
      const response = await api.improvedScenario({
        ...config,
        abandonment_reduction: abandonmentReduction,
        target_state: targetState,
      })
      setImprovedScenario(response)
    } catch (scenarioError) {
      setError(scenarioError.message)
    } finally {
      setIsImproving(false)
    }
  }

  function handleDeleteHistory(id) {
    deleteSimulationHistory(id)
    // update state immediately
    const nextHistory = getSimulationHistory()
    setSimulationHistory(nextHistory)
    setSelectedHistoryId((currentSelected) => {
      if (currentSelected === id || !nextHistory.some((item) => item.id === currentSelected)) {
        return nextHistory[0]?.id || null
      }
      return currentSelected
    })
    try {
      window.dispatchEvent(new Event('simulation-history-updated'))
    } catch {}
  }

  function handleClearHistory() {
    clearSimulationHistory()
    setSimulationHistory([])
    setSelectedHistoryId(null)
    try {
      window.dispatchEvent(new Event('simulation-history-updated'))
    } catch {}
  }

  const sharedProps = {
    states,
    routes,
    modules,
    countMatrix,
    probabilityMatrix,
    simulationResponse,
    simulation,
    summary,
    criticalState,
    recommendation,
    recommendationStatus,
    improvedScenario,
    config,
    isRunning,
    isImproving,
    onNavigate: setActivePage,
    onRunSimulation: runSimulation,
    onImprovedScenario: runImprovedScenario,
    historyItems: simulationHistory,
    selectedHistoryId,
    selectedHistorySimulation,
    onSelectHistory: setSelectedHistoryId,
    onDeleteHistory: handleDeleteHistory,
    onClearHistory: handleClearHistory,
  }

  const pages = {
    dashboard: <Dashboard {...sharedProps} />,
    states: <StatesPage {...sharedProps} />,
    routes: <RoutesPage {...sharedProps} />,
    matrices: <MatricesPage {...sharedProps} />,
    countsMatrix: <MatricesPage {...sharedProps} defaultMode="counts" />,
    probabilityMatrix: <MatricesPage {...sharedProps} defaultMode="probabilities" />,
    simulation: <SimulationPage {...sharedProps} />,
    results: <ResultsPage {...sharedProps} />,
    critical: <CriticalStatePage {...sharedProps} />,
    recommendation: <RecommendationPage {...sharedProps} />,
    history: <SimulationHistoryPage {...sharedProps} />,
  }

  return (
    <div className="app-viewport">
      <div className={`app-shell ${isSidebarExpanded ? 'is-sidebar-expanded' : 'is-sidebar-collapsed'}`}>
        <Sidebar
          config={config}
          states={states}
          activePage={activePage}
          isRunning={isRunning}
          isCollapsed={!isSidebarExpanded}
          onExpand={() => setIsSidebarExpanded(true)}
          onCollapse={() => setIsSidebarExpanded(false)}
          onConfigChange={(partial) => setConfig((current) => ({ ...current, ...partial }))}
          onRunSimulation={() => runSimulation('simulation')}
          onNavigate={setActivePage}
        />
        <main className="main-area">
          <Navbar health={health} onNavigate={setActivePage} onRunSimulation={runSimulation} isRunning={isRunning} />
          {error ? <div className="app-alert">{error}</div> : null}
          {isLoading ? (
            <div className="loading-panel">Cargando recorridos y preparando la simulación...</div>
          ) : (
            pages[activePage]
          )}
        </main>
      </div>
    </div>
  )
}
