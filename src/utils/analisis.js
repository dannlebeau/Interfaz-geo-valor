import { REGISTROS } from '../data/generate.js'
import { AÑO_INICIO, AÑO_ACTUAL, CAP_RATE } from '../data/comunas.js'
import { mediana, percentil } from './format.js'

const valorM2 = (r) => r.valorTotal / (r.supConstruccion || r.supTerreno)

// Serie anual de mediana UF/m² (transacciones CBR) para una comuna y tipología.
export function seriePlusvalia(comuna, tipologia = null) {
  const base = REGISTROS.filter(
    (r) => r.tipo === 'CBR' && r.comuna === comuna && (!tipologia || r.tipologia === tipologia),
  )
  const serie = []
  for (let a = AÑO_INICIO; a <= AÑO_ACTUAL; a++) {
    const vals = base.filter((r) => r.año === a).map(valorM2)
    serie.push({ año: a, valor: vals.length ? +mediana(vals).toFixed(1) : null, n: vals.length })
  }
  return serie
}

export function variacion(serie) {
  const v = serie.filter((p) => p.valor != null)
  if (v.length < 2) return { total: null, anual: null }
  const first = v[0], last = v.at(-1)
  const total = last.valor / first.valor - 1
  const anual = Math.pow(last.valor / first.valor, 1 / (last.año - first.año)) - 1
  return { total, anual }
}

// Tasación online (sin visita): método comparativo de mercado con ajustes,
// contraste con ofertas vigentes y análisis de rentabilidad por arriendo.
export function tasar({ comuna, tipologia, supTerreno, supConstruccion, añoConstruccion, estado }) {
  const usaConst = supConstruccion > 0 && tipologia !== 'Sitio' && tipologia !== 'Parcela'
  const sup = usaConst ? supConstruccion : supTerreno
  const supDe = (r) => (usaConst ? r.supConstruccion : r.supTerreno)

  // 1. Ventas reales (CBR) comparables: misma comuna y tipología, últimos 3 años,
  //    superficie en ±50%. Se amplía el criterio si hay pocos.
  let ventas = REGISTROS.filter(
    (r) => r.tipo === 'CBR' && r.comuna === comuna && r.tipologia === tipologia && r.año >= AÑO_ACTUAL - 2,
  )
  let criterio = 'misma tipología, últimos 3 años'
  const porSup = ventas.filter((r) => supDe(r) >= sup * 0.5 && supDe(r) <= sup * 1.5)
  if (porSup.length >= 5) { ventas = porSup; criterio += ', superficie ±50%' }
  if (ventas.length < 5) {
    ventas = REGISTROS.filter((r) => r.tipo === 'CBR' && r.comuna === comuna && r.tipologia === tipologia)
    criterio = `misma tipología en la comuna, ${AÑO_INICIO}–${AÑO_ACTUAL}`
  }
  if (ventas.length < 3) {
    const region = REGISTROS.find((r) => r.comuna === comuna)?.region
    ventas = REGISTROS.filter((r) => r.tipo === 'CBR' && r.region === region && r.tipologia === tipologia && r.año >= AÑO_ACTUAL - 5)
    criterio = `misma tipología en comunas de la Región ${region}, últimos 6 años`
  }
  if (ventas.length < 3) throw new Error('No hay suficientes transacciones comparables para esta tipología en la comuna ni en la región')

  // Actualiza cada venta a valor presente con la plusvalía anual de la comuna.
  const serie = []
  const anual = (() => {
    const all = REGISTROS.filter((r) => r.tipo === 'CBR' && r.comuna === comuna && r.tipologia === tipologia)
    const byYear = {}
    all.forEach((r) => (byYear[r.año] ||= []).push(valorM2(r)))
    Object.entries(byYear).forEach(([a, v]) => serie.push({ año: +a, valor: mediana(v) }))
    serie.sort((a, b) => a.año - b.año)
    return variacion(serie).anual ?? 0.03
  })()

  const comparables = ventas
    .map((r) => {
      const m2v = valorM2(r)
      const actualizado = m2v * Math.pow(1 + anual, AÑO_ACTUAL - r.año)
      return { ...r, ufM2: +m2v.toFixed(1), ufM2Actualizado: +actualizado.toFixed(1), dif: Math.abs(supDe(r) - sup) / sup }
    })
    .sort((a, b) => a.dif - b.dif)
    .slice(0, 12)

  const m2Ventas = mediana(comparables.map((c) => c.ufM2Actualizado))

  // 2. Mercado: ofertas vigentes de la misma tipología en la comuna.
  const ofertas = REGISTROS.filter((r) => r.tipo === 'Oferta' && r.comuna === comuna && r.tipologia === tipologia)
  const m2Ofertas = ofertas.length ? mediana(ofertas.map(valorM2)) : null
  const brecha = m2Ofertas ? m2Ofertas / m2Ventas - 1 : null

  // 3. Ajustes por antigüedad y estado de conservación.
  const edad = añoConstruccion ? AÑO_ACTUAL - añoConstruccion : 0
  const ajusteEdad = usaConst ? Math.max(-0.25, -0.004 * Math.max(0, edad - 5)) : 0
  const ajusteEstado = { Excelente: 0.05, Bueno: 0, Regular: -0.08, Malo: -0.18 }[estado] ?? 0
  const m2Final = m2Ventas * (1 + ajusteEdad + ajusteEstado)

  const valorUF = Math.round(m2Final * sup)
  const p25 = percentil(comparables.map((c) => c.ufM2Actualizado), 0.25)
  const p75 = percentil(comparables.map((c) => c.ufM2Actualizado), 0.75)
  const factor = 1 + ajusteEdad + ajusteEstado

  // 4. Rentabilidad: arriendo estimado según tasa de capitalización de referencia.
  const destino = comparables[0].destino
  const cap = CAP_RATE[destino] ?? 0.05
  const arriendoMensual = Math.round((valorUF * cap) / 12 * 10) / 10
  const gastos = 0.15 // contribuciones, mantención, vacancia
  const rentaNeta = cap * (1 - gastos)

  return {
    valorUF,
    rangoMin: Math.round(p25 * factor * sup),
    rangoMax: Math.round(p75 * factor * sup),
    ufM2: +m2Final.toFixed(1),
    superficieBase: usaConst ? 'construida' : 'de terreno',
    ventas: {
      criterio, n: comparables.length, medianaM2: +m2Ventas.toFixed(1), plusvaliaAnual: anual,
      comparables: comparables.map(({ id, direccion, rol, fecha, año, supTerreno, supConstruccion, valorTotal, ufM2, ufM2Actualizado, lat, lng }) =>
        ({ id, direccion, rol, fecha, año, supTerreno, supConstruccion, valorTotal, ufM2, ufM2Actualizado, lat, lng })),
    },
    mercado: {
      n: ofertas.length,
      medianaM2: m2Ofertas ? +m2Ofertas.toFixed(1) : null,
      brecha,
      diasPromedio: ofertas.length ? Math.round(ofertas.reduce((s, o) => s + o.diasPublicada, 0) / ofertas.length) : null,
    },
    ajustes: { edad: ajusteEdad, estado: ajusteEstado },
    rentabilidad: { capRate: cap, arriendoMensual, rentaNeta, gastos, añosRecupero: +(1 / rentaNeta).toFixed(1) },
  }
}
