import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatPercent, getResultColor, normalizeText, resultRows, titleCase } from '../utils/formatters'

const chartMargin = { top: 12, right: 18, bottom: 8, left: 8 }

export function ResultDistributionChart({ summary, variant = 'bar', height = 260 }) {
  const data = resultRows(summary)

  if (!data.length) {
    return <div className="empty-state">No hay resultados disponibles.</div>
  }

  if (variant === 'donut') {
    return (
      <div className="result-donut-chart">
        <div className="result-donut-plot" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="displayResult"
                innerRadius="52%"
                outerRadius="76%"
                paddingAngle={4}
              >
                {data.map((entry) => (
                  <Cell key={entry.result} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, titleCase(name)]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="result-donut-legend" aria-label="Leyenda de usuarios por resultado">
          {data.map((entry) => (
            <div key={entry.result} className="result-donut-legend-item">
              <span className="result-donut-dot" style={{ background: entry.fill }} />
              <span>{entry.displayResult}</span>
              <b>{formatPercent(entry.percentage)}</b>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={chartMargin}>
        <CartesianGrid stroke="#edf0f7" vertical={false} />
        <XAxis dataKey="displayResult" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <Tooltip
          formatter={(value, name, item) => [value, titleCase(item?.payload?.result || name)]}
          labelFormatter={(label) => label}
        />
        <Bar dataKey="count" radius={[10, 10, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.result} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function FinalStatesBarChart({ summary, height = 260 }) {
  const data = (summary?.final_state_counts || []).slice(0, 8).map((row) => ({
    ...row,
    label: row.state,
    displayName: normalizeText(row.name),
  }))

  if (!data.length) {
    return <div className="empty-state">No hay estados finales para mostrar.</div>
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 18, bottom: 8, left: 8 }}>
        <CartesianGrid stroke="#edf0f7" horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} />
        <YAxis dataKey="label" type="category" width={46} tickLine={false} axisLine={false} />
        <Tooltip
          formatter={(value, name) => [name === 'percentage' ? formatPercent(value) : value, name === 'percentage' ? 'Porcentaje' : 'Usuarios']}
          labelFormatter={(label) => {
            const item = data.find((row) => row.label === label)
            return item ? `${item.state} - ${item.displayName}` : label
          }}
        />
        <Bar dataKey="count" name="Usuarios" fill="#8b2cff" radius={[0, 10, 10, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function AverageStepsChart({ summary }) {
  const data = (summary?.average_steps_by_result || []).map((row) => ({
    ...row,
    displayResult: titleCase(row.result),
    fill: getResultColor(row.result),
  }))

  if (!data.length) {
    return <div className="empty-state">No hay promedio de pasos disponible.</div>
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={chartMargin}>
        <CartesianGrid stroke="#edf0f7" vertical={false} />
        <XAxis dataKey="displayResult" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <Tooltip formatter={(value) => [value, 'Promedio de pasos']} />
        <Line
          type="monotone"
          dataKey="average_steps"
          stroke="#28a7ff"
          strokeWidth={3}
          dot={{ r: 5, strokeWidth: 2, fill: '#fff' }}
          activeDot={{ r: 7 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function CriticalRiskChart({ criticalState, height = 260 }) {
  const data = (criticalState?.ranking || []).slice(0, 7).map((row) => ({
    ...row,
    label: row.state,
    displayName: normalizeText(row.name),
  }))

  if (!data.length) {
    return <div className="empty-state">No hay ranking de riesgo disponible.</div>
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 18, bottom: 8, left: 8 }}>
        <CartesianGrid stroke="#edf0f7" horizontal={false} />
        <XAxis type="number" tickFormatter={(value) => `${value}%`} tickLine={false} axisLine={false} />
        <YAxis dataKey="label" type="category" width={46} tickLine={false} axisLine={false} />
        <Tooltip
          formatter={(value) => [formatPercent(value), 'Riesgo directo']}
          labelFormatter={(label) => {
            const item = data.find((row) => row.label === label)
            return item ? `${item.state} - ${item.displayName}` : label
          }}
        />
        <Bar dataKey="risk_percentage" fill="#ff4f82" radius={[0, 10, 10, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function ScenarioComparisonChart({ comparison }) {
  if (!comparison?.length) {
    return <div className="empty-state">Aún no hay escenario mejorado para comparar.</div>
  }

  const data = comparison.map((row) => ({
    ...row,
    displayMetric: titleCase(row.metric),
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={chartMargin}>
        <CartesianGrid stroke="#edf0f7" vertical={false} />
        <XAxis dataKey="displayMetric" tickLine={false} axisLine={false} />
        <YAxis tickFormatter={(value) => `${value}%`} tickLine={false} axisLine={false} />
        <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
        <Legend iconType="circle" />
        <Bar dataKey="before" name="Antes" fill="#8b2cff" radius={[10, 10, 0, 0]} />
        <Bar dataKey="after" name="Después" fill="#72dc00" radius={[10, 10, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
