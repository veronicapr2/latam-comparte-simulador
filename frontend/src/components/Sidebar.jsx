import { useEffect, useRef } from 'react'
import Icon from './Icon'
import { normalizeText } from '../utils/formatters'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'states', label: 'Estados', icon: 'states' },
  { id: 'routes', label: 'Recorridos base', icon: 'routes' },
  { id: 'countsMatrix', label: 'Matriz de conteos', icon: 'counts' },
  { id: 'probabilityMatrix', label: 'Matriz de probabilidades', icon: 'probabilities' },
  { id: 'simulation', label: 'Simulación', icon: 'simulation' },
  { id: 'results', label: 'Resultados', icon: 'results' },
  { id: 'critical', label: 'Estado crítico', icon: 'critical' },
  { id: 'recommendation', label: 'Mejora recomendada', icon: 'recommendation' },
  { id: 'history', label: 'Historial de simulaciones', icon: 'history' },
]

export default function Sidebar({
  config,
  states,
  activePage,
  isRunning,
  isCollapsed,
  onExpand,
  onCollapse,
  onConfigChange,
  onRunSimulation,
  onNavigate,
}) {
  const sidebarRef = useRef(null)
  const closeTimerRef = useRef(null)

  function clearCloseTimer() {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  useEffect(() => {
    return clearCloseTimer
  }, [])

  function handleExpand() {
    clearCloseTimer()
    onExpand()
  }

  function requestCollapse() {
    clearCloseTimer()
    closeTimerRef.current = window.setTimeout(() => {
      const sidebar = sidebarRef.current
      if (!sidebar || sidebar.matches(':hover') || sidebar.contains(document.activeElement)) {
        return
      }
      onCollapse()
    }, 140)
  }

  function handleBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      requestCollapse()
    }
  }

  return (
    <aside
      ref={sidebarRef}
      className={`sidebar ${isCollapsed ? 'is-collapsed' : 'is-expanded'}`}
      onMouseEnter={handleExpand}
      onMouseLeave={requestCollapse}
      onFocus={handleExpand}
      onBlur={handleBlur}
    >
      <div className="sidebar-top">
        <button className="brand-inline brand-button" onClick={() => onNavigate('dashboard')} title="LatinoAmerica Comparte">
          <img className="brand-logo brand-logo-inline" src="/logo/LatinoamericaComparte.png" alt="LatinoAmerica Comparte" />
          <span className="brand-name sidebar-brand-text">LatinoAmerica Comparte</span>
        </button>
      </div>

      <section className="sidebar-section config-card config-panel">
        <div className="section-title-row">
          <div>
            <p className="eyebrow sidebar-section-title">Configuración</p>
            <h2 className="sidebar-text">Simulación</h2>
          </div>
          <Icon name="simulation" size={18} />
        </div>

        <label className="control-group">
          <span>Número de usuarios</span>
          <input
            type="number"
            min="1"
            max="50000"
            value={config.num_users}
            onChange={(event) => onConfigChange({ num_users: Number(event.target.value) })}
          />
        </label>

        <label className="control-group">
          <span>Máximo de pasos</span>
          <input
            type="number"
            min="2"
            max="200"
            value={config.max_steps}
            onChange={(event) => onConfigChange({ max_steps: Number(event.target.value) })}
          />
        </label>

        <label className="control-group">
          <span>Estado inicial</span>
          <select
            value={config.initial_state}
            onChange={(event) => onConfigChange({ initial_state: event.target.value })}
          >
            {states.map((state) => (
              <option key={state.code} value={state.code}>
                {state.code} - {normalizeText(state.name)}
              </option>
            ))}
          </select>
        </label>

        <button className="primary-button run-button" onClick={onRunSimulation} disabled={isRunning}>
          <Icon name="simulation" size={18} />
          {isRunning ? 'Simulando...' : 'Ejecutar simulación'}
        </button>
      </section>

      <section className="sidebar-section nav-card">
        <p className="sidebar-title sidebar-section-title">Menú</p>
        <nav className="side-nav" aria-label="Navegación principal">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activePage === item.id ? 'is-active' : ''}`}
              onClick={() => onNavigate(item.id)}
              title={item.label}
            >
              <span className="nav-icon" aria-hidden="true">
                <Icon name={item.icon} size={19} />
              </span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </section>

    </aside>
  )
}
