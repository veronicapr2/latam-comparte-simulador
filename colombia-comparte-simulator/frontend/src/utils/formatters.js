const mojibakeMap = {
  'ÃƒÂ¡': 'á',
  'ÃƒÂ©': 'é',
  'ÃƒÂ­': 'í',
  'ÃƒÂ³': 'ó',
  'ÃƒÂº': 'ú',
  'ÃƒÂ¼': 'ü',
  'ÃƒÂ±': 'ñ',
  'ÃƒÂ': 'Á',
  'Ãƒâ€°': 'É',
  'ÃƒÂ': 'Í',
  'Ãƒâ€œ': 'Ó',
  'ÃƒÅ¡': 'Ú',
  'ÃƒÅ“': 'Ü',
  'Ãƒâ€˜': 'Ñ',
  'Ã¡': 'á',
  'Ã©': 'é',
  'Ã­': 'í',
  'Ã³': 'ó',
  'Ãº': 'ú',
  'Ã¼': 'ü',
  'Ã±': 'ñ',
  'Ã': 'Á',
  'Ã‰': 'É',
  'Ã': 'Í',
  'Ã“': 'Ó',
  'Ãš': 'Ú',
  'Ãœ': 'Ü',
  'Ã‘': 'Ñ',
  'Â¿': '¿',
  'Â¡': '¡',
  'Âº': 'º',
  'Âª': 'ª',
}

export function normalizeText(text = '') {
  let normalized = String(text || '')

  for (let pass = 0; pass < 2; pass += 1) {
    Object.entries(mojibakeMap).forEach(([broken, fixed]) => {
      normalized = normalized.split(broken).join(fixed)
    })
  }

  return normalized
}

export const resultColors = {
  éxito: '#72dc00',
  'Ã©xito': '#72dc00',
  'ÃƒÂ©xito': '#72dc00',
  abandono: '#ff4f82',
  error: '#ff9f43',
  'seguimiento pendiente': '#28a7ff',
  'otro/neutro': '#8b8fa3',
}

export const typeLabels = {
  inicial: 'Inicial',
  intermedio: 'Intermedio',
  'final exitoso': 'Final exitoso',
  'final negativo': 'Final negativo',
  error: 'Error',
  seguimiento: 'Seguimiento',
}

export function formatPercent(value) {
  return `${Number(value || 0).toFixed(2)}%`
}

export function formatNumber(value) {
  return new Intl.NumberFormat('es-CO').format(Number(value || 0))
}

export function titleCase(text = '') {
  if (!text) return ''
  const normalized = normalizeText(text)
  return normalized.charAt(0).toLocaleUpperCase('es-CO') + normalized.slice(1)
}

export function getResultColor(result = '') {
  return resultColors[result] || resultColors[normalizeText(result).toLowerCase()] || '#64748b'
}

export function resultRows(summary) {
  const counts = summary?.result_counts || {}
  const percentages = summary?.result_percentages || {}
  return Object.entries(counts).map(([result, count]) => ({
    result,
    displayResult: titleCase(result),
    count,
    percentage: percentages[result] || 0,
    fill: getResultColor(result),
  }))
}
