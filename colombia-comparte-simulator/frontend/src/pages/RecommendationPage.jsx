import { useState } from 'react'
import CriticalStateCard from '../components/CriticalStateCard'
import ImprovementRecommendation from '../components/ImprovementRecommendation'
import Icon from '../components/Icon'
import { ScenarioComparisonChart } from '../components/ResultChart'
import StatCard from '../components/StatCard'
import { formatPercent, normalizeText } from '../utils/formatters'

export default function RecommendationPage({
  criticalState,
  recommendation,
  recommendationStatus,
  simulationResponse,
  improvedScenario,
  isImproving,
  onImprovedScenario,
}) {
  const [reduction, setReduction] = useState(20)

  return (
    <section className="page-stack">
      <div className="page-heading">
        <h2>Mejora recomendada</h2>
      </div>

      <CriticalStateCard criticalState={criticalState} />

      <ImprovementRecommendation
        simulationData={simulationResponse}
        recommendation={recommendation}
        isGenerating={recommendationStatus?.isGenerating}
      />

      <article className="panel">
        <div className="panel-heading">
          <div>
            <h3>Simular reducción de abandono</h3>
          </div>
          <strong className="range-value">{reduction}%</strong>
        </div>
        <div className="scenario-controls">
          <input
            type="range"
            min="0"
            max="70"
            step="5"
            value={reduction}
            onChange={(event) => setReduction(Number(event.target.value))}
          />
          <button
            className="primary-button page-action-button"
            disabled={isImproving}
            onClick={() => onImprovedScenario(reduction / 100, criticalState?.state)}
          >
            <Icon name="spark" size={18} />
            {isImproving ? 'Simulando mejora...' : 'Simular escenario mejorado'}
          </button>
        </div>

        <div className="stat-grid four">
          <StatCard
            label="Éxito antes"
            value={formatPercent(improvedScenario?.current_summary?.success_percentage)}
            tone="purple"
            icon="success"
          />
          <StatCard
            label="Éxito después"
            value={formatPercent(improvedScenario?.improved_summary?.success_percentage)}
            tone="green"
            icon="success"
          />
          <StatCard
            label="Abandono antes"
            value={formatPercent(improvedScenario?.current_summary?.abandonment_percentage)}
            tone="red"
            icon="abandon"
          />
          <StatCard
            label="Abandono después"
            value={formatPercent(improvedScenario?.improved_summary?.abandonment_percentage)}
            tone="blue"
            icon="follow"
          />
        </div>

        <ScenarioComparisonChart comparison={improvedScenario?.comparison} />
        {improvedScenario?.conclusion ? <div className="app-success">{normalizeText(improvedScenario.conclusion)}</div> : null}
      </article>
    </section>
  )
}
