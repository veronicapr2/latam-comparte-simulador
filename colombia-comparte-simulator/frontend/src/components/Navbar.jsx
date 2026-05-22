import Icon from './Icon'

export default function Navbar({ onNavigate, onRunSimulation, isRunning }) {
  return (
    <header className="navbar dashboard-header header-topbar">
      <div className="nav-actions header-actions">
        <button className="icon-button" onClick={() => onNavigate('results')} title="Resultados">
          <Icon name="results" size={18} />
        </button>
        <button className="primary-button header-button" onClick={() => onNavigate('recommendation')}>
          <Icon name="recommendation" size={18} />
          Ver mejora
        </button>
        <button className="primary-button header-button" onClick={() => onRunSimulation?.('simulation')} disabled={isRunning}>
          <Icon name="simulation" size={18} />
          {isRunning ? 'Simulando...' : 'Ejecutar simulación'}
        </button>
      </div>

      <button className="brand-inline header-brand" onClick={() => onNavigate('dashboard')} title="LatinoAmerica Comparte">
        <img className="brand-logo brand-logo-inline" src="/logo/LatinoamericaComparte.png" alt="LatinoAmerica Comparte" />
        <span className="brand-name header-brand-text">LatinoAmerica Comparte</span>
      </button>
    </header>
  )
}
