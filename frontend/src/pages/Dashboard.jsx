import Icon from '../components/Icon'
import StatCard from '../components/StatCard'
import {
  AverageStepsChart,
  CriticalRiskChart,
  FinalStatesBarChart,
  ResultDistributionChart,
  ScenarioComparisonChart,
} from '../components/ResultChart'
import { formatNumber, formatPercent, normalizeText, titleCase } from '../utils/formatters'

export default function Dashboard({
  states,
  routes,
  summary,
  criticalState,
  improvedScenario,
}) {
  const resultRows = Object.entries(summary?.result_counts || {}).map(([result, count]) => ({
    result,
    count,
    percentage: summary?.result_percentages?.[result] || 0,
  }))
  const topFinalStates = summary?.final_state_counts?.slice(0, 4) || []
  const improvedLabel = improvedScenario?.improved_summary
    ? `${formatPercent(improvedScenario.improved_summary.success_percentage)} éxito`
    : 'Sin simular'

  return (
    <section className="page-stack dashboard-page">
      <div className="dashboard-title-row">
        <h2>Dashboard</h2>
      </div>

      <div className="metric-card-row">
        <article className="metric-card gradient-blue">
          <span>Usuarios simulados</span>
          <strong>{formatNumber(summary?.total_users)}</strong>
          <small>{formatNumber(states.length)} estados</small>
        </article>
        <article className="metric-card gradient-pink">
          <span>Tasa de abandono</span>
          <strong>{formatPercent(summary?.abandonment_percentage)}</strong>
          <small>{formatNumber(routes.length)} recorridos base</small>
        </article>
        <article className="metric-card gradient-green">
          <span>Tasa de éxito</span>
          <strong>{formatPercent(summary?.success_percentage)}</strong>
          <small>{titleCase(summary?.most_common_result || 'Pendiente')}</small>
        </article>
      </div>

      <div className="reference-dashboard-grid">
        <article className="panel recent-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Resultados</p>
              <h3>Distribución final</h3>
            </div>
          </div>
          <div className="transaction-list">
            {resultRows.map((row) => (
              <div className="transaction-row" key={row.result}>
                <span className={`transaction-icon result-${normalizeText(row.result).replaceAll(' ', '-')}`}>
                  <Icon name={row.result.includes('error') ? 'error' : row.result.includes('abandono') ? 'abandon' : 'success'} size={17} />
                </span>
                <div>
                  <strong>{titleCase(row.result)}</strong>
                  <small>{formatNumber(row.count)} usuarios</small>
                </div>
                <b>{formatPercent(row.percentage)}</b>
              </div>
            ))}
          </div>
        </article>

        <article className="panel chart-card balance-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Resumen</p>
              <h3>Usuarios por resultado</h3>
            </div>
          </div>
          <ResultDistributionChart summary={summary} variant="donut" />
        </article>

      </div>

      <div className="dashboard-chart-layout">
        <article className="panel chart-card statistics-card dashboard-volume-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Estadísticas</p>
              <h3>Volumen por resultado</h3>
            </div>
            <span>{formatPercent(summary?.success_percentage)} éxito</span>
          </div>
          <ResultDistributionChart summary={summary} height={320} />
        </article>

        <div className="dashboard-pair-charts">
          <article className="panel chart-card dashboard-half-chart">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Estados</p>
                <h3>Top estados finales</h3>
              </div>
            </div>
            <FinalStatesBarChart summary={summary} height={300} />
          </article>

          <article className="panel chart-card dashboard-half-chart">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Riesgo</p>
                <h3>Estados críticos</h3>
              </div>
            </div>
            <CriticalRiskChart criticalState={criticalState} height={300} />
          </article>
        </div>
      </div>

      <div className="stat-grid dashboard-kpis">
        <StatCard label="Promedio de pasos" value={summary?.average_steps || 0} tone="purple" icon="steps" />
        <StatCard label="Error" value={formatPercent(summary?.error_percentage)} tone="pink" icon="error" />
        <StatCard label="Seguimiento" value={formatPercent(summary?.follow_up_percentage)} tone="blue" icon="follow" />
        <StatCard label="Escenario mejorado" value={improvedLabel} tone="green" icon="spark" />
      </div>

      <div className="content-grid dashboard-bottom">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Top final</p>
              <h3>Estados con mayor volumen</h3>
            </div>
          </div>
          <div className="insight-list">
            {topFinalStates.map((row) => (
              <div className="insight-row" key={row.state}>
                <div>
                  <strong>{row.state}</strong>
                  <span>{normalizeText(row.name)}</span>
                </div>
                <b>{formatPercent(row.percentage)}</b>
              </div>
            ))}
          </div>
        </article>

        <article className="panel chart-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Pasos</p>
              <h3>Promedio por resultado</h3>
            </div>
          </div>
          <AverageStepsChart summary={summary} />
        </article>
      </div>

      {improvedScenario?.comparison?.length ? (
        <article className="panel chart-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Escenario mejorado</p>
              <h3>Inicial vs mejorado</h3>
            </div>
          </div>
          <ScenarioComparisonChart comparison={improvedScenario.comparison} />
        </article>
      ) : null}
    </section>
  )
}
