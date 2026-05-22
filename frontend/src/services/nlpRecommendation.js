import { normalizeText } from '../utils/formatters'

export const DEFAULT_RECOMMENDATION_MODEL = 'Senua multilingual'
const FALLBACK_MODEL = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2'
const MODEL_NAMESPACE = {
  'senua-multilingual': FALLBACK_MODEL,
  'senua multilingual': FALLBACK_MODEL,
  'Senua multilingual': FALLBACK_MODEL,
  'distilbert-base-multilingual-cased': 'distilbert/distilbert-base-multilingual-cased',
  't5-small': 'Xenova/t5-small',
}

const extractorCache = new Map()

const recommendationCandidates = [
  {
    id: 'form_completion',
    keywords: ['formulario', 'contacto', 'contactanos', 'contáctanos', 'dian', 'campos', 'envio', 'envío'],
    context:
      'Formulario con abandono o error. Campos extensos, ayudas poco visibles, validacion tardia y confirmacion poco clara.',
    problem: 'El recorrido se frena alrededor de un formulario o punto de captura de datos.',
    cause: 'Los usuarios pueden estar encontrando campos poco claros, validaciones tardías o falta de confirmación antes de enviar.',
    improvement:
      'Reducir los campos al mínimo necesario, agruparlos por intención, validar en tiempo real y mostrar ayudas cortas junto a cada campo crítico. Al final, presentar un resumen claro antes del envío y una confirmación visible cuando el proceso se complete.',
    action: 'Aumentar envíos exitosos y disminuir abandonos causados por dudas o correcciones repetidas.',
    indicator: 'Tasa de formularios completados, errores por campo y avance desde el estado crítico hacia un final exitoso.',
    result: 'Menos errores de captura y más usuarios completando el recorrido sin abandonar.',
  },
  {
    id: 'navigation_clarity',
    keywords: ['header', 'footer', 'inicio', 'menu', 'menú', 'navegacion', 'navegación', 'ver mas', 'ver más'],
    context:
      'Navegacion confusa. El usuario salta entre secciones, no reconoce la accion principal o abandona desde un enlace de menu.',
    problem: 'El estado crítico apunta a una zona de navegación con baja claridad sobre el siguiente paso.',
    cause: 'La jerarquía de enlaces y llamados a la acción puede no estar dejando claro qué debe hacer el usuario para continuar.',
    improvement:
      'Reordenar el menú según las rutas más frecuentes, destacar una acción principal por pantalla y reforzar los enlaces de retorno al recorrido recomendado. Usar etiquetas más directas y mantener el mismo lenguaje entre Header, Footer y botones internos.',
    action: 'Hacer que el usuario identifique el camino correcto con menos decisiones intermedias.',
    indicator: 'Clics en la acción principal, reducción de saltos entre secciones y porcentaje de usuarios que continúa desde el estado crítico.',
    result: 'Recorridos más cortos, navegación más clara y menor abandono por desorientación.',
  },
  {
    id: 'donation_trust',
    keywords: ['donacion', 'donación', 'donaciones', 'donar', 'aporte', 'pago', 'seguridad'],
    context:
      'Flujo de donacion con friccion. El usuario necesita seguridad, pasos claros, resumen y confianza antes de completar.',
    problem: 'El flujo de donación pierde usuarios antes de terminar el proceso.',
    cause: 'Puede faltar confianza, explicación del uso del aporte o una vista clara de los pasos restantes.',
    improvement:
      'Mostrar el progreso del proceso de donación, agregar señales de seguridad, explicar brevemente el impacto del aporte y ofrecer un resumen editable antes de confirmar. Mantener visible una opción de ayuda durante todo el flujo.',
    action: 'Reducir dudas en el momento de decisión y aumentar donaciones completadas.',
    indicator: 'Tasa de donaciones exitosas, abandono por paso y clics en mensajes de ayuda.',
    result: 'Mayor confianza en el proceso y más usuarios llegando al envío exitoso.',
  },
  {
    id: 'account_access',
    keywords: ['aula', 'login', 'inicio de sesion', 'sesión', 'credenciales', 'cuenta', 'acceso', 'recuperacion'],
    context:
      'Acceso a cuenta con error. Credenciales, recuperacion de cuenta y mensajes de ayuda deben ser visibles y accionables.',
    problem: 'El acceso a Tu aula genera fricción o errores antes de que el usuario pueda continuar.',
    cause: 'Los mensajes de error pueden no indicar cómo recuperarse o la opción de recuperación puede estar poco visible.',
    improvement:
      'Validar credenciales antes del envío, mostrar errores específicos con acciones de recuperación y ubicar “recuperar acceso” cerca del campo afectado. Añadir una microayuda que explique qué correo o dato debe usar el usuario.',
    action: 'Aumentar accesos exitosos y reducir intentos fallidos repetidos.',
    indicator: 'Tasa de acceso exitoso, intentos por usuario y clics en recuperación de cuenta.',
    result: 'Menos bloqueos en inicio de sesión y más usuarios retomando el recorrido.',
  },
  {
    id: 'content_route',
    keywords: ['programa', 'programas', 'noticia', 'noticias', 'blog', 'actualidad', 'edifica', 'speaker', 'conferencia'],
    context:
      'Recorrido de contenido con perdida de continuidad. El usuario consume informacion pero no encuentra el siguiente paso.',
    problem: 'El usuario llega a contenido informativo pero no encuentra una continuación clara.',
    cause: 'Las páginas de contenido pueden tener llamados a la acción débiles o enlaces relacionados poco visibles.',
    improvement:
      'Agregar un bloque de siguiente acción al final del contenido, conectar noticias y programas con formularios relevantes y mantener botones de contacto o inscripción visibles sin interrumpir la lectura.',
    action: 'Convertir visitas informativas en avances medibles dentro del recorrido.',
    indicator: 'Clics desde contenido hacia contacto, inscripción o donación; tasa de continuidad después del estado crítico.',
    result: 'Mayor continuidad desde contenidos hacia acciones valiosas para LatinoAmerica Comparte.',
  },
  {
    id: 'help_messages',
    keywords: ['error', 'seguimiento', 'pendiente', 'fallo', 'ayuda', 'soporte', 'validacion', 'validación'],
    context:
      'Errores o seguimiento pendiente. La interfaz necesita mensajes de ayuda accionables, recuperacion y validacion temprana.',
    problem: 'La simulación muestra una proporción relevante de errores o seguimientos pendientes.',
    cause: 'El usuario puede no entender qué ocurrió, qué dato debe corregir o cuál es la siguiente acción para resolverlo.',
    improvement:
      'Reescribir los mensajes de ayuda con instrucciones concretas, mostrar la causa probable del error y ofrecer una acción inmediata de recuperación. Para seguimientos pendientes, confirmar qué pasará después y en cuánto tiempo.',
    action: 'Reducir incertidumbre y evitar que el usuario abandone después de un error recuperable.',
    indicator: 'Errores resueltos en el mismo flujo, reducción de seguimiento pendiente y clics en acciones de ayuda.',
    result: 'Menos finales negativos y mayor percepción de acompañamiento durante el proceso.',
  },
  {
    id: 'route_optimization',
    keywords: ['pasos', 'recorrido', 'ruta', 'promedio', 'largo', 'conversion', 'conversión'],
    context:
      'Recorrido largo con abandono. Se requiere reducir pasos, priorizar decisiones y eliminar pantallas de baja contribucion.',
    problem: 'El recorrido parece requerir demasiados pasos antes de llegar a un resultado útil.',
    cause: 'La ruta puede incluir decisiones redundantes, enlaces secundarios o pantallas que no acercan al usuario a su objetivo.',
    improvement:
      'Revisar la ruta dominante, eliminar pasos redundantes y mover la acción principal más cerca del punto de intención. Donde el usuario deba elegir, usar opciones breves con beneficios claros y una ruta recomendada.',
    action: 'Disminuir el esfuerzo percibido y acelerar el avance hacia resultados exitosos.',
    indicator: 'Promedio de pasos, tasa de abandono por longitud de ruta y conversión desde la ruta más frecuente.',
    result: 'Recorridos más eficientes y menor abandono por cansancio o exceso de decisiones.',
  },
  {
    id: 'critical_abandonment',
    keywords: ['abandono', 'salida', 'final negativo', 'estado critico', 'crítico', 'riesgo'],
    context:
      'Abandono concentrado en estado critico. Se necesita reforzar claridad, ayuda contextual y accion principal.',
    problem: 'El estado crítico concentra riesgo de abandono frente al resto del recorrido.',
    cause: 'El usuario puede no ver una acción principal clara o no encontrar suficiente contexto para confiar en el siguiente paso.',
    improvement:
      'Rediseñar el bloque de decisión del estado crítico con una sola acción principal, texto de orientación breve y enlaces de ayuda contextual. Añadir una alternativa de recuperación para usuarios que no estén listos para continuar.',
    action: 'Reducir el abandono desde el estado crítico y mejorar la continuidad del recorrido.',
    indicator: 'Porcentaje de abandono desde el estado crítico y avance hacia estados exitosos.',
    result: 'Más usuarios continúan el proceso y menos recorridos terminan en abandono.',
  },
]

const simpleImprovements = {
  form_completion:
    'Simplificar el formulario de contacto. Dejar solo los campos necesarios, mostrar ejemplos junto a cada campo y validar los datos antes del envio.',
  navigation_clarity:
    'Reordenar la navegación. Dejar una acción principal visible, usar nombres de botones más directos y mostrar siempre el camino para continuar.',
  donation_trust:
    'Hacer más claro el flujo de donación. Mostrar pasos, señales de seguridad, resumen del aporte y una opción visible de ayuda.',
  account_access:
    'Facilitar el acceso. Mostrar errores fáciles de entender, poner la recuperación de cuenta cerca del campo y explicar qué dato debe usar la persona.',
  content_route:
    'Conectar el contenido con una siguiente acción. Añadir botones claros para contacto, inscripción o donación sin interrumpir la lectura.',
  help_messages:
    'Reforzar mensajes de guía. Explicar qué ocurrió, qué debe corregir el usuario y qué botón debe presionar para continuar.',
  route_optimization:
    'Acortar el recorrido. Quitar pasos repetidos, acercar la acción principal y mostrar opciones breves cuando el usuario deba decidir.',
  critical_abandonment:
    'Atender primero el estado crítico. Mostrar una sola acción principal, añadir ayuda visual y ofrecer una salida de recuperación clara.',
}

const priorityActions = {
  form_completion: [
    'Revisar los campos del formulario de contacto y dejar visibles primero nombre, correo, teléfono, servicio y mensaje, porque son los datos que permiten responder una solicitud de EDIFICA o Top Speakers sin pedir información innecesaria.',
    'Agregar ayuda visual junto al campo de servicio para que la persona entienda si debe elegir Programa EDIFICA o Shows y conferencias antes de escribir el mensaje.',
    'Validar correo, teléfono y campos obligatorios antes de presionar enviar, de modo que el usuario pueda corregir el dato en el mismo lugar y no termine en formulario incompleto.',
    'Mostrar un resumen corto antes del envío y una confirmación posterior con el siguiente paso, tiempo estimado de respuesta y canales de contacto alternos.',
  ],
  navigation_clarity: [
    'Definir una acción principal por pantalla según la intención del usuario: conocer EDIFICA, contratar Top Speakers, contactar a la fundación o donar.',
    'Reordenar Header y Footer para que Inicio, Programas, Contáctanos, Donaciones y Tu aula mantengan nombres consistentes en todo el recorrido.',
    'Cambiar enlaces genéricos como “ver más” por etiquetas que expliquen el beneficio, por ejemplo “Conocer EDIFICA”, “Solicitar información” o “Hacer donación”.',
    'Añadir mensajes de orientación en las secciones donde el usuario regresa al inicio o cambia de módulo, para reducir saltos y abandonos por desorientación.',
  ],
  donation_trust: [
    'Explicar desde el inicio que las donaciones apoyan a familias en crisis económica mediante EDIFICA, para conectar el aporte con el impacto social.',
    'Mostrar los pasos del flujo de donación antes del formulario: ingresar datos, revisar aporte, confirmar pago y recibir comprobante.',
    'Añadir señales de seguridad cerca del botón de pago y aclarar si la salida ocurre hacia una plataforma externa como Donar Online o Bold.',
    'Permitir revisar el resumen del aporte antes de confirmar y mostrar una confirmación final con agradecimiento, comprobante y siguiente contacto.',
  ],
  account_access: [
    'Indicar en el inicio de sesión de Tu aula qué correo o usuario debe utilizar la persona, especialmente si viene de EDIFICA.',
    'Mostrar un error específico cuando falte usuario, correo o contraseña, para que la persona corrija el dato sin repetir intentos a ciegas.',
    'Ubicar la opción “¿Has olvidado tu contraseña?” junto al campo de contraseña y explicar que lleva al restablecimiento de acceso.',
    'Confirmar el resultado de la recuperación con un mensaje claro sobre el correo enviado y el siguiente paso para volver al aula virtual.',
  ],
  content_route: [
    'Cerrar cada noticia, testimonio o bloque informativo con una acción conectada al propósito de la página: conocer EDIFICA, contactar a la fundación o donar.',
    'Conectar contenidos sobre pobreza oculta, emprendimiento y productividad con formularios relevantes para que la lectura termine en una acción medible.',
    'Mantener visible un botón de contacto o inscripción en páginas de Programa EDIFICA y Top Speakers sin interrumpir la lectura principal.',
    'Usar mensajes que expliquen el beneficio de continuar, por ejemplo “Recibe orientación sobre EDIFICA” o “Solicita una conferencia para tu empresa”.',
  ],
  help_messages: [
    'Reescribir errores y estados pendientes con instrucciones completas: qué ocurrió, qué dato revisar y qué botón usar para continuar.',
    'Mostrar una acción inmediata de recuperación junto al error, como volver al campo, guardar el avance o contactar a la fundación.',
    'Cuando el caso quede pendiente, explicar qué pasará después, cuánto puede tardar la respuesta y qué canal puede usar la persona si necesita ayuda.',
    'Añadir ayuda contextual en el mismo punto del recorrido para evitar que el usuario abandone buscando respuestas fuera de la plataforma.',
  ],
  route_optimization: [
    'Identificar los pasos que no acercan al usuario a contactar, donar, inscribirse o acceder al aula, y retirar enlaces secundarios de la ruta principal.',
    'Mover la acción principal más cerca del punto de intención; por ejemplo, desde Inicio llevar a Contacto o EDIFICA sin obligar a pasar por demasiadas pantallas intermedias.',
    'Agrupar decisiones parecidas en una sola pantalla para que el usuario no tenga que elegir varias veces entre programas, servicios o contenidos relacionados.',
    'Mostrar una ruta recomendada cuando existan varias opciones, explicando cuál conviene para emprendedores, empresas, donantes o estudiantes de Tu aula.',
  ],
  critical_abandonment: [
    'Revisar la pantalla o enlace del estado crítico y reducir elementos que compitan con la acción principal.',
    'Dejar una sola acción principal visible y escrita con beneficio claro, para que el usuario sepa exactamente cómo avanzar.',
    'Añadir ayuda visual y texto de guía antes de que ocurra el abandono, especialmente si la persona debe llenar datos o salir a un enlace externo.',
    'Ofrecer una alternativa clara para retomar el recorrido, como volver a Inicio, ir a Contacto o solicitar ayuda por los canales de la fundación.',
  ],
}

const domainKnowledge = {
  contact: {
    source: 'Estados_Colombia_Comparte_Simulacion.txt, Colombia_Comparte_KB.txt y ColComparte.ipynb',
    purpose:
      'El contacto sirve para conectar a personas interesadas en Programa EDIFICA y a empresas interesadas en Shows y conferencias con el equipo de Colombia Comparte.',
    route:
      'La simulación original muestra que el flujo de contacto avanza por nombre, correo electrónico, teléfono, servicio, mensaje y botón de envío. También contempla finales de envío exitoso, fallido, interrumpido, formulario incompleto y abandono del formulario.',
    platformChange:
      'Mejorar el formulario de contacto, ordenar los campos por intención y explicar claramente el siguiente paso después del envío.',
    expected:
      'Más solicitudes completas hacia EDIFICA y Top Speakers, menos formularios incompletos y menos usuarios saliendo antes de enviar.',
  },
  donation: {
    source: 'Colombia_Comparte_KB.txt y ColComparte.ipynb',
    purpose:
      'Las donaciones apoyan a familias en crisis económica mediante el programa EDIFICA y pueden salir hacia una plataforma de pago externa.',
    route:
      'El notebook modela el flujo S9, S90, S91 y S92, con finales de donación exitosa, fallida, interrumpida, incompleta o abandonada.',
    platformChange:
      'Explicar el destino del aporte, mostrar pasos de pago, reforzar confianza y avisar cuando el usuario vaya a una plataforma externa.',
    expected:
      'Mayor confianza antes del pago, menos interrupciones y más donaciones confirmadas.',
  },
  aula: {
    source: 'Estados_Colombia_Comparte_Simulacion.txt y Colombia_Comparte_KB.txt',
    purpose:
      'Tu aula conecta a participantes con el aula virtual asociada a la formación y acompañamiento de Colombia Comparte.',
    route:
      'La simulación contempla usuario o correo, contraseña, mantener sesión, acceder y restablecer contraseña, con finales de acceso exitoso, denegado, incompleto o abandonado.',
    platformChange:
      'Aclarar credenciales, mejorar recuperación de contraseña y mostrar errores que permitan corregir el acceso sin frustración.',
    expected:
      'Más accesos exitosos, menos intentos repetidos y menor abandono en inicio de sesión o recuperación.',
  },
  edifica: {
    source: 'Colombia_Comparte_KB.txt',
    purpose:
      'EDIFICA es el programa principal de emprendimiento; ha ayudado a más de 1.200 personas y familias a volver a ser productivas mediante mentorías, coaching y formación integral.',
    route:
      'Los recorridos llevan desde Inicio, Sobre nosotros, Programas o Footer hacia Programa Edifica, Inscríbete y Contacto.',
    platformChange:
      'Conectar los mensajes de EDIFICA con inscripción o contacto, explicando a quién va dirigido y qué recibirá la persona.',
    expected:
      'Más usuarios entendiendo el valor del programa y avanzando hacia inscripción o solicitud de información.',
  },
  speakers: {
    source: 'Colombia_Comparte_KB.txt',
    purpose:
      'Top Speakers ofrece conferencias, talleres y shows para empresas que buscan fortalecer liderazgo, motivación, bienestar y productividad.',
    route:
      'Los recorridos llevan desde Programas o Footer hacia Top Speakers, más información y contacto.',
    platformChange:
      'Separar claramente la intención empresarial de Top Speakers frente a EDIFICA y llevar a un formulario de contacto orientado a empresas.',
    expected:
      'Más solicitudes corporativas completas y menos confusión entre servicios.',
  },
  content: {
    source: 'Colombia_Comparte_KB.txt y ColComparte.ipynb',
    purpose:
      'Las noticias, testimonios y páginas informativas explican la misión, pobreza oculta, EDIFICA, productividad y transformación social.',
    route:
      'El notebook muestra recorridos largos desde noticias hacia detalle, publicaciones recientes, regreso a noticias, blog, redes sociales o inicio.',
    platformChange:
      'Agregar llamadas a la acción al final de contenidos y evitar que las publicaciones recientes generen vueltas sin una acción concreta.',
    expected:
      'Más continuidad desde la lectura hacia contacto, inscripción o donación.',
  },
  navigation: {
    source: 'Estados_Colombia_Comparte_Simulacion.txt y ColComparte.ipynb',
    purpose:
      'Header y Footer son entradas principales hacia Inicio, Sobre nosotros, Programas, Actualidad, Contacto, Tu aula, Donaciones y Solicitudes DIAN.',
    route:
      'La simulación incluye rutas directas de abandono desde enlaces de navegación y rutas completas desde Header o Footer hacia módulos clave.',
    platformChange:
      'Unificar etiquetas, priorizar acciones principales y reducir salidas tempranas desde enlaces que no explican el siguiente paso.',
    expected:
      'Recorridos más cortos, menos confusión y mayor avance hacia estados útiles.',
  },
}

function getCriticalState(simulationData = {}) {
  return simulationData.critical_state || simulationData.criticalState || {}
}

function getSummary(simulationData = {}) {
  return simulationData.summary || simulationData.results || {}
}

function percent(value) {
  return `${Number(value || 0).toFixed(2)}%`
}

function number(value) {
  return Number(value || 0).toLocaleString('es-CO')
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function clean(text = '') {
  return normalizeText(String(text || '')).trim()
}

function normalizeSearchText(text = '') {
  return clean(text)
    .toLocaleLowerCase('es-CO')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function getDomainKey(candidate = {}, criticalState = {}) {
  const text = normalizeSearchText(
    `${criticalState.state || ''} ${criticalState.name || ''} ${criticalState.module || ''} ${criticalState.description || ''}`,
  )

  if (candidate.id === 'donation_trust' || text.match(/donacion|donaciones|donar|aporte|pago/)) {
    return 'donation'
  }

  if (candidate.id === 'account_access' || text.match(/aula|login|sesion|credencial|contrasena|acceso/)) {
    return 'aula'
  }

  if (candidate.id === 'form_completion' || text.match(/contact|formulario|nombre|correo|telefono|mensaje|dian/)) {
    return 'contact'
  }

  if (text.match(/edifica|inscribete|emprendimiento|programa/)) {
    return 'edifica'
  }

  if (text.match(/speaker|conferencia|show|empresa|corporativo/)) {
    return 'speakers'
  }

  if (candidate.id === 'content_route' || text.match(/noticia|blog|actualidad|testimonio|publicacion/)) {
    return 'content'
  }

  return 'navigation'
}

function getDomainContext(candidate = {}, criticalState = {}) {
  const key = getDomainKey(candidate, criticalState)
  return domainKnowledge[key] || domainKnowledge.navigation
}

function stateLabel(criticalState = {}) {
  if (!criticalState?.state) {
    return 'Sin estado crítico'
  }

  return `${criticalState.state} - ${clean(criticalState.name || 'Estado sin nombre')}`
}

function dominantMetric(summary = {}) {
  const metrics = [
    { id: 'abandono', label: 'abandono', value: Number(summary.abandonment_percentage || 0) },
    { id: 'error', label: 'error', value: Number(summary.error_percentage || 0) },
    { id: 'seguimiento', label: 'seguimiento pendiente', value: Number(summary.follow_up_percentage || 0) },
  ]
  return metrics.sort((left, right) => right.value - left.value)[0]
}

function buildSimulationText(simulationData = {}, group = 'LatinoAmerica Comparte') {
  const criticalState = getCriticalState(simulationData)
  const summary = getSummary(simulationData)
  const topRoute = summary.top_routes?.[0]?.route || 'sin ruta dominante'
  const dominant = dominantMetric(summary)
  const domain = getDomainContext({}, criticalState)

  return [
    `Grupo: ${group}.`,
    `Estado critico detectado: ${stateLabel(criticalState)}.`,
    `Modulo: ${clean(criticalState.module || 'sin modulo')}.`,
    `Tipo: ${clean(criticalState.type || 'sin tipo')}.`,
    `Descripcion: ${clean(criticalState.description || '')}.`,
    `Problema detectado: ${dominant.label} con ${percent(dominant.value)}.`,
    `Resultados de simulacion: ${number(summary.total_users)} usuarios, exito ${percent(summary.success_percentage)}, abandono ${percent(summary.abandonment_percentage)}, error ${percent(summary.error_percentage)}, seguimiento ${percent(summary.follow_up_percentage)}, promedio ${Number(summary.average_steps || 0).toFixed(2)} pasos.`,
    `Abandonos desde estado critico: ${number(criticalState.abandonments_from_state)}; porcentaje sobre abandonos ${percent(criticalState.percentage_over_abandonments)}.`,
    `Ruta dominante: ${topRoute}.`,
    `Contexto de conocimiento: ${domain.purpose} ${domain.route} ${domain.platformChange}`,
  ].join(' ')
}

function keywordScore(candidate, context) {
  const normalized = context
    .toLocaleLowerCase('es-CO')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  return candidate.keywords.reduce((score, keyword) => {
    const normalizedKeyword = keyword
      .toLocaleLowerCase('es-CO')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

    return normalized.includes(normalizedKeyword) ? score + 0.16 : score
  }, 0)
}

function metricScore(candidate, summary = {}, criticalState = {}) {
  const abandonment = Number(summary.abandonment_percentage || 0)
  const error = Number(summary.error_percentage || 0)
  const followUp = Number(summary.follow_up_percentage || 0)
  const steps = Number(summary.average_steps || 0)
  const module = clean(criticalState.module).toLocaleLowerCase('es-CO')
  const name = clean(criticalState.name).toLocaleLowerCase('es-CO')
  const text = `${module} ${name}`

  const scoreById = {
    form_completion: text.match(/formulario|contact|dian/) ? 0.4 : 0,
    navigation_clarity: text.match(/header|footer|inicio|menu|ver mas|ver más/) ? 0.38 : 0,
    donation_trust: text.includes('donacion') || text.includes('donación') ? 0.42 : 0,
    account_access: text.includes('aula') || text.includes('acceso') ? 0.42 : 0,
    content_route: text.match(/programa|noticia|blog|actualidad|edifica|speaker/) ? 0.35 : 0,
    help_messages: error >= 6 || followUp >= 6 ? 0.35 : 0,
    route_optimization: steps >= 7 ? 0.32 : 0,
    critical_abandonment: abandonment >= 10 ? 0.36 : 0,
  }

  return scoreById[candidate.id] || 0
}

function getHeuristicScore(candidate, simulationData, group) {
  const criticalState = getCriticalState(simulationData)
  const summary = getSummary(simulationData)
  const context = buildSimulationText(simulationData, group)
  return Math.min(1, keywordScore(candidate, context) + metricScore(candidate, summary, criticalState))
}

function selectHeuristicCandidate(simulationData, group) {
  return recommendationCandidates
    .map((candidate) => ({
      candidate,
      score: getHeuristicScore(candidate, simulationData, group),
    }))
    .sort((left, right) => right.score - left.score)[0]?.candidate || recommendationCandidates[0]
}

function buildPriorityActions(candidate, criticalState = {}) {
  const stateName = clean(criticalState.name || criticalState.state || 'estado crítico')
  const baseActions = priorityActions[candidate.id] || priorityActions.critical_abandonment
  const domain = getDomainContext(candidate, criticalState)

  return [
    `Priorizar ${stateName}: revisar primero este punto porque concentra el mayor riesgo y está conectado con ${domain.purpose.toLocaleLowerCase('es-CO')}`,
    ...baseActions,
  ].slice(0, 5)
}

function buildClearImprovement(candidate, simulationData, group, impact = {}) {
  const criticalState = getCriticalState(simulationData)
  const summary = getSummary(simulationData)
  const domain = getDomainContext(candidate, criticalState)
  const state = criticalState?.state
    ? `${criticalState.state} (${clean(criticalState.name || 'estado sin nombre')})`
    : 'el punto con más fricción'
  const totalUsers = number(summary.total_users)
  const abandonment = percent(summary.abandonment_percentage)
  const error = percent(summary.error_percentage)
  const followUp = percent(summary.follow_up_percentage)
  const averageSteps = Number(summary.average_steps || 0).toFixed(2)
  const criticalAbandonments = number(criticalState.abandonments_from_state)
  const criticalShare = percent(criticalState.percentage_over_abandonments)
  const topRoute = clean(summary.top_routes?.[0]?.route || summary.most_common_route || '')
  const actions = buildPriorityActions(candidate, criticalState)
  const actionPlan = actions
    .map((action, index) => `${index + 1}. ${action}`)
    .join(' ')

  return [
    `Qué hacer: Se recomienda intervenir primero ${state} porque es el punto donde la experiencia puede estar perdiendo continuidad. Para ${group}, el cambio debe enfocarse en ${domain.platformChange.toLocaleLowerCase('es-CO')} Esta recomendación usa como contexto los estados del sistema, la base de conocimiento de Colombia Comparte y los recorridos originales de simulación; por eso no se limita a “acortar el recorrido”, sino que conecta la acción con la misión, los servicios y los pasos reales de la plataforma.`,
    `Por qué hacerlo: La simulación de ${totalUsers} usuarios muestra ${abandonment} de abandono, ${error} de error, ${followUp} de seguimiento pendiente y un promedio de ${averageSteps} pasos. En el estado crítico se registran ${criticalAbandonments} abandonos asociados, equivalentes al ${criticalShare} de los abandonos observados. ${topRoute ? `Además, la ruta dominante detectada fue ${topRoute}, lo que permite ubicar dónde se repite la fricción antes de que el usuario llegue a un resultado útil.` : ''} Según la base de conocimiento, ${domain.purpose.toLocaleLowerCase('es-CO')} Si el usuario no entiende esa relación, puede abandonar antes de contactar, donar, inscribirse o acceder al aula.`,
    `Cómo hacerlo paso a paso: ${actionPlan} Estas acciones deben aplicarse primero en la pantalla del estado crítico y después revisarse en los enlaces de entrada relacionados, especialmente Header, Footer y las rutas que llegan desde Inicio, Programas, Contacto, Donaciones o Tu aula.`,
    `Resultado esperado: Al aplicar la mejora, se espera que la experiencia sea más clara, que el usuario entienda qué debe hacer y que disminuyan las salidas antes de completar la acción. La estimación del modelo indica una probabilidad de éxito cercana a ${impact.probabilidad_exito || 'un valor pendiente de simulación'} y una ${impact.reduccion_abandono || 'reducción de abandono pendiente de simulación'}. En términos prácticos, ${impact.descripcion || 'la reducción esperada se actualizará con los datos de la siguiente simulación.'}`,
  ].join('\n\n')
}

function buildImpactEstimate(summary = {}, criticalState = {}, score = 0) {
  const success = Number(summary.success_percentage || 0)
  const abandonment = Number(summary.abandonment_percentage || 0)
  const error = Number(summary.error_percentage || 0)
  const criticalShare = Number(criticalState.percentage_over_abandonments || 0)

  let lowerReduction = 12
  let upperReduction = 22

  if (abandonment >= 25 || criticalShare >= 45) {
    lowerReduction = 25
    upperReduction = 40
  } else if (abandonment >= 15 || error >= 10 || criticalShare >= 30) {
    lowerReduction = 18
    upperReduction = 32
  }

  const expectedReductionPoints = abandonment * ((lowerReduction + upperReduction) / 2 / 100)
  const expectedSuccess = clamp(success + expectedReductionPoints * 0.8 + error * 0.12 + Number(score || 0) * 2, 0, 96)
  const afterLower = clamp(abandonment - abandonment * (upperReduction / 100), 0, 100)
  const afterUpper = clamp(abandonment - abandonment * (lowerReduction / 100), 0, 100)

  return {
    probabilidad_exito: `${expectedSuccess.toFixed(1)}%`,
    reduccion_abandono: `${lowerReduction}% a ${upperReduction}% menos abandono en el estado crítico`,
    descripcion: `El abandono general podría pasar de ${percent(abandonment)} a un rango cercano entre ${percent(afterLower)} y ${percent(afterUpper)} si se aplican las acciones prioritarias.`,
  }
}

function modelLabel(model = '', modelUsed = '') {
  const requested = clean(model)
  if (requested.toLocaleLowerCase('es-CO').includes('senua')) {
    return `Senua multilingual (${modelUsed || FALLBACK_MODEL})`
  }

  return modelUsed || requested || FALLBACK_MODEL
}

function enrichRecommendation(candidate, simulationData, options = {}) {
  const { group = 'LatinoAmerica Comparte', model = '', modelUsed = '', status = 'fallback', score = 0 } = options
  const criticalState = getCriticalState(simulationData)
  const summary = getSummary(simulationData)
  const dominant = dominantMetric(summary)
  const fallbackRecommendation = simulationData?.recommendation || {}
  const criticalLabel = stateLabel(criticalState)
  const evidence = `La simulación de ${number(summary.total_users)} usuarios muestra ${percent(summary.abandonment_percentage)} de abandono, ${percent(summary.error_percentage)} de error y un promedio de ${Number(summary.average_steps || 0).toFixed(2)} pasos.`
  const actions = buildPriorityActions(candidate, criticalState)
  const impact = buildImpactEstimate(summary, criticalState, score)
  const effectiveModel = modelUsed || model
  const domain = getDomainContext(candidate, criticalState)

  return {
    estado_analizado: criticalLabel,
    problema_detectado:
      criticalState?.state
        ? `${candidate.problem} ${evidence}`
        : clean(fallbackRecommendation.problema_detectado) || 'No se detectaron abandonos suficientes para priorizar un punto del recorrido.',
    posible_causa:
      criticalState?.state
        ? `${candidate.cause} La señal principal del modelo apunta a ${dominant.label} como resultado negativo dominante.`
        : clean(fallbackRecommendation.posible_causa) || 'La simulación no produjo un patrón dominante de abandono.',
    mejora_recomendada:
      criticalState?.state
        ? buildClearImprovement(candidate, simulationData, group, impact)
        : clean(fallbackRecommendation.mejora_recomendada) || 'Ejecutar una simulación con más usuarios o revisar más recorridos base.',
    acciones_prioritarias: criticalState?.state
      ? actions
      : ['Ejecutar una nueva simulación con más usuarios.', 'Revisar recorridos base antes de priorizar cambios.'],
    impacto_esperado: impact,
    accion_esperada: candidate.action,
    indicador_para_validar: candidate.indicator,
    resultado_esperado: candidate.result,
    model,
    model_used: effectiveModel,
    model_label: modelLabel(model, effectiveModel),
    knowledge_sources: domain.source,
    recommendation_source: status,
    nlp_confidence: Number(score || 0).toFixed(2),
  }
}

function resolveModelCandidates(model = '') {
  const requested = clean(model)
  const mapped = MODEL_NAMESPACE[requested] || MODEL_NAMESPACE[requested.toLocaleLowerCase('es-CO')] || requested
  const candidates = []

  if (mapped) {
    candidates.push(mapped)
  }

  if (!candidates.includes(FALLBACK_MODEL)) {
    candidates.push(FALLBACK_MODEL)
  }

  return candidates
}

async function getExtractor(model, onProgress) {
  const { pipeline } = await import('@huggingface/transformers')
  const candidates = resolveModelCandidates(model)
  let lastError = null

  for (const modelId of candidates) {
    const cacheKey = `${modelId}:feature-extraction`
    if (!extractorCache.has(cacheKey)) {
      extractorCache.set(
        cacheKey,
        pipeline('feature-extraction', modelId, {
          dtype: 'q8',
          progress_callback: onProgress,
        }),
      )
    }

    try {
      const extractor = await extractorCache.get(cacheKey)
      return { extractor, modelId }
    } catch (error) {
      extractorCache.delete(cacheKey)
      lastError = error
    }
  }

  throw lastError || new Error('No fue posible cargar un modelo NLP gratuito.')
}

function tensorToVectors(output) {
  const data = Array.from(output?.data || output || [])
  const dims = output?.dims || output?.shape || []

  if (!data.length) {
    return []
  }

  if (!dims.length || dims.length === 1) {
    return [data]
  }

  const rows = dims[0] || 1
  const rowSize = Math.max(1, Math.floor(data.length / rows))
  return Array.from({ length: rows }, (_, index) => data.slice(index * rowSize, (index + 1) * rowSize))
}

function cosineSimilarity(left = [], right = []) {
  const length = Math.min(left.length, right.length)
  if (!length) {
    return 0
  }

  let dot = 0
  let leftNorm = 0
  let rightNorm = 0
  for (let index = 0; index < length; index += 1) {
    dot += left[index] * right[index]
    leftNorm += left[index] * left[index]
    rightNorm += right[index] * right[index]
  }

  if (!leftNorm || !rightNorm) {
    return 0
  }

  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm))
}

async function embedTexts(extractor, texts) {
  const output = await extractor(texts, { pooling: 'mean', normalize: true })
  return tensorToVectors(output)
}

export function buildFallbackRecommendation(simulationData, { model = '', group = 'LatinoAmerica Comparte' } = {}) {
  const candidate = selectHeuristicCandidate(simulationData, group)
  return enrichRecommendation(candidate, simulationData, {
    group,
    model,
    modelUsed: 'Reglas UX locales',
    status: 'fallback',
    score: getHeuristicScore(candidate, simulationData, group),
  })
}

export async function generateNlpRecommendation(
  simulationData,
  { model = DEFAULT_RECOMMENDATION_MODEL, group = 'LatinoAmerica Comparte', onProgress } = {},
) {
  const fallback = buildFallbackRecommendation(simulationData, { model, group })

  if (!simulationData || typeof window === 'undefined') {
    return fallback
  }

  try {
    const { extractor, modelId } = await getExtractor(model, onProgress)
    const context = buildSimulationText(simulationData, group)
    const candidateTexts = recommendationCandidates.map((candidate) => {
      const domain = getDomainContext(candidate, getCriticalState(simulationData))
      return `${candidate.context} ${candidate.improvement} ${domain.purpose} ${domain.route} ${domain.platformChange} ${domain.expected}`
    })
    const vectors = await embedTexts(extractor, [context, ...candidateTexts])
    const contextVector = vectors[0]
    const candidateVectors = vectors.slice(1)

    const ranked = recommendationCandidates
      .map((candidate, index) => {
        const semanticScore = Math.max(0, cosineSimilarity(contextVector, candidateVectors[index]))
        const heuristic = getHeuristicScore(candidate, simulationData, group)
        return {
          candidate,
          score: semanticScore * 0.72 + heuristic * 0.28,
        }
      })
      .sort((left, right) => right.score - left.score)

    const selected = ranked[0] || { candidate: selectHeuristicCandidate(simulationData, group), score: 0 }
    return enrichRecommendation(selected.candidate, simulationData, {
      group,
      model,
      modelUsed: modelId,
      status: 'nlp',
      score: selected.score,
    })
  } catch (error) {
    return {
      ...fallback,
      recommendation_source: 'fallback',
      model_error: clean(error?.message || 'No fue posible ejecutar el modelo NLP en el navegador.'),
    }
  }
}

export function recommendationStatusText(recommendation = {}) {
  const data = recommendation || {}

  if (data.recommendation_source === 'nlp') {
    return 'Recomendación actualizada automáticamente'
  }

  if (data.model_error) {
    return 'Recomendación generada con respaldo local'
  }

  return 'Preparando recomendación automática'
}
