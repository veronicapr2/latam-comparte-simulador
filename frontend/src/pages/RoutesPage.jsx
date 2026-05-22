import { useMemo, useState } from 'react'
import RouteViewer from '../components/RouteViewer'
import { normalizeText, titleCase } from '../utils/formatters'

export default function RoutesPage({ routes }) {
  const [result, setResult] = useState('todos')
  const [selectedId, setSelectedId] = useState('')
  const resultTypes = useMemo(() => [...new Set(routes.map((route) => route.result))].sort(), [routes])
  const filtered = result === 'todos' ? routes : routes.filter((route) => route.result === result)
  const selectedRoute = filtered.find((route) => route.id === selectedId) || filtered[0]

  return (
    <section className="page-stack">
      <div className="page-heading">
        <h2>Recorridos base</h2>
        <span>{filtered.length} recorridos</span>
      </div>

      <div className="filter-row">
        <select value={result} onChange={(event) => setResult(event.target.value)}>
          <option value="todos">Todos los resultados</option>
          {resultTypes.map((item) => (
            <option key={item} value={item}>
              {titleCase(item)}
            </option>
          ))}
        </select>
        <select value={selectedRoute?.id || ''} onChange={(event) => setSelectedId(event.target.value)}>
          {filtered.map((route) => (
            <option key={route.id} value={route.id}>
              {route.id} - {route.final_state}
            </option>
          ))}
        </select>
      </div>

      <RouteViewer route={selectedRoute} />

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Recorrido codificado</th>
              <th>Estado final</th>
              <th>Resultado</th>
              <th>Pasos</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 80).map((route) => (
              <tr key={route.id}>
                <td className="code-cell">{route.id}</td>
                <td>{route.coded_route}</td>
                <td>{route.final_state} - {normalizeText(route.final_state_name)}</td>
                <td>{titleCase(route.result)}</td>
                <td>{route.steps}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length > 80 ? <p className="table-note">Mostrando 80 de {filtered.length} recorridos filtrados.</p> : null}
      </div>
    </section>
  )
}
