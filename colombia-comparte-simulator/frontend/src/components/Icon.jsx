const iconPaths = {
  dashboard: [
    <rect key="a" x="3" y="3" width="7" height="7" rx="1.5" />,
    <rect key="b" x="14" y="3" width="7" height="7" rx="1.5" />,
    <rect key="c" x="3" y="14" width="7" height="7" rx="1.5" />,
    <rect key="d" x="14" y="14" width="7" height="7" rx="1.5" />,
  ],
  states: [
    <path key="a" d="M12 3 4 7l8 4 8-4-8-4Z" />,
    <path key="b" d="M4 12l8 4 8-4" />,
    <path key="c" d="M4 17l8 4 8-4" />,
  ],
  routes: [
    <circle key="a" cx="6" cy="6" r="2.5" />,
    <circle key="b" cx="18" cy="18" r="2.5" />,
    <path key="c" d="M8.5 6h3.2a4 4 0 0 1 0 8H12a4 4 0 0 0 0 8h3.5" />,
  ],
  counts: [
    <path key="a" d="M4 5h16" />,
    <path key="b" d="M4 12h16" />,
    <path key="c" d="M4 19h16" />,
    <path key="d" d="M8 5v14" />,
    <path key="e" d="M16 5v14" />,
  ],
  probabilities: [
    <path key="a" d="M19 5 5 19" />,
    <circle key="b" cx="7" cy="7" r="2.5" />,
    <circle key="c" cx="17" cy="17" r="2.5" />,
  ],
  simulation: [
    <path key="a" d="M5 4v16l14-8-14-8Z" />,
  ],
  results: [
    <path key="a" d="M4 19V5" />,
    <path key="b" d="M4 19h16" />,
    <path key="c" d="M8 16v-5" />,
    <path key="d" d="M13 16V8" />,
    <path key="e" d="M18 16v-9" />,
  ],
  critical: [
    <path key="a" d="M12 3 3.8 19h16.4L12 3Z" />,
    <path key="b" d="M12 9v4" />,
    <path key="c" d="M12 17h.01" />,
  ],
  recommendation: [
    <path key="a" d="M12 3a6 6 0 0 0-3 11.2V17h6v-2.8A6 6 0 0 0 12 3Z" />,
    <path key="b" d="M10 21h4" />,
    <path key="c" d="M9.5 17h5" />,
  ],
  document: [
    <path key="a" d="M6 3h8l4 4v14H6V3Z" />,
    <path key="b" d="M14 3v5h5" />,
    <path key="c" d="M9 13h6" />,
    <path key="d" d="M9 17h4" />,
  ],
  history: [
    <circle key="a" cx="12" cy="12" r="8" />,
    <path key="b" d="M12 8v4l3 2" />,
    <path key="c" d="M12 4a8 8 0 1 0 8 8" />,
    <path key="d" d="M20 4v4h-4" />,
  ],
  users: [
    <path key="a" d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />,
    <circle key="b" cx="9.5" cy="7" r="4" />,
    <path key="c" d="M22 21v-2a4 4 0 0 0-3-3.87" />,
    <path key="d" d="M16 3.13a4 4 0 0 1 0 7.75" />,
  ],
  success: [
    <path key="a" d="M20 6 9 17l-5-5" />,
  ],
  abandon: [
    <path key="a" d="M18 6 6 18" />,
    <path key="b" d="m6 6 12 12" />,
  ],
  error: [
    <circle key="a" cx="12" cy="12" r="9" />,
    <path key="b" d="M12 7v6" />,
    <path key="c" d="M12 17h.01" />,
  ],
  follow: [
    <path key="a" d="M21 12a9 9 0 1 1-2.64-6.36" />,
    <path key="b" d="M21 4v6h-6" />,
  ],
  steps: [
    <path key="a" d="M4 19h16" />,
    <path key="b" d="M6 15h4v4" />,
    <path key="c" d="M10 11h4v8" />,
    <path key="d" d="M14 7h4v12" />,
  ],
  target: [
    <circle key="a" cx="12" cy="12" r="8" />,
    <circle key="b" cx="12" cy="12" r="3" />,
    <path key="c" d="M12 2v4" />,
    <path key="d" d="M12 18v4" />,
    <path key="e" d="M2 12h4" />,
    <path key="f" d="M18 12h4" />,
  ],
  spark: [
    <path key="a" d="M13 2 9 10l-7 3 7 3 4 8 4-8 7-3-7-3-4-8Z" />,
  ],
  arrowRight: [
    <path key="a" d="M5 12h14" />,
    <path key="b" d="m13 6 6 6-6 6" />,
  ],
}

export default function Icon({ name, size = 18, className = '', title }) {
  const paths = iconPaths[name] || iconPaths.dashboard

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      {paths}
    </svg>
  )
}
