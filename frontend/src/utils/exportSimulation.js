import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { normalizeText, titleCase } from './formatters'

const PDF_THEME = {
  ink: [29, 37, 58],
  muted: [103, 114, 138],
  blue: [76, 129, 230],
  blueSoft: [239, 246, 255],
  blueSoftAlt: [246, 250, 255],
  border: [220, 232, 250],
}

const EXPORT_SEQUENCE_KEY = 'latinoamericaComparte.exportSequence'

function escapeCsvValue(value) {
  const text = String(value ?? '')
  return `"${text.replaceAll('"', '""')}"`
}

function readExportSequence() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { next: 1, simulations: {} }
  }

  try {
    const stored = window.localStorage.getItem(EXPORT_SEQUENCE_KEY)
    const parsed = stored ? JSON.parse(stored) : null

    if (parsed && typeof parsed.next === 'number' && parsed.simulations) {
      return parsed
    }
  } catch {
    return { next: 1, simulations: {} }
  }

  return { next: 1, simulations: {} }
}

function saveExportSequence(sequence) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }

  try {
    window.localStorage.setItem(EXPORT_SEQUENCE_KEY, JSON.stringify(sequence))
  } catch {
    // La descarga sigue funcionando aunque el navegador bloquee localStorage.
  }
}

function getSimulationKey(simulation) {
  return simulation?.id || simulation?.createdAt || JSON.stringify({
    users: simulation?.config?.users,
    initialState: simulation?.config?.initialState,
    maxSteps: simulation?.config?.maxSteps,
  })
}

function getSimulationExportNumber(simulation) {
  const simulationKey = getSimulationKey(simulation)
  const sequence = readExportSequence()

  if (sequence.simulations[simulationKey]) {
    return sequence.simulations[simulationKey]
  }

  const exportNumber = sequence.next

  saveExportSequence({
    next: exportNumber + 1,
    simulations: {
      ...sequence.simulations,
      [simulationKey]: exportNumber,
    },
  })

  return exportNumber
}

function buildFilename(simulation, extension) {
  const number = getSimulationExportNumber(simulation)
  return `Simulación ${number}.${extension}`
}

function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function formatDateLabel(simulation) {
  if (simulation?.createdAtLabel) {
    return simulation.createdAtLabel
  }
  if (simulation?.createdAt) {
    const parsed = new Date(simulation.createdAt)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString('es-CO')
    }
  }
  return 'Sin fecha'
}

function getSimulatedUsers(simulation) {
  return simulation?.simulatedUsersPreview || simulation?.simulatedUsers || []
}

function getSimulationUserCount(simulation, users) {
  return simulation?.config?.users ?? simulation?.simulatedUsersCount ?? users.length ?? ''
}

function getFinalStateLabel(user) {
  const stateCode = user?.final_state || ''
  const stateName = normalizeText(user?.final_state_name || '')

  if (stateCode && stateName) {
    return `${stateCode} - ${stateName}`
  }

  return stateCode || stateName
}

function getEssentialRows(simulation) {
  const users = getSimulatedUsers(simulation)
  const userCount = getSimulationUserCount(simulation, users)

  if (!users.length) {
    return [[
      simulation?.id || '',
      userCount,
      '',
      '',
      '',
      '',
      '',
    ]]
  }

  return users.map((user) => [
    simulation?.id || '',
    userCount,
    `U${user.user ?? ''}`,
    user.coded_route ?? '',
    getFinalStateLabel(user),
    titleCase(user.result || ''),
    user.steps ?? '',
  ])
}

export function downloadSimulationCSV(simulation) {
  const header = [
    'ID de simulacion',
    'Cantidad de usuarios',
    'Usuario',
    'Recorrido codificado',
    'Estado final',
    'Resultado',
    'Numero de pasos',
  ]

  const csvRows = [header, ...getEssentialRows(simulation)]
  const csv = '\ufeff' + csvRows.map((row) => row.map(escapeCsvValue).join(';')).join('\r\n')
  downloadBlob(csv, buildFilename(simulation, 'csv'), 'text/csv;charset=utf-8;')
}

function drawMainTitle(doc, simulation) {
  const pageWidth = doc.internal.pageSize.getWidth()
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(...PDF_THEME.ink)
  doc.text('Historial de simulaciones', pageWidth / 2, 20, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...PDF_THEME.muted)
  doc.text(`ID: ${simulation?.id || 'N/D'} | Fecha: ${formatDateLabel(simulation)}`, pageWidth / 2, 27, { align: 'center' })

  doc.setDrawColor(...PDF_THEME.border)
  doc.setLineWidth(0.5)
  doc.line(14, 31, pageWidth - 14, 31)
}

export async function downloadSimulationPDF(simulation) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const users = getSimulatedUsers(simulation)
  const userCount = getSimulationUserCount(simulation, users)
  const essentialRows = getEssentialRows(simulation)

  drawMainTitle(doc, simulation)

  let y = 38
  autoTable(doc, {
    startY: y,
    head: [['Campo', 'Valor']],
    body: [
      ['ID de simulacion', simulation?.id || ''],
      ['Cantidad de usuarios', userCount],
    ],
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 3,
      lineColor: PDF_THEME.border,
      textColor: PDF_THEME.ink,
    },
    headStyles: {
      fillColor: PDF_THEME.blue,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: PDF_THEME.blueSoftAlt },
    margin: { left: 14, right: 14 },
  })

  y = doc.lastAutoTable.finalY + 8
  autoTable(doc, {
    startY: y,
    head: [['Usuario', 'Recorrido codificado', 'Estado final', 'Resultado', 'Numero de pasos']],
    body: essentialRows.map((row) => row.slice(2)),
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: 2.8,
      lineColor: PDF_THEME.border,
      textColor: PDF_THEME.ink,
      valign: 'middle',
    },
    headStyles: {
      fillColor: PDF_THEME.blue,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: PDF_THEME.blueSoftAlt },
    margin: { left: 14, right: 14 },
    bodyStyles: { minCellHeight: 6 },
    didParseCell: (hookData) => {
      if (hookData.section === 'body' && hookData.column.index === 0) {
        hookData.cell.styles.fontStyle = 'bold'
      }
    },
  })

  doc.setDrawColor(...PDF_THEME.border)
  doc.line(14, doc.internal.pageSize.getHeight() - 15, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 15)

  doc.setTextColor(...PDF_THEME.muted)
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.text('LatinoAmerica Comparte - Exportacion de simulacion', 14, doc.internal.pageSize.getHeight() - 9)

  doc.save(buildFilename(simulation, 'pdf'))
}
