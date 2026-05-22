import { useMemo, useState } from 'react'

export default function MatrixTable({ matrixData, mode }) {
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(18)
  const states = matrixData?.states || []
  const matrix = matrixData?.matrix || {}

  const visibleStates = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const filtered = normalized
      ? states.filter((state) => state.toLowerCase().includes(normalized))
      : states
    return filtered.slice(0, limit)
  }, [states, query, limit])

  if (!states.length) {
    return <div className="empty-state">No hay matriz disponible.</div>
  }

  return (
    <div className="matrix-wrapper">
      <div className="table-toolbar">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filtrar por estado, por ejemplo S81"
        />
        <select value={limit} onChange={(event) => setLimit(Number(event.target.value))}>
          <option value={12}>12 estados</option>
          <option value={18}>18 estados</option>
          <option value={30}>30 estados</option>
          <option value={50}>50 estados</option>
        </select>
      </div>
      <div className="matrix-scroll">
        <table className="matrix-table">
          <thead>
            <tr>
          <th>Actual / siguiente</th>
              {visibleStates.map((state) => (
                <th key={state}>{state}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleStates.map((origin) => (
              <tr key={origin}>
                <th>{origin}</th>
                {visibleStates.map((target) => {
                  const value = matrix[origin]?.[target] || 0
                  const visibleValue =
                    mode === 'probabilities' ? (value ? Number(value).toFixed(3) : '') : value || ''
                  return (
                    <td key={target} className={value ? 'has-value' : ''}>
                      {visibleValue}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
