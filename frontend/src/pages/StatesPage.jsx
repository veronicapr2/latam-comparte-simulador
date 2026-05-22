import { useMemo, useState } from 'react'
import { normalizeText, titleCase, typeLabels } from '../utils/formatters'

export default function StatesPage({ states, modules }) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('todos')
  const [module, setModule] = useState('todos')
  const types = useMemo(() => [...new Set(states.map((state) => state.type))].sort(), [states])

  const filtered = states.filter((state) => {
    const searchable = `${state.code} ${normalizeText(state.name)} ${normalizeText(state.description)}`.toLowerCase()
    const matchesQuery = searchable.includes(query.toLowerCase())
    const matchesType = type === 'todos' || state.type === type
    const matchesModule = module === 'todos' || state.module === module
    return matchesQuery && matchesType && matchesModule
  })

  return (
    <section className="page-stack">
      <div className="page-heading">
        <h2>Estados del modelo</h2>
        <span>{filtered.length} estados visibles</span>
      </div>

      <div className="filter-row">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por código o nombre" />
        <select value={type} onChange={(event) => setType(event.target.value)}>
          <option value="todos">Todos los tipos</option>
          {types.map((item) => (
            <option key={item} value={item}>
              {typeLabels[item] || titleCase(item)}
            </option>
          ))}
        </select>
        <select value={module} onChange={(event) => setModule(event.target.value)}>
          <option value="todos">Todos los módulos</option>
          {modules.map((item) => (
            <option key={item} value={item}>
              {normalizeText(item)}
            </option>
          ))}
        </select>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Tipo</th>
              <th>Módulo</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((state) => (
              <tr key={state.code}>
                <td className="code-cell">{state.code}</td>
                <td>{normalizeText(state.name)}</td>
                <td>{normalizeText(state.description)}</td>
                <td>
                  <span className={`badge type-${state.type.replaceAll(' ', '-')}`}>
                    {typeLabels[state.type] || titleCase(state.type)}
                  </span>
                </td>
                <td>{normalizeText(state.module)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
