import Icon from '../components/Icon'
import StatCard from '../components/StatCard'
import { formatNumber, normalizeText, titleCase } from '../utils/formatters'

export default function SimulationPage({ config, simulation, summary, isRunning, onRunSimulation }) {
  return (
    <section className="page-stack">
      <div className="page-heading">
        <h2>Simulación de usuarios</h2>
        <button className="primary-button page-action-button" onClick={() => onRunSimulation('simulation')} disabled={isRunning}>
          <Icon name="simulation" size={18} />
          {isRunning ? 'Simulando...' : 'Ejecutar simulación'}
        </button>
      </div>

      <div className="stat-grid four">
        <StatCard label="Usuarios configurados" value={formatNumber(config.num_users)} tone="blue" icon="users" />
        <StatCard label="Máximo de pasos" value={config.max_steps} tone="purple" icon="steps" />
        <StatCard label="Estado inicial" value={config.initial_state} tone="cyan" icon="target" />
        <StatCard label="Usuarios en resultado" value={formatNumber(summary?.total_users)} tone="green" icon="success" />
      </div>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <h3>Usuarios simulados</h3>
          </div>
          <span>Primeros 30 registros</span>
        </div>
        <div className="table-card is-embedded">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Recorrido</th>
                <th>Estado final</th>
                <th>Resultado</th>
                <th>Pasos</th>
              </tr>
            </thead>
            <tbody>
              {simulation.slice(0, 30).map((row) => (
                <tr key={row.user}>
                  <td className="code-cell">U{row.user}</td>
                  <td>{row.coded_route}</td>
                  <td>{row.final_state} - {normalizeText(row.final_state_name)}</td>
                  <td>{titleCase(row.result)}</td>
                  <td>{row.steps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  )
}
