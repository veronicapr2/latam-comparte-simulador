import CriticalStateCard from '../components/CriticalStateCard'
import { CriticalRiskChart } from '../components/ResultChart'
import { formatPercent, normalizeText } from '../utils/formatters'

export default function CriticalStatePage({ criticalState }) {
  return (
    <section className="page-stack">
      <div className="page-heading">
        <h2>Estado crítico</h2>
      </div>

      <CriticalStateCard criticalState={criticalState} />

      <div className="content-grid">
        <article className="panel chart-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Riesgo directo</p>
              <h3>Ranking de estados críticos</h3>
            </div>
          </div>
          <CriticalRiskChart criticalState={criticalState} />
        </article>

        <article className="panel">
          <p className="eyebrow">Enfoque por simulación</p>
          <h3>Estado anterior al abandono</h3>
          <p>
            Se prioriza el estado inmediatamente anterior cuando el usuario termina en abandono.
          </p>
          <div className="table-card is-embedded">
            <table>
              <thead>
                <tr>
                  <th>Estado</th>
                  <th>Abandonos</th>
                  <th>% sobre abandonos</th>
                </tr>
              </thead>
              <tbody>
                {(criticalState?.critical_by_simulation?.ranking || []).map((row) => (
                  <tr key={row.state}>
                    <td>{row.state} - {normalizeText(row.name)}</td>
                    <td>{row.abandonments_from_state}</td>
                    <td>{formatPercent(row.percentage_over_abandonments)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>

      <article className="panel">
        <p className="eyebrow">Enfoque por matriz</p>
        <h3>Detalle del ranking de riesgo</h3>
        <div className="table-card is-embedded">
          <table>
            <thead>
              <tr>
                <th>Estado</th>
                <th>Módulo</th>
                <th>Riesgo</th>
              </tr>
            </thead>
            <tbody>
              {(criticalState?.ranking || []).map((row) => (
                <tr key={row.state}>
                  <td>{row.state} - {normalizeText(row.name)}</td>
                  <td>{normalizeText(row.module)}</td>
                  <td>{formatPercent(row.risk_percentage)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  )
}
