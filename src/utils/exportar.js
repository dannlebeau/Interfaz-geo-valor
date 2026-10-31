import * as XLSX from 'xlsx'
import { UF_CLP } from '../data/comunas.js'

export function exportarExcel(filas, nombreArchivo, hoja = 'Datos') {
  const ws = XLSX.utils.json_to_sheet(filas)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, hoja)
  XLSX.writeFile(wb, `${nombreArchivo}.xlsx`)
}

export const filaRegistro = (r) => ({
  ID: r.id,
  Tipo: r.tipo === 'CBR' ? 'Transacción CBR' : 'Oferta de mercado',
  Año: r.año,
  Fecha: r.fecha,
  Región: r.region,
  Comuna: r.comuna,
  Dirección: r.direccion,
  'Rol SII': r.rol,
  'Destino SII': r.destino,
  Tipología: r.tipologia,
  Zona: r.zona,
  'Sup. terreno (m²)': r.supTerreno,
  'Sup. construcción (m²)': r.supConstruccion,
  'Valor total (UF)': r.valorTotal,
  'Valor total ($)': r.valorTotal * UF_CLP,
  'Valor terreno (UF)': r.valorTerreno,
  'Valor construcción (UF)': r.valorConstruccion,
  'UF/m²': r.ufM2,
  'Zona PRC': r.normas.zonaPRC,
  'Usos permitidos': r.normas.usosPermitidos,
  'Coef. constructibilidad': r.normas.coefConstructibilidad,
  'Coef. ocupación suelo': r.normas.coefOcupacion,
  'Altura máxima': r.normas.alturaMaxima,
  Densidad: r.normas.densidad,
  'CBR / Portal': r.cbr || r.portal,
  'Fojas / Nº': r.fojas ? `${r.fojas} / ${r.numero}` : '',
  Latitud: r.lat,
  Longitud: r.lng,
})
