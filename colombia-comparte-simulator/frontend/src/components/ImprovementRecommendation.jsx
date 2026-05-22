import Icon from './Icon'
import { normalizeText } from '../utils/formatters'

const labels = {
  estado_analizado: 'Estado analizado',
  problema_detectado: 'Problema detectado',
  posible_causa: 'Posible causa',
  mejora_recomendada: 'Mejora recomendada',
  accion_esperada: 'Acción esperada',
  indicador_para_validar: 'Indicador para validar',
  resultado_esperado: 'Resultados esperados',
}

const importantLabels = [
  'Qué hacer:',
  'Por qué hacerlo:',
  'Cómo hacerlo paso a paso:',
]

const cardToneByKey = {
  estado_analizado: 'blue',
  problema_detectado: 'pink',
  posible_causa: 'amber',
  accion_esperada: 'green-strong',
  indicador_para_validar: 'blue-strong',
  resultado_esperado: 'green',
}

function renderHighlightedText(text, className) {
  const paragraphs = normalizeText(text).split(/\n{2,}/).filter(Boolean)

  return (
    <div className={className}>
      {paragraphs.map((paragraph, paragraphIndex) => (
        <p key={`${paragraph.slice(0, 24)}-${paragraphIndex}`}>
          {renderHighlightedSegments(paragraph, paragraph.includes('Cómo hacerlo paso a paso:'))}
        </p>
      ))}
    </div>
  )
}

function renderHighlightedSegments(text, highlightStepNumbers = false) {
  const escapedLabels = importantLabels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp(`(${escapedLabels.join('|')}${highlightStepNumbers ? '|\\b\\d+\\.(?=\\s)' : ''})`, 'g')

  return text
    .split(pattern)
    .filter(Boolean)
    .map((segment, index) => {
      const isImportant = importantLabels.includes(segment) || (highlightStepNumbers && /^\d+\.$/.test(segment))
      return isImportant ? <strong key={`${segment}-${index}`}>{segment}</strong> : segment
    })
}

export default function ImprovementRecommendation({
  simulationData,
  recommendation,
}) {
  const hasSimulation = Boolean(simulationData?.summary || simulationData?.results)
  const emptyText = hasSimulation ? 'Generando recomendación basada en la simulación.' : 'Pendiente de simulación.'
  const statusText = 'Recomendación actualizada automáticamente'
  const priorityActions = Array.isArray(recommendation?.acciones_prioritarias)
    ? recommendation.acciones_prioritarias
    : []
  const expectedImpact = recommendation?.impacto_esperado || {}

  function renderImprovementCard(label) {
    return (
      <div key="mejora_recomendada" className="recommendation-card recommendation-feature-card">
        <span>{label}</span>
        {renderHighlightedText(recommendation?.mejora_recomendada || emptyText, 'recommendation-feature-text')}

        {priorityActions.length ? (
          <div className="recommendation-action-list">
            <span className="recommendation-section-title">Acciones prioritarias</span>
            <ol>
              {priorityActions.map((action, index) => (
                <li key={`${action}-${index}`}>{normalizeText(action)}</li>
              ))}
            </ol>
          </div>
        ) : null}

        <div className="recommendation-impact">
          <span className="recommendation-section-title">Resultado esperado si se aplica</span>
          <div className="recommendation-impact-grid">
            <div>
              <span>Probabilidad de éxito esperada</span>
              <span className="recommendation-impact-value">
                {normalizeText(expectedImpact.probabilidad_exito || 'Pendiente de simulación')}
              </span>
            </div>
            <div>
              <span>Reducción de abandono estimada</span>
              <span className="recommendation-impact-value">
                {normalizeText(expectedImpact.reduccion_abandono || 'Pendiente de simulación')}
              </span>
            </div>
          </div>
          <p>{normalizeText(expectedImpact.descripcion || 'La estimación se actualizará al ejecutar una nueva simulación.')}</p>
        </div>
      </div>
    )
  }

  return (
    <article className="panel recommendation-panel">
      <div className="panel-heading recommendation-heading">
        <div>
          <p className="eyebrow">Mejora</p>
          <h3>Plan de mejora priorizado</h3>
        </div>
        <span className="recommendation-status">
          <Icon name="recommendation" size={16} />
          {statusText}
        </span>
      </div>

      <div className="recommendation-grid">
        {Object.entries(labels).map(([key, label]) =>
          key === 'mejora_recomendada' ? (
            renderImprovementCard(label)
          ) : (
            <div key={key} className={`recommendation-card recommendation-card-${cardToneByKey[key] || 'blue'}`}>
              <span>{label}</span>
              {renderHighlightedText(recommendation?.[key] || emptyText, 'recommendation-card-text')}
            </div>
          ),
        )}
      </div>
    </article>
  )
}
