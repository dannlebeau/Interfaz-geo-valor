// Estado de la plataforma (usuarios, sesión, bitácora de consultas y tasaciones).
// Prototipo: se persiste en localStorage. En producción se reemplaza por un backend
// (p. ej. Supabase/PostgreSQL) con autenticación y contraseñas gestionadas en servidor.
import { reactive, computed, watch } from 'vue'
import { REGISTROS } from './data/generate.js'

const KEY = 'geovalor-state-v1'

export const CONTRATO_DEFAULT = {
  institucion: 'División de Bienes Nacionales – Unidad de Fiscalización y Tasación',
  maxUsuarios: 30,
  bolsaTasaciones: 25,
  maxAdmins: 4,
  inicio: '2026-11-02',
  termino: '2027-11-01',
}

export async function hash(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function semilla() {
  const passAdmin = await hash('Admin2026!')
  const passUser = await hash('Demo2026!')
  const ahora = new Date().toISOString()
  const usuarios = []
  for (let i = 1; i <= 4; i++) {
    usuarios.push({
      id: `a${i}`, usuario: `admin${i}`, nombre: `Administrador ${i}`, email: `admin${i}@institucion.cl`,
      rol: 'admin', pass: passAdmin, activo: true, tasacionesUsadas: 0, creado: ahora,
    })
  }
  const nombres = ['María González', 'Juan Pérez', 'Camila Rojas', 'Diego Muñoz', 'Valentina Soto', 'Felipe Díaz', 'Constanza Silva', 'Matías Contreras']
  nombres.forEach((n, i) => {
    usuarios.push({
      id: `u${i + 1}`, usuario: `usuario${i + 1}`, nombre: n, email: `usuario${i + 1}@institucion.cl`,
      rol: 'general', pass: passUser, activo: true, tasacionesUsadas: 0, creado: ahora,
    })
  })

  // Bitácora de ejemplo para que el panel de administración muestre actividad.
  const logs = []
  const generales = usuarios.filter((u) => u.rol === 'general')
  const now = Date.now()
  for (let i = 0; i < 220; i++) {
    const u = generales[Math.floor(Math.random() * generales.length)]
    const r = REGISTROS[Math.floor(Math.random() * REGISTROS.length)]
    const accion = Math.random() < 0.7 ? 'ficha' : 'busqueda'
    logs.push({
      id: i + 1, userId: u.id, usuario: u.usuario,
      ts: new Date(now - Math.random() * 30 * 864e5).toISOString(),
      accion, comuna: r.comuna, direccion: accion === 'ficha' ? r.direccion : null,
      detalle: accion === 'ficha' ? `Rol ${r.rol}` : `Filtro comuna ${r.comuna}`,
    })
  }
  logs.sort((a, b) => a.ts.localeCompare(b.ts))
  return { contrato: { ...CONTRATO_DEFAULT }, usuarios, logs, tasaciones: [], movimientos: [], sesion: null }
}

function cargar() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const state = reactive({ listo: false, contrato: {}, usuarios: [], logs: [], tasaciones: [], movimientos: [], sesion: null })

export async function iniciarStore() {
  const data = cargar() || (await semilla())
  Object.assign(state, data, { listo: true })
  watch(
    () => [state.contrato, state.usuarios, state.logs, state.tasaciones, state.movimientos, state.sesion],
    () => {
      const { listo, ...rest } = state
      try { localStorage.setItem(KEY, JSON.stringify(rest)) } catch { /* almacenamiento lleno o bloqueado */ }
    },
    { deep: true },
  )
}

export async function reiniciarDemo() {
  localStorage.removeItem(KEY)
  Object.assign(state, await semilla())
}

export const usuarioActual = computed(() => state.usuarios.find((u) => u.id === state.sesion?.userId) || null)
export const esAdmin = computed(() => usuarioActual.value?.rol === 'admin')
export const generalesActivos = computed(() => state.usuarios.filter((u) => u.rol === 'general' && u.activo))
export const saldoTasaciones = computed(() => {
  const u = usuarioActual.value
  if (!u || u.rol !== 'general') return 0
  return Math.max(0, state.contrato.bolsaTasaciones - u.tasacionesUsadas)
})

export async function login(usuario, clave) {
  const u = state.usuarios.find((x) => x.usuario.toLowerCase() === usuario.trim().toLowerCase())
  if (!u || u.pass !== (await hash(clave))) throw new Error('Usuario o clave incorrectos')
  if (!u.activo) throw new Error('Usuario dado de baja. Contacte a un administrador.')
  state.sesion = { userId: u.id, desde: new Date().toISOString() }
  registrar('login', { detalle: 'Inicio de sesión' })
  return u
}

export function logout() {
  state.sesion = null
}

export function registrar(accion, { comuna = null, direccion = null, detalle = '' } = {}) {
  const u = usuarioActual.value
  if (!u) return
  state.logs.push({
    id: (state.logs.at(-1)?.id || 0) + 1, userId: u.id, usuario: u.usuario,
    ts: new Date().toISOString(), accion, comuna, direccion, detalle,
  })
}

// ---- Gestión de usuarios (canal de alta/baja, ejecutado dentro de 1 día hábil) ----

function movimiento(tipo, u, detalle = '') {
  state.movimientos.unshift({
    ts: new Date().toISOString(), tipo, usuario: u.usuario, nombre: u.nombre,
    por: usuarioActual.value?.usuario, detalle,
  })
}

export async function crearUsuario({ usuario, nombre, email, clave }) {
  if (generalesActivos.value.length >= state.contrato.maxUsuarios)
    throw new Error(`Se alcanzó el máximo contratado de ${state.contrato.maxUsuarios} Usuarios Generales`)
  if (!usuario || !nombre || !clave) throw new Error('Usuario, nombre y clave son obligatorios')
  if (clave.length < 8) throw new Error('La clave debe tener al menos 8 caracteres')
  if (state.usuarios.some((u) => u.usuario.toLowerCase() === usuario.toLowerCase()))
    throw new Error('Ese nombre de usuario ya existe')
  const u = {
    id: `u${Date.now()}`, usuario, nombre, email, rol: 'general', pass: await hash(clave),
    activo: true, tasacionesUsadas: 0, creado: new Date().toISOString(),
  }
  state.usuarios.push(u)
  movimiento('Alta', u)
}

export function cambiarEstado(u, activo) {
  if (activo && generalesActivos.value.length >= state.contrato.maxUsuarios)
    throw new Error(`Se alcanzó el máximo contratado de ${state.contrato.maxUsuarios} Usuarios Generales`)
  u.activo = activo
  movimiento(activo ? 'Reactivación' : 'Baja', u)
}

export async function resetClave(u, clave) {
  if (clave.length < 8) throw new Error('La clave debe tener al menos 8 caracteres')
  u.pass = await hash(clave)
  movimiento('Cambio de clave', u)
}

// ---- Tasaciones ----

export function guardarTasacion(entrada, resultado) {
  const u = usuarioActual.value
  if (u.rol === 'general') {
    if (saldoTasaciones.value <= 0) throw new Error('No quedan tasaciones disponibles en su bolsa')
    u.tasacionesUsadas++
  }
  const t = { id: Date.now(), userId: u.id, usuario: u.usuario, fecha: new Date().toISOString(), entrada, resultado }
  state.tasaciones.unshift(t)
  registrar('tasacion', { comuna: entrada.comuna, direccion: entrada.direccion, detalle: `Tasación online ${resultado.valorUF} UF` })
  return t
}
