// Generador determinístico de registros de prueba (transacciones CBR y ofertas de mercado).
// En producción este módulo se reemplaza por la API que consulta la base de datos real.
import { COMUNAS, FACTOR_DESTINO, AÑO_INICIO, AÑO_ACTUAL, UF_CLP } from './comunas.js'

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20261030)
const between = (a, b) => a + rand() * (b - a)
const int = (a, b) => Math.floor(between(a, b + 1))
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
const weighted = (pairs) => {
  const total = pairs.reduce((s, [, w]) => s + w, 0)
  let r = rand() * total
  for (const [v, w] of pairs) if ((r -= w) <= 0) return v
  return pairs[0][0]
}

// Lado donde está el mar, para no ubicar puntos en el océano.
const COSTA = {
  Arica: 'O', Iquique: 'O', Antofagasta: 'O', 'La Serena': 'O', Coquimbo: 'O',
  Valparaíso: 'N', 'Viña del Mar': 'O', Concón: 'O', 'San Antonio': 'O',
  Talcahuano: 'O', 'San Pedro de la Paz': 'O', 'Punta Arenas': 'E', 'Puerto Montt': 'S', Castro: 'E',
}

const CALLES = [
  'Av. Libertador B. O’Higgins', 'Los Aromos', 'Pedro de Valdivia', 'Manuel Montt', 'Los Carrera',
  'Arturo Prat', 'Baquedano', 'Freire', 'Colón', 'San Martín', 'Los Pinos', 'Las Acacias',
  'Av. Independencia', 'Bulnes', 'Carrera', 'Balmaceda', 'Lautaro', 'Caupolicán', 'Gabriela Mistral',
  'Pablo Neruda', 'Los Robles', 'El Bosque', 'Las Encinas', 'Av. Grecia', 'Serrano', 'Yungay',
  'Chacabuco', 'Maipú', 'Rodríguez', 'Sargento Aldea', 'Esmeralda', 'Condell', 'Av. Brasil',
]
const CAMINOS = ['Camino Real', 'Camino a la Costa', 'Ruta 5 Sur', 'Camino Interior', 'Camino Los Boldos', 'Camino El Alba']
const PORTALES = ['Portal Inmobiliario', 'TocToc', 'Yapo', 'Corredora asociada', 'Mercado Libre Inmuebles']

const TIPOLOGIAS_URBANAS = [
  ['Departamento', 34], ['Casa', 32], ['Local comercial', 9], ['Oficina', 8],
  ['Galpón', 5], ['Sitio', 7],
]
const DESTINO_TIPOLOGIA = {
  Departamento: 'Habitacional', Casa: 'Habitacional', 'Local comercial': 'Comercio',
  Oficina: 'Oficina', Galpón: 'Industria', Sitio: 'Sitio eriazo', Parcela: 'Agrícola',
}

function superficies(tipologia) {
  switch (tipologia) {
    case 'Departamento': return { t: int(15, 60), c: int(35, 140) }
    case 'Casa': return { t: int(140, 700), c: int(60, 260) }
    case 'Local comercial': return { t: int(80, 500), c: int(40, 400) }
    case 'Oficina': return { t: int(10, 80), c: int(30, 250) }
    case 'Galpón': return { t: int(800, 6000), c: int(400, 3000) }
    case 'Sitio': return { t: int(200, 2500), c: 0 }
    case 'Parcela': return { t: int(5000, 50000), c: rand() < 0.6 ? int(60, 250) : 0 }
  }
}

function normas(zona, destino) {
  if (zona === 'Rural') {
    return {
      zonaPRC: 'Área rural (fuera de límite urbano)',
      usosPermitidos: 'Agrícola, ganadero, forestal; vivienda del propietario (Art. 55 LGUC)',
      coefConstructibilidad: '—',
      coefOcupacion: '—',
      alturaMaxima: '—',
      densidad: '—',
      subdivisionMinima: '0,5 ha (DL 3.516)',
    }
  }
  const z = destino === 'Industria' ? 'ZI' : destino === 'Habitacional' ? 'ZH' : 'ZM'
  return {
    zonaPRC: `${z}-${int(1, 6)}`,
    usosPermitidos:
      z === 'ZI' ? 'Actividades productivas, bodegaje, equipamiento' :
      z === 'ZH' ? 'Residencial, equipamiento de escala menor' : 'Residencial, comercio, servicios, equipamiento',
    coefConstructibilidad: between(0.6, 4).toFixed(1),
    coefOcupacion: between(0.3, 0.8).toFixed(2),
    alturaMaxima: `${int(2, 18)} pisos`,
    densidad: `${int(80, 1200)} hab/ha`,
    subdivisionMinima: `${int(1, 10) * 100} m²`,
  }
}

function offset(comuna, rural) {
  const r = rural ? between(0.04, 0.14) : Math.abs(between(-1, 1) * between(0, 1)) * 0.035 + 0.002
  const a = rand() * Math.PI * 2
  let dlat = Math.sin(a) * r
  let dlng = Math.cos(a) * r
  const lado = COSTA[comuna.nombre]
  if (lado === 'O') dlng = Math.abs(dlng)
  if (lado === 'E') dlng = -Math.abs(dlng)
  if (lado === 'S') dlat = Math.abs(dlat)
  if (lado === 'N') dlat = -Math.abs(dlat)
  return [comuna.lat + dlat, comuna.lng + dlng]
}

function fechaEnAño(año) {
  const maxMes = año === AÑO_ACTUAL ? 9 : 11
  const d = new Date(año, int(0, maxMes), int(1, 28))
  return d.toISOString().slice(0, 10)
}

// Comunas sin área rural: todos sus registros son urbanos.
const SOLO_URBANAS = new Set([
  'Santiago', 'Providencia', 'Las Condes', 'Vitacura', 'Ñuñoa', 'La Reina', 'Macul', 'San Miguel',
  'Estación Central', 'Independencia', 'Recoleta', 'La Florida', 'Peñalolén', 'Maipú', 'Quilicura',
  'Viña del Mar', 'Talcahuano', 'San Pedro de la Paz', 'Concón',
])

function crearRegistro(id, comuna, tipo) {
  const rural = !SOLO_URBANAS.has(comuna.nombre) && rand() < 0.12
  const zona = rural ? 'Rural' : 'Urbano'
  const tipologia = rural ? (rand() < 0.85 ? 'Parcela' : 'Casa') : weighted(TIPOLOGIAS_URBANAS)
  const destino = DESTINO_TIPOLOGIA[tipologia]
  const { t: supTerreno, c: supConstruccion } = superficies(tipologia)
  const año = tipo === 'CBR' ? int(AÑO_INICIO, AÑO_ACTUAL) : AÑO_ACTUAL
  const crecimiento = Math.pow(1 + comuna.g, año - AÑO_INICIO)
  const ruido = between(0.78, 1.25)

  let valorTerreno, valorConstruccion
  if (tipologia === 'Parcela') {
    valorTerreno = supTerreno * comuna.uf * 0.012 * crecimiento * ruido
    valorConstruccion = supConstruccion * between(10, 18)
  } else if (supConstruccion === 0) {
    valorTerreno = supTerreno * comuna.uf * 0.3 * crecimiento * ruido
    valorConstruccion = 0
  } else {
    const ufM2 = comuna.uf * FACTOR_DESTINO[destino] * crecimiento * ruido
    const total = supConstruccion * ufM2
    const share = tipologia === 'Galpón' ? between(0.45, 0.65) : between(0.28, 0.45)
    valorTerreno = total * share
    valorConstruccion = total - valorTerreno
  }
  let valorTotal = valorTerreno + valorConstruccion
  if (tipo === 'Oferta') {
    const premio = between(1.03, 1.15)
    valorTotal *= premio
    valorTerreno *= premio
    valorConstruccion *= premio
  }

  const [lat, lng] = offset(comuna, rural)
  const fecha = tipo === 'CBR' ? fechaEnAño(año) : fechaEnAño(AÑO_ACTUAL)
  const direccion = rural
    ? `${pick(CAMINOS)} km ${int(1, 25)}, Parcela ${int(1, 80)}`
    : tipologia === 'Departamento' || tipologia === 'Oficina'
      ? `${pick(CALLES)} ${int(100, 3999)}, ${tipologia === 'Oficina' ? 'Of.' : 'Depto.'} ${int(1, 22)}0${int(1, 9)}`
      : `${pick(CALLES)} ${int(10, 3999)}`

  const r = {
    id,
    tipo,
    comuna: comuna.nombre,
    region: comuna.region,
    zona,
    tipologia,
    destino,
    direccion,
    rol: `${int(100, 9999)}-${int(1, 350)}`,
    año,
    fecha,
    supTerreno,
    supConstruccion,
    añoConstruccion: supConstruccion ? int(1960, Math.min(año, 2025)) : null,
    valorTotal: Math.round(valorTotal),
    valorTerreno: Math.round(valorTerreno),
    valorConstruccion: Math.round(valorConstruccion),
    lat: +lat.toFixed(6),
    lng: +lng.toFixed(6),
    normas: normas(zona, destino),
  }
  r.valorCLP = r.valorTotal * UF_CLP
  r.ufM2 = +(r.valorTotal / (r.supConstruccion || r.supTerreno)).toFixed(2)

  if (tipo === 'CBR') {
    r.cbr = `CBR de ${comuna.nombre}`
    r.fojas = int(100, 12000)
    r.numero = int(1, 20000)
    r.añoInscripcion = año
  } else {
    r.portal = pick(PORTALES)
    r.operacion = 'Venta'
    r.diasPublicada = int(1, 180)
  }
  return r
}

export function generarRegistros() {
  const out = []
  let id = 1
  for (const c of COMUNAS) {
    const nCbr = Math.round(60 + c.uf * 1.2)
    const nOfertas = Math.round(nCbr * 0.3)
    for (let i = 0; i < nCbr; i++) out.push(crearRegistro(id++, c, 'CBR'))
    for (let i = 0; i < nOfertas; i++) out.push(crearRegistro(id++, c, 'Oferta'))
  }
  return out
}

export const REGISTROS = generarRegistros()
