import Icon from './Icon'
import { formatPercent, normalizeText, titleCase } from '../utils/formatters'

export default function CriticalStateCard({ criticalState }) {
  if (!criticalState?.state) {
    return <div className="empty-state">No hay estado crítico identificado todavía.</div>
  }

  return (
    <article className="critical-card">
      <div className="critical-card-main">
        <div className="critical-icon">
          <Icon name="critical" size={28} />
        </div>
        <p className="eyebrow">Estado crítico detectado</p>
        <h2>
          {criticalState.state} - {normalizeText(criticalState.name)}
        </h2>
        <p>{normalizeText(criticalState.description)}</p>
      </div>
      <dl className="critical-grid">
        <div>
          <dt>Tipo</dt>
          <dd>{titleCase(criticalState.type)}</dd>
        </div>
        <div>
          <dt>Módulo</dt>
          <dd>{normalizeText(criticalState.module)}</dd>
        </div>
        <div>
          <dt>Abandonos asociados</dt>
          <dd>{criticalState.abandonments_from_state || 0}</dd>
        </div>
        <div>
          <dt>% sobre abandonos</dt>
          <dd>{formatPercent(criticalState.percentage_over_abandonments)}</dd>
        </div>
        <div>
          <dt>Prob. directa abandono</dt>
          <dd>{formatPercent(criticalState.direct_abandonment_percentage)}</dd>
        </div>
        <div>
          <dt>Prob. directa error</dt>
          <dd>{formatPercent(criticalState.direct_error_percentage)}</dd>
        </div>
      </dl>
    </article>
  )
}
