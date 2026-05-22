import StatCard from '../components/StatCard'
import { AverageStepsChart, FinalStatesBarChart, ResultDistributionChart } from '../components/ResultChart'
import { formatNumber, formatPercent, normalizeText, titleCase } from '../utils/formatters'

export default function ResultsPage({ summary }) {
  return (
    <section className="page-stack">
      <div className="page-heading">
        <h2>Resultados de la simulación</h2>
        <span>{formatNumber(summary?.total_users)} usuarios</span>
      </div>

      <div className="stat-grid five">
        <StatCard label="Éxito" value={formatPercent(summary?.success_percentage)} tone="green" icon="success" />
        <StatCard label="Abandono" value={formatPercent(summary?.abandonment_percentage)} tone="red" icon="abandon" />
        <StatCard label="Error" value={formatPercent(summary?.error_percentage)} tone="amber" icon="error" />
        <StatCard label="Seguimiento pendiente" value={formatPercent(summary?.follow_up_percentage)} tone="blue" icon="follow" />
        <StatCard label="Promedio de pasos" value={summary?.average_steps || 0} tone="purple" icon="steps" />
      </div>

      <div className="content-grid">
        <article className="panel chart-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Distribución</p>
              <h3>Resultados por tipo</h3>
            </div>
            <span>{titleCase(summary?.most_common_result || '')}</span>
          </div>
          <ResultDistributionChart summary={summary} variant="donut" />
        </article>

        <article className="panel chart-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Estados finales</p>
              <h3>Top por volumen</h3>
            </div>
          </div>
          <FinalStatesBarChart summary={summary} />
        </article>
      </div>

      <div className="content-grid">
        <article className="panel">
          <p className="eyebrow">Tabla resumen</p>
          <h3>Resultados finales</h3>
          <div className="table-card is-embedded">
            <table>
              <thead>
                <tr>
                  <th>Estado final</th>
                  <th>Cantidad</th>
                  <th>Porcentaje</th>
                </tr>
              </thead>
              <tbody>
                {(summary?.final_state_counts || []).slice(0, 10).map((row) => (
                  <tr key={row.state}>
                    <td>{row.state} - {normalizeText(row.name)}</td>
                    <td>{row.count}</td>
                    <td>{formatPercent(row.percentage)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel chart-card">
          <p className="eyebrow">Pasos</p>
          <h3>Promedio por resultado</h3>
          <AverageStepsChart summary={summary} />
        </article>
      </div>

      <div className="content-grid">
        <article className="panel">
          <p className="eyebrow">Top 5</p>
          <h3>Recorridos más frecuentes</h3>
          <div className="table-card is-embedded">
            <table>
              <thead>
                <tr>
                  <th>Recorrido</th>
                  <th>Cantidad</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {(summary?.top_routes || []).map((row) => (
                  <tr key={row.route}>
                    <td>{row.route}</td>
                    <td>{row.count}</td>
                    <td>{formatPercent(row.percentage)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel">
          <p className="eyebrow">Pasos</p>
          <h3>Detalle por resultado</h3>
          <div className="table-card is-embedded">
            <table>
              <thead>
                <tr>
                  <th>Resultado</th>
                  <th>Promedio pasos</th>
                  <th>Usuarios</th>
                </tr>
              </thead>
              <tbody>
                {(summary?.average_steps_by_result || []).map((row) => (
                  <tr key={row.result}>
                    <td>{titleCase(row.result)}</td>
                    <td>{row.average_steps}</td>
                    <td>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  )
}
