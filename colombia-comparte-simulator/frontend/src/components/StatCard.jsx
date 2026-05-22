import Icon from './Icon'

export default function StatCard({ label, value, helper, tone = 'blue', icon = 'dashboard' }) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <div className="stat-card-top">
        <span>{label}</span>
        <Icon name={icon} size={18} />
      </div>
      <strong>{value}</strong>
      {helper ? <small>{helper}</small> : null}
    </article>
  )
}
