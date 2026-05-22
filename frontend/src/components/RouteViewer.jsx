import { normalizeText, titleCase } from '../utils/formatters'

export default function RouteViewer({ route }) {
  if (!route) {
    return <div className="empty-state">Selecciona un recorrido para ver el detalle.</div>
  }

  return (
    <article className="route-viewer">
      <div className="route-meta">
        <strong>{route.id}</strong>
        <span>{titleCase(route.result)}</span>
        <span>{route.steps} pasos</span>
      </div>
      <div className="route-line">
        {route.states.map((state, index) => (
          <div className="route-node" key={`${route.id}-${state}-${index}`}>
            <span>{state}</span>
            <small>{index + 1}</small>
          </div>
        ))}
      </div>
      <p>{normalizeText(route.translated_route)}</p>
    </article>
  )
}
