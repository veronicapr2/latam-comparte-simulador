import { useEffect, useState } from 'react'
import MatrixTable from '../components/MatrixTable'
import { normalizeText } from '../utils/formatters'

export default function MatricesPage({ countMatrix, probabilityMatrix, defaultMode = 'counts' }) {
  const [mode, setMode] = useState(defaultMode)

  useEffect(() => {
    setMode(defaultMode)
  }, [defaultMode])

  const active = mode === 'counts' ? countMatrix : probabilityMatrix
  const topTransitions =
    mode === 'counts'
      ? countMatrix?.top_transitions || []
      : probabilityMatrix?.top_abandonment_error_probabilities || []
  const validRows = probabilityMatrix?.row_checks?.filter((row) => row.is_valid).length || 0

  return (
    <section className="page-stack">
      <div className="page-heading">
        <h2>{mode === 'counts' ? 'Matriz de conteos' : 'Matriz de probabilidades'}</h2>
        <div className="segmented-control">
          <button className={mode === 'counts' ? 'is-active' : ''} onClick={() => setMode('counts')}>
            Conteos
          </button>
          <button className={mode === 'probabilities' ? 'is-active' : ''} onClick={() => setMode('probabilities')}>
            Probabilidades
          </button>
        </div>
      </div>

      <article className="panel">
        <p>
          {mode === 'counts'
            ? 'Frecuencia observada de transición entre estados dentro de los recorridos base.'
            : 'Probabilidad normalizada de moverse desde cada estado hacia sus posibles estados siguientes.'}
        </p>
        {mode === 'probabilities' ? <p className="table-note">{validRows} filas con transiciones válidas.</p> : null}
        <MatrixTable matrixData={active} mode={mode === 'counts' ? 'counts' : 'probabilities'} />
      </article>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <h3>{mode === 'counts' ? 'Top de transiciones más frecuentes' : 'Top hacia abandono o error'}</h3>
          </div>
        </div>
        <div className="table-card is-embedded">
          <table>
            <thead>
              <tr>
                <th>Origen</th>
                <th>Destino</th>
                <th>{mode === 'counts' ? 'Conteo' : 'Probabilidad'}</th>
              </tr>
            </thead>
            <tbody>
              {topTransitions.map((transition) => (
                <tr key={`${transition.from}-${transition.to}`}>
                  <td>{transition.from} - {normalizeText(transition.from_name)}</td>
                  <td>{transition.to} - {normalizeText(transition.to_name)}</td>
                  <td>{mode === 'counts' ? transition.count : `${transition.percentage}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  )
}
