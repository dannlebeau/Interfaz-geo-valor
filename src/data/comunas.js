// Comunas con cobertura en la plataforma.
// uf: valor base de referencia UF/m² construido (habitacional) en 2015; g: plusvalía anual promedio.
export const COMUNAS = [
  { nombre: 'Arica', region: 'Arica y Parinacota', lat: -18.4783, lng: -70.3126, uf: 28, g: 0.035 },
  { nombre: 'Iquique', region: 'Tarapacá', lat: -20.2133, lng: -70.1503, uf: 34, g: 0.04 },
  { nombre: 'Antofagasta', region: 'Antofagasta', lat: -23.6509, lng: -70.3975, uf: 38, g: 0.038 },
  { nombre: 'Calama', region: 'Antofagasta', lat: -22.456, lng: -68.929, uf: 30, g: 0.03 },
  { nombre: 'Copiapó', region: 'Atacama', lat: -27.3668, lng: -70.3323, uf: 26, g: 0.032 },
  { nombre: 'La Serena', region: 'Coquimbo', lat: -29.9027, lng: -71.2519, uf: 35, g: 0.045 },
  { nombre: 'Coquimbo', region: 'Coquimbo', lat: -29.9533, lng: -71.3436, uf: 30, g: 0.042 },
  { nombre: 'Ovalle', region: 'Coquimbo', lat: -30.601, lng: -71.199, uf: 22, g: 0.03 },
  { nombre: 'Valparaíso', region: 'Valparaíso', lat: -33.0472, lng: -71.6127, uf: 32, g: 0.035 },
  { nombre: 'Viña del Mar', region: 'Valparaíso', lat: -33.0245, lng: -71.5518, uf: 45, g: 0.04 },
  { nombre: 'Quilpué', region: 'Valparaíso', lat: -33.048, lng: -71.442, uf: 30, g: 0.038 },
  { nombre: 'Concón', region: 'Valparaíso', lat: -32.93, lng: -71.52, uf: 48, g: 0.045 },
  { nombre: 'San Antonio', region: 'Valparaíso', lat: -33.593, lng: -71.608, uf: 22, g: 0.03 },
  { nombre: 'Los Andes', region: 'Valparaíso', lat: -32.834, lng: -70.598, uf: 26, g: 0.036 },
  { nombre: 'Quillota', region: 'Valparaíso', lat: -32.88, lng: -71.247, uf: 25, g: 0.034 },
  { nombre: 'Santiago', region: 'Metropolitana', lat: -33.4489, lng: -70.6693, uf: 48, g: 0.03 },
  { nombre: 'Providencia', region: 'Metropolitana', lat: -33.4314, lng: -70.6093, uf: 70, g: 0.04 },
  { nombre: 'Las Condes', region: 'Metropolitana', lat: -33.408, lng: -70.567, uf: 80, g: 0.042 },
  { nombre: 'Vitacura', region: 'Metropolitana', lat: -33.39, lng: -70.572, uf: 95, g: 0.04 },
  { nombre: 'Lo Barnechea', region: 'Metropolitana', lat: -33.35, lng: -70.518, uf: 85, g: 0.045 },
  { nombre: 'Ñuñoa', region: 'Metropolitana', lat: -33.4569, lng: -70.5975, uf: 62, g: 0.045 },
  { nombre: 'La Reina', region: 'Metropolitana', lat: -33.445, lng: -70.535, uf: 65, g: 0.04 },
  { nombre: 'Macul', region: 'Metropolitana', lat: -33.487, lng: -70.599, uf: 45, g: 0.042 },
  { nombre: 'Peñalolén', region: 'Metropolitana', lat: -33.485, lng: -70.54, uf: 42, g: 0.04 },
  { nombre: 'La Florida', region: 'Metropolitana', lat: -33.5227, lng: -70.5986, uf: 40, g: 0.04 },
  { nombre: 'Puente Alto', region: 'Metropolitana', lat: -33.6117, lng: -70.5758, uf: 28, g: 0.035 },
  { nombre: 'San Miguel', region: 'Metropolitana', lat: -33.497, lng: -70.651, uf: 48, g: 0.048 },
  { nombre: 'Estación Central', region: 'Metropolitana', lat: -33.46, lng: -70.7, uf: 40, g: 0.036 },
  { nombre: 'Independencia', region: 'Metropolitana', lat: -33.416, lng: -70.665, uf: 40, g: 0.04 },
  { nombre: 'Recoleta', region: 'Metropolitana', lat: -33.406, lng: -70.64, uf: 36, g: 0.035 },
  { nombre: 'Maipú', region: 'Metropolitana', lat: -33.511, lng: -70.758, uf: 32, g: 0.036 },
  { nombre: 'Pudahuel', region: 'Metropolitana', lat: -33.44, lng: -70.76, uf: 30, g: 0.034 },
  { nombre: 'Quilicura', region: 'Metropolitana', lat: -33.36, lng: -70.73, uf: 30, g: 0.036 },
  { nombre: 'Colina', region: 'Metropolitana', lat: -33.2, lng: -70.675, uf: 38, g: 0.045 },
  { nombre: 'San Bernardo', region: 'Metropolitana', lat: -33.592, lng: -70.7, uf: 26, g: 0.032 },
  { nombre: 'Buin', region: 'Metropolitana', lat: -33.732, lng: -70.742, uf: 24, g: 0.035 },
  { nombre: 'Talagante', region: 'Metropolitana', lat: -33.665, lng: -70.93, uf: 24, g: 0.036 },
  { nombre: 'Melipilla', region: 'Metropolitana', lat: -33.689, lng: -71.215, uf: 20, g: 0.032 },
  { nombre: 'Rancagua', region: "O'Higgins", lat: -34.1708, lng: -70.7444, uf: 28, g: 0.035 },
  { nombre: 'San Fernando', region: "O'Higgins", lat: -34.585, lng: -70.989, uf: 20, g: 0.03 },
  { nombre: 'Curicó', region: 'Maule', lat: -34.9828, lng: -71.2394, uf: 22, g: 0.032 },
  { nombre: 'Talca', region: 'Maule', lat: -35.4264, lng: -71.6554, uf: 24, g: 0.034 },
  { nombre: 'Linares', region: 'Maule', lat: -35.846, lng: -71.593, uf: 18, g: 0.03 },
  { nombre: 'Curepto', region: 'Maule', lat: -35.09, lng: -72.02, uf: 10, g: 0.025 },
  { nombre: 'Chillán', region: 'Ñuble', lat: -36.6066, lng: -72.1034, uf: 24, g: 0.036 },
  { nombre: 'Concepción', region: 'Biobío', lat: -36.827, lng: -73.0503, uf: 34, g: 0.035 },
  { nombre: 'Talcahuano', region: 'Biobío', lat: -36.7249, lng: -73.1168, uf: 24, g: 0.03 },
  { nombre: 'San Pedro de la Paz', region: 'Biobío', lat: -36.84, lng: -73.11, uf: 34, g: 0.04 },
  { nombre: 'Los Ángeles', region: 'Biobío', lat: -37.4697, lng: -72.3537, uf: 22, g: 0.032 },
  { nombre: 'Temuco', region: 'La Araucanía', lat: -38.7359, lng: -72.5904, uf: 30, g: 0.038 },
  { nombre: 'Villarrica', region: 'La Araucanía', lat: -39.28, lng: -72.227, uf: 30, g: 0.045 },
  { nombre: 'Pucón', region: 'La Araucanía', lat: -39.282, lng: -71.954, uf: 45, g: 0.05 },
  { nombre: 'Valdivia', region: 'Los Ríos', lat: -39.8142, lng: -73.2459, uf: 28, g: 0.036 },
  { nombre: 'Osorno', region: 'Los Lagos', lat: -40.5739, lng: -73.1335, uf: 24, g: 0.032 },
  { nombre: 'Puerto Varas', region: 'Los Lagos', lat: -41.317, lng: -72.985, uf: 42, g: 0.048 },
  { nombre: 'Puerto Montt', region: 'Los Lagos', lat: -41.4693, lng: -72.9424, uf: 30, g: 0.038 },
  { nombre: 'Castro', region: 'Los Lagos', lat: -42.48, lng: -73.762, uf: 26, g: 0.04 },
  { nombre: 'Coyhaique', region: 'Aysén', lat: -45.5712, lng: -72.0685, uf: 24, g: 0.03 },
  { nombre: 'Punta Arenas', region: 'Magallanes', lat: -53.1638, lng: -70.9171, uf: 26, g: 0.028 },
]

export const REGIONES = [...new Set(COMUNAS.map((c) => c.region))]

export const DESTINOS = ['Habitacional', 'Comercio', 'Oficina', 'Industria', 'Agrícola', 'Sitio eriazo']

// Factor de valor por destino respecto al habitacional.
export const FACTOR_DESTINO = {
  Habitacional: 1,
  Comercio: 1.15,
  Oficina: 1.1,
  Industria: 0.55,
  Agrícola: 0.08,
  'Sitio eriazo': 0.35,
}

// Rentabilidad bruta anual de referencia (arriendo / valor) por destino.
export const CAP_RATE = {
  Habitacional: 0.048,
  Comercio: 0.072,
  Oficina: 0.065,
  Industria: 0.08,
  Agrícola: 0.04,
  'Sitio eriazo': 0.03,
}

export const AÑO_INICIO = 2015
export const AÑO_ACTUAL = 2026
export const UF_CLP = 39750 // UF referencial para conversión a pesos
