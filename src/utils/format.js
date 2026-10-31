import { UF_CLP } from '../data/comunas.js'

const nf0 = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 })
const nf1 = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 })

export const num = (n, dec = 0) => (n == null || Number.isNaN(n) ? '—' : dec ? nf1.format(n) : nf0.format(n))
export const uf = (n) => (n == null ? '—' : `${nf0.format(n)} UF`)
export const clp = (nUf) => (nUf == null ? '—' : `$${nf0.format(nUf * UF_CLP)}`)
export const m2 = (n) => (n ? `${nf0.format(n)} m²` : '—')
export const pct = (n) => (n == null ? '—' : `${n > 0 ? '+' : ''}${nf1.format(n * 100)}%`)
export const fecha = (iso) => (iso ? new Date(iso.length === 10 ? iso + 'T12:00:00' : iso).toLocaleDateString('es-CL') : '—')
export const fechaHora = (iso) => (iso ? new Date(iso).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }) : '—')

export function mediana(arr) {
  if (!arr.length) return null
  const s = [...arr].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

export function percentil(arr, p) {
  if (!arr.length) return null
  const s = [...arr].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))))]
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
}
