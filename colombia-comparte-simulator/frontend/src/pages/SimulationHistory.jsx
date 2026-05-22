import { useMemo, useState, useEffect } from 'react'
import StatCard from '../components/StatCard'
import { ResultDistributionChart, ScenarioComparisonChart } from '../components/ResultChart'
import Icon from '../components/Icon'
import { formatNumber, formatPercent, normalizeText, titleCase } from '../utils/formatters'
import { downloadSimulationCSV, downloadSimulationPDF } from '../utils/exportSimulation'
import { getSimulationHistory } from '../utils/simulationHistory'
import { buildFallbackRecommendation, DEFAULT_RECOMMENDATION_MODEL } from '../services/nlpRecommendation'

function getComparisonValue(comparison, metric, field) {
  return comparison?.find((row) => row.metric === metric)?.[field]
}

export default function SimulationHistory({
  historyItems,
  selectedHistoryId,
  selectedHistorySimulation,
  onSelectHistory,
  onDeleteHistory,
  onClearHistory,
}) {
  const [showDetail, setShowDetail] = useState(false)
  const [history, setHistory] = useState(historyItems || [])

  useEffect(() => {
    setHistory(historyItems || [])
  }, [historyItems])

  useEffect(() => {
    const load = () => setHistory(getSimulationHistory())
    load()
    window.addEventListener('simulation-history-updated', load)
    window.addEventListener('storage', load)
    return () => {
      window.removeEventListener('simulation-history-updated', load)
      window.removeEventListener('storage', load)
    }
  }, [])

  const selectedHistory = useMemo(() => {
    if (selectedHistorySimulation) {
      return selectedHistorySimulation
    }
    return history[0] || null
  }, [history, selectedHistorySimulation])

  const enrichedRecommendation = useMemo(() => {
    const savedRecommendation = selectedHistory?.recommendation || {}
    const isDetailed =
      savedRecommendation?.impacto_esperado &&
      Array.isArray(savedRecommendation?.acciones_prioritarias) &&
      savedRecommendation.acciones_prioritarias.length &&
      String(savedRecommendation?.mejora_recomendada || '').length > 500

    if (!selectedHistory || isDetailed) {
      return savedRecommendation
    }

    return buildFallbackRecommendation(
      {
        summary: selectedHistory.results,
        critical_state: selectedHistory.criticalState,
        recommendation: savedRecommendation,
      },
      {
        model: DEFAULT_RECOMMENDATION_MODEL,
        group: 'LatinoAmerica Comparte',
      },
    )
  }, [selectedHistory])

  const selectedHistoryWithRecommendation = useMemo(() => {
    return selectedHistory ? { ...selectedHistory, recommendation: enrichedRecommendation } : null
  }, [selectedHistory, enrichedRecommendation])

  if (!history.length) {
    return (
      <section className="page-stack history-page">
        <div className="page-heading">
          <h2>Historial de simulaciones</h2>
          <button className="ghost-button compact-button" onClick={onClearHistory} disabled>
            Limpiar historial
          </button>
        </div>
        <div className="empty-state">Aún no se han guardado simulaciones en el historial.</div>
      </section>
    )
  }

  const summary = selectedHistory?.results || {}
  const criticalState = selectedHistory?.criticalState || {}
  const recommendation = enrichedRecommendation || {}
  const comparison = selectedHistory?.improvedScenario?.comparison || []
  const simulatedUsers = selectedHistory?.simulatedUsersPreview || []

  function handleOpenDetail(id) {
    onSelectHistory(id)
    setShowDetail(true)
  }

  function handleCloseDetail() {
    setShowDetail(false)
  }

  return (
    <section className="page-stack history-page">
      <div className="page-heading history-heading">
        <div>
          <h2>Historial de simulaciones</h2>
          <span>{formatNumber(history.length)} simulaciones guardadas</span>
        </div>
        <button
          className="ghost-button compact-button"
          onClick={() => {
            if (window.confirm('¿Seguro que deseas eliminar todo el historial de simulaciones?')) {
              onClearHistory()
            }
          }}
        >
          <Icon name="history" size={18} />
          Limpiar historial
        </button>
      </div>

        <div className="history-layout">
        <div className="history-list">
          {history.map((item) => {
            const isSelected = item.id === selectedHistory?.id || item.id === selectedHistoryId
            return (
              <article key={item.id} className={`panel history-card ${isSelected ? 'is-selected' : ''}`}>
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">{item.id}</p>
                    <h3>{item.createdAtLabel}</h3>
                  </div>
                  <span>{formatNumber(item.config?.users || 0)} usuarios</span>
                </div>

                <div className="history-card-grid">
                  <div>
                    <span>Máximo de pasos</span>
                    <strong>{item.config?.maxSteps || 0}</strong>
                  </div>
                  <div>
                    <span>Éxito</span>
                    <strong>{formatPercent(item.results?.success_percentage)}</strong>
                  </div>
                  <div>
                    <span>Abandono</span>
                    <strong>{formatPercent(item.results?.abandonment_percentage)}</strong>
                  </div>
                  <div>
                    <span>Estado crítico</span>
                    <strong>{item.criticalState?.state || 'S/D'}</strong>
                  </div>
                </div>

                <div className="history-card-meta">
                  <div>
                    <span>Estado inicial</span>
                    <b>{item.config?.initialState || ''}</b>
                  </div>
                  <div>
                    <span>Promedio de pasos</span>
                    <b>{item.results?.average_steps ?? 0}</b>
                  </div>
                </div>

                <div className="history-card-actions">
                  <button className="ghost-button compact-button" onClick={() => handleOpenDetail(item.id)}>
                    <Icon name="results" size={16} />
                    Ver detalle
                  </button>
                  <button className="ghost-button compact-button" onClick={() => downloadSimulationCSV(item)}>
                    <Icon name="counts" size={16} />
                    CSV
                  </button>
                  <button className="ghost-button compact-button" onClick={() => downloadSimulationPDF(item)}>
                    <Icon name="recommendation" size={16} />
                    PDF
                  </button>
                  <button
                    className="ghost-button compact-button"
                    onClick={() => {
                      if (window.confirm('¿Eliminar esta simulación del historial?')) {
                        onDeleteHistory(item.id)
                        // update local list immediately
                        setHistory(getSimulationHistory())
                      }
                    }}
                  >
                    <Icon name="abandon" size={16} />
                    Eliminar
                  </button>
                </div>
              </article>
            )
          })}
        </div>
        {showDetail && selectedHistory ? (
          <div className="history-detail-modal" role="dialog" aria-modal="true">
            <div className="history-detail-modal-backdrop" onClick={handleCloseDetail} />
            <div className="history-detail-modal-panel">
              <div className="simulation-detail">
                {/* HEADER */}
                <div className="simulation-detail-header">
                  <div>
                    <p className="eyebrow">Detalle</p>
                    <h3 className="simulation-detail-title">{selectedHistory?.id}</h3>
                  </div>
                  <div>
                    <button className="ghost-button compact-button" onClick={handleCloseDetail}>
                      Cerrar
                    </button>
                  </div>
                </div>

                {/* METRICS */}
                <div className="simulation-detail-metrics">
                  <div className="simulation-detail-metric-card">
                    <StatCard label="Usuarios" value={formatNumber(selectedHistory?.config?.users || 0)} tone="blue" icon="users" />
                  </div>
                  <div className="simulation-detail-metric-card">
                    <StatCard label="Pasos máximos" value={selectedHistory?.config?.maxSteps || 0} tone="purple" icon="steps" />
                  </div>
                  <div className="simulation-detail-metric-card">
                    <StatCard label="Éxito" value={formatPercent(summary?.success_percentage)} tone="green" icon="success" />
                  </div>
                  <div className="simulation-detail-metric-card">
                    <StatCard label="Abandono" value={formatPercent(summary?.abandonment_percentage)} tone="pink" icon="abandon" />
                  </div>
                  <div className="simulation-detail-metric-card">
                    <StatCard label="Error" value={formatPercent(summary?.error_percentage)} tone="amber" icon="error" />
                  </div>

                  <div className="simulation-detail-metric-card">
                    <span className="eyebrow">Fecha y hora</span>
                    <strong style={{ display: 'block', marginTop: 6 }}>{selectedHistory?.createdAtLabel}</strong>
                  </div>
                  <div className="simulation-detail-metric-card">
                    <span className="eyebrow">Estado inicial</span>
                    <strong style={{ display: 'block', marginTop: 6 }}>{selectedHistory?.config?.initialState || ''}</strong>
                  </div>
                  <div className="simulation-detail-metric-card">
                    <span className="eyebrow">Estado crítico</span>
                    <strong style={{ display: 'block', marginTop: 6 }}>{criticalState.state || 'Sin estado crítico'}</strong>
                  </div>
                  <div className="simulation-detail-metric-card">
                    <span className="eyebrow">Promedio pasos</span>
                    <strong style={{ display: 'block', marginTop: 6 }}>{summary?.average_steps ?? 0}</strong>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="simulation-detail-actions">
                  <button className="primary-button compact-button" onClick={() => downloadSimulationCSV(selectedHistoryWithRecommendation)}>
                    <Icon name="counts" size={18} />
                    Descargar CSV
                  </button>
                  <button className="primary-button compact-button" onClick={() => downloadSimulationPDF(selectedHistoryWithRecommendation)}>
                    <Icon name="recommendation" size={18} />
                    Descargar PDF
                  </button>
                </div>

                {/* CONTENT GRID: Results (left) and Critical State (right) */}
                <div className="simulation-detail-content-grid">
                  <div>
                    <article className="panel chart-card">
                      <div className="panel-heading">
                        <div>
                          <p className="eyebrow">Resultados</p>
                          <h3>Distribución de la simulación</h3>
                        </div>
                      </div>
                      <ResultDistributionChart summary={summary} variant="donut" />
                    </article>
                  </div>

                  <div>
                    <article className="panel">
                      <div className="panel-heading">
                        <div>
                          <p className="eyebrow">Estado crítico</p>
                          <h3>{criticalState.state || 'Sin estado crítico'}</h3>
                        </div>
                      </div>
                      <div className="history-info-list">
                        <div>
                          <span>Nombre</span>
                          <strong>{normalizeText(criticalState.name || '')}</strong>
                        </div>
                        <div>
                          <span>Tipo</span>
                          <strong>{normalizeText(criticalState.type || '')}</strong>
                        </div>
                        <div>
                          <span>Módulo</span>
                          <strong>{normalizeText(criticalState.module || '')}</strong>
                        </div>
                        <div>
                          <span>Abandonos asociados</span>
                          <strong>{criticalState.abandonments_from_state ?? 0}</strong>
                        </div>
                      </div>
                    </article>
                  </div>
                </div>

                {/* Recommendation / improved scenario */}
                <div className="recommendation-section">
                  <article className="panel history-recommendation-box">
                    <div className="panel-heading">
                      <div>
                        <p className="eyebrow">Mejora recomendada</p>
                        <h3>Recomendación</h3>
                      </div>
                    </div>
                    <p style={{ marginTop: 8 }}>{normalizeText(recommendation.mejora_recomendada || recommendation.recommendation || 'No disponible')}</p>
                    {comparison.length ? (
                      <div style={{ marginTop: 12 }}>
                        <ScenarioComparisonChart comparison={comparison} />
                      </div>
                    ) : null}
                  </article>
                </div>

                {/* Simulated users */}
                <div className="simulated-users-section">
                  <article className="panel">
                    <div className="panel-heading">
                      <div>
                        <p className="eyebrow">Usuarios simulados</p>
                        <h3>Primeros 30 registros</h3>
                      </div>
                    </div>
                    <div className="simulated-users-table-wrapper table-card is-embedded">
                      <table>
                        <thead>
                          <tr>
                            <th>Usuario</th>
                            <th>Recorrido</th>
                            <th>Resultado</th>
                            <th>Pasos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {simulatedUsers.slice(0, 30).map((user) => (
                            <tr key={user.user}>
                              <td className="code-cell">U{user.user}</td>
                              <td>{user.coded_route}</td>
                              <td>{titleCase(user.result)}</td>
                              <td>{user.steps}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
