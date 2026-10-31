<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>Panel de registro</h1>
        <p class="muted">{{ state.contrato.institucion }} · Vigencia {{ fecha(state.contrato.inicio) }} – {{ fecha(state.contrato.termino) }}</p>
      </div>
    </div>

    <div class="tabs">
      <button :class="{ active: tab === 'actividad' }" @click="tab = 'actividad'">Actividad de consultas</button>
      <button :class="{ active: tab === 'usuarios' }" @click="tab = 'usuarios'">Usuarios ({{ generalesActivos.length }}/{{ state.contrato.maxUsuarios }})</button>
      <button :class="{ active: tab === 'contrato' }" @click="tab = 'contrato'">Contrato</button>
    </div>

    <!-- ACTIVIDAD -->
    <template v-if="tab === 'actividad'">
      <div class="card filtros">
        <label class="field">Usuario
          <select v-model="fu"><option value="">Todos los Usuarios Generales</option><option v-for="u in generales" :key="u.id" :value="u.id">{{ u.nombre }} ({{ u.usuario }})</option></select>
        </label>
        <label class="field">Período
          <select v-model.number="dias"><option :value="7">Últimos 7 días</option><option :value="30">Últimos 30 días</option><option :value="90">Últimos 90 días</option><option :value="0">Todo</option></select>
        </label>
        <label class="field">Tipo de consulta
          <select v-model="fa"><option value="">Todas</option><option v-for="(l, k) in ACCIONES" :key="k" :value="k">{{ l }}</option></select>
        </label>
        <button class="btn" @click="exportarLogs">⬇ Exportar Excel</button>
      </div>

      <div class="kpis">
        <div class="kpi"><div class="v">{{ num(consultas.length) }}</div><div class="l">Consultas en el período</div></div>
        <div class="kpi"><div class="v">{{ num(direccionesUnicas) }}</div><div class="l">Direcciones consultadas (únicas)</div></div>
        <div class="kpi"><div class="v">{{ usuariosConActividad }}</div><div class="l">Usuarios con actividad</div></div>
        <div class="kpi"><div class="v">{{ num(tasacionesUsadas) }} / {{ num(bolsaTotal) }}</div><div class="l">Tasaciones usadas / bolsa total</div></div>
      </div>

      <div class="card">
        <h3>Consultas por día</h3>
        <svg :viewBox="`0 0 ${porDia.length * 20} 110`" preserveAspectRatio="none" class="bars">
          <g v-for="(d, i) in porDia" :key="d.dia">
            <rect :x="i * 20 + 3" :y="100 - (d.n / maxDia) * 90" width="14" :height="(d.n / maxDia) * 90" rx="2" fill="#1f6fb2"><title>{{ fecha(d.dia) }}: {{ d.n }} consultas</title></rect>
            <text v-if="i % Math.ceil(porDia.length / 10) === 0" :x="i * 20 + 10" y="109" text-anchor="middle" class="ax">{{ d.dia.slice(8, 10) }}/{{ d.dia.slice(5, 7) }}</text>
          </g>
        </svg>
      </div>

      <div class="grid2">
        <div>
          <h3>Consultas por Usuario General</h3>
          <div class="table-wrap">
            <table class="tbl">
              <thead><tr><th>Usuario</th><th class="num">Consultas</th><th class="num">Fichas</th><th class="num">Búsquedas</th><th class="num">Tasaciones</th><th>Último acceso</th></tr></thead>
              <tbody>
                <tr v-for="u in resumenUsuarios" :key="u.id" :class="{ inactivo: !u.activo }">
                  <td>{{ u.nombre }} <small>({{ u.usuario }})</small></td>
                  <td class="num"><b>{{ u.total }}</b></td><td class="num">{{ u.fichas }}</td><td class="num">{{ u.busquedas }}</td>
                  <td class="num">{{ u.tasacionesUsadas }}/{{ state.contrato.bolsaTasaciones }}</td>
                  <td>{{ fechaHora(u.ultimo) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h3>Comunas más consultadas</h3>
          <div class="table-wrap">
            <table class="tbl">
              <tbody>
                <tr v-for="c in topComunas" :key="c.comuna">
                  <td>{{ c.comuna }}</td>
                  <td style="width:55%"><div class="hbar"><span :style="{ width: `${(c.n / topComunas[0].n) * 100}%` }"></span></div></td>
                  <td class="num">{{ c.n }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <h3>Registro de direcciones consultadas</h3>
      <div class="table-wrap log">
        <table class="tbl">
          <thead><tr><th>Fecha</th><th>Usuario</th><th>Tipo</th><th>Comuna</th><th>Dirección</th><th>Detalle</th></tr></thead>
          <tbody>
            <tr v-for="l in consultas.slice().reverse().slice(0, 400)" :key="l.id">
              <td>{{ fechaHora(l.ts) }}</td><td>{{ l.usuario }}</td><td>{{ ACCIONES[l.accion] || l.accion }}</td>
              <td>{{ l.comuna || '—' }}</td><td>{{ l.direccion || '—' }}</td><td class="muted">{{ l.detalle }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- USUARIOS -->
    <template v-if="tab === 'usuarios'">
      <div class="alert info">
        Canal de altas y bajas: las solicitudes se ejecutan en un plazo máximo de 1 día hábil (en esta plataforma se aplican de inmediato).
        Cupo contratado: <b>{{ state.contrato.maxUsuarios }}</b> Usuarios Generales · disponibles: <b>{{ state.contrato.maxUsuarios - generalesActivos.length }}</b>.
      </div>
      <form class="card alta" @submit.prevent="alta">
        <h3 class="span-all">Alta de Usuario General</h3>
        <label class="field">Nombre completo<input v-model="nu.nombre" required /></label>
        <label class="field">Usuario<input v-model="nu.usuario" required /></label>
        <label class="field">Correo<input v-model="nu.email" type="email" /></label>
        <label class="field">Clave inicial<input v-model="nu.clave" type="text" required minlength="8" /></label>
        <div class="span-all acc">
          <button class="btn" :disabled="generalesActivos.length >= state.contrato.maxUsuarios">Crear usuario</button>
          <span v-if="msg" class="alert" :class="msgOk ? 'ok' : 'err'">{{ msg }}</span>
        </div>
      </form>

      <div class="table-wrap">
        <table class="tbl">
          <thead><tr><th>Nombre</th><th>Usuario</th><th>Correo</th><th>Rol</th><th>Estado</th><th class="num">Tasaciones</th><th>Acciones</th></tr></thead>
          <tbody>
            <tr v-for="u in state.usuarios" :key="u.id" :class="{ inactivo: !u.activo }">
              <td>{{ u.nombre }}</td><td>{{ u.usuario }}</td><td>{{ u.email }}</td>
              <td>{{ u.rol === 'admin' ? 'Administrador' : 'General' }}</td>
              <td><span class="tag" :class="u.activo ? 'on' : 'off'">{{ u.activo ? 'Activo' : 'De baja' }}</span></td>
              <td class="num">{{ u.rol === 'admin' ? '—' : `${u.tasacionesUsadas}/${state.contrato.bolsaTasaciones}` }}</td>
              <td class="acc-cell">
                <template v-if="u.rol === 'general'">
                  <template v-if="confirmarBaja === u.id">
                    <button class="btn sm danger" @click="estado(u, false)">Confirmar baja</button>
                    <button class="btn sm light" @click="confirmarBaja = null">Cancelar</button>
                  </template>
                  <button v-else-if="u.activo" class="btn sm light" @click="confirmarBaja = u.id">Dar de baja</button>
                  <button v-else class="btn sm ok" @click="estado(u, true)">Reactivar</button>
                </template>
                <template v-if="claveDe === u.id">
                  <input v-model="nuevaClave" class="clave" placeholder="Nueva clave" />
                  <button class="btn sm" @click="cambiarClave(u)">Guardar</button>
                </template>
                <button v-else class="btn sm light" @click="claveDe = u.id; nuevaClave = ''">Cambiar clave</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Historial de altas y bajas</h3>
      <div class="table-wrap">
        <table class="tbl">
          <thead><tr><th>Fecha</th><th>Movimiento</th><th>Usuario</th><th>Nombre</th><th>Ejecutado por</th></tr></thead>
          <tbody>
            <tr v-for="(m, i) in state.movimientos" :key="i"><td>{{ fechaHora(m.ts) }}</td><td>{{ m.tipo }}</td><td>{{ m.usuario }}</td><td>{{ m.nombre }}</td><td>{{ m.por }}</td></tr>
            <tr v-if="!state.movimientos.length"><td colspan="5" class="muted">Sin movimientos.</td></tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- CONTRATO -->
    <template v-if="tab === 'contrato'">
      <div class="card contrato">
        <p class="muted span-all">Parámetros del plan anual contratado (configurables por el proveedor según la oferta adjudicada).</p>
        <label class="field span-all">Institución<input v-model="state.contrato.institucion" /></label>
        <label class="field">Máximo Usuarios Generales<input v-model.number="state.contrato.maxUsuarios" type="number" min="1" /></label>
        <label class="field">Bolsa de tasaciones por usuario<input v-model.number="state.contrato.bolsaTasaciones" type="number" min="0" /></label>
        <label class="field">Inicio de vigencia<input v-model="state.contrato.inicio" type="date" /></label>
        <label class="field">Término de vigencia<input v-model="state.contrato.termino" type="date" /></label>
        <div class="span-all kpis">
          <div class="kpi"><div class="v">{{ state.usuarios.filter((u) => u.rol === 'admin').length }}</div><div class="l">Usuarios Administradores</div></div>
          <div class="kpi"><div class="v">{{ generalesActivos.length }}</div><div class="l">Usuarios Generales activos</div></div>
          <div class="kpi"><div class="v">{{ num(bolsaTotal) }}</div><div class="l">Tasaciones totales contratadas</div></div>
          <div class="kpi"><div class="v">{{ diasRestantes }}</div><div class="l">Días de servicio restantes</div></div>
        </div>
        <div class="span-all acc">
          <template v-if="confirmarReinicio">
            <span class="alert err">Se borrarán usuarios creados, bitácora y tasaciones.</span>
            <button class="btn danger" @click="reiniciar">Confirmar reinicio</button>
            <button class="btn light" @click="confirmarReinicio = false">Cancelar</button>
          </template>
          <button v-else class="btn light" @click="confirmarReinicio = true">Reiniciar datos de demostración</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { state, generalesActivos, crearUsuario, cambiarEstado, resetClave, reiniciarDemo } from '../store.js'
import { num, fecha, fechaHora } from '../utils/format.js'
import { exportarExcel } from '../utils/exportar.js'

const ACCIONES = {
  ficha: 'Ficha de propiedad', busqueda: 'Búsqueda', descarga: 'Descarga ficha', exportar: 'Exportación Excel',
  tasacion: 'Tasación online', plusvalia: 'Plusvalía',
}

const router = useRouter()
const tab = ref('actividad')
const fu = ref('')
const dias = ref(30)
const fa = ref('')

const generales = computed(() => state.usuarios.filter((u) => u.rol === 'general'))
const idsGenerales = computed(() => new Set(generales.value.map((u) => u.id)))

const consultas = computed(() => {
  const desde = dias.value ? new Date(Date.now() - dias.value * 864e5).toISOString() : ''
  return state.logs.filter((l) =>
    l.accion !== 'login' && idsGenerales.value.has(l.userId) &&
    (!fu.value || l.userId === fu.value) && (!fa.value || l.accion === fa.value) && l.ts >= desde,
  )
})

const direccionesUnicas = computed(() => new Set(consultas.value.filter((l) => l.direccion).map((l) => `${l.comuna}|${l.direccion}`)).size)
const usuariosConActividad = computed(() => new Set(consultas.value.map((l) => l.userId)).size)
const tasacionesUsadas = computed(() => generales.value.reduce((s, u) => s + u.tasacionesUsadas, 0))
const bolsaTotal = computed(() => state.contrato.maxUsuarios * state.contrato.bolsaTasaciones)

const porDia = computed(() => {
  const n = dias.value || 90
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    const dia = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10)
    out.push({ dia, n: 0 })
  }
  const idx = Object.fromEntries(out.map((d, i) => [d.dia, i]))
  consultas.value.forEach((l) => { const i = idx[l.ts.slice(0, 10)]; if (i != null) out[i].n++ })
  return out
})
const maxDia = computed(() => Math.max(1, ...porDia.value.map((d) => d.n)))

const resumenUsuarios = computed(() =>
  generales.value
    .filter((u) => !fu.value || u.id === fu.value)
    .map((u) => {
      const ls = consultas.value.filter((l) => l.userId === u.id)
      const accesos = state.logs.filter((l) => l.userId === u.id)
      return {
        ...u, total: ls.length,
        fichas: ls.filter((l) => l.accion === 'ficha').length,
        busquedas: ls.filter((l) => l.accion === 'busqueda').length,
        ultimo: accesos.at(-1)?.ts,
      }
    })
    .sort((a, b) => b.total - a.total),
)

const topComunas = computed(() => {
  const cuenta = {}
  consultas.value.forEach((l) => l.comuna && l.comuna.split(', ').forEach((c) => (cuenta[c] = (cuenta[c] || 0) + 1)))
  return Object.entries(cuenta).map(([comuna, n]) => ({ comuna, n })).sort((a, b) => b.n - a.n).slice(0, 10)
})

const diasRestantes = computed(() => Math.max(0, Math.ceil((new Date(state.contrato.termino) - Date.now()) / 864e5)))

function exportarLogs() {
  exportarExcel(
    consultas.value.map((l) => ({
      Fecha: fechaHora(l.ts), Usuario: l.usuario, Nombre: state.usuarios.find((u) => u.id === l.userId)?.nombre,
      Tipo: ACCIONES[l.accion] || l.accion, Comuna: l.comuna, Dirección: l.direccion, Detalle: l.detalle,
    })),
    `registro_consultas_${new Date().toISOString().slice(0, 10)}`,
    'Consultas',
  )
}

// ---- Usuarios ----
const nu = reactive({ nombre: '', usuario: '', email: '', clave: '' })
const msg = ref('')
const msgOk = ref(false)
const confirmarBaja = ref(null)
const claveDe = ref(null)
const nuevaClave = ref('')
const confirmarReinicio = ref(false)

function aviso(texto, ok) {
  msg.value = texto
  msgOk.value = ok
}

async function alta() {
  try {
    await crearUsuario({ ...nu })
    aviso(`Usuario ${nu.usuario} creado`, true)
    Object.assign(nu, { nombre: '', usuario: '', email: '', clave: '' })
  } catch (e) {
    aviso(e.message, false)
  }
}

function estado(u, activo) {
  try {
    cambiarEstado(u, activo)
    confirmarBaja.value = null
  } catch (e) {
    tab.value = 'usuarios'
    aviso(e.message, false)
  }
}

async function cambiarClave(u) {
  try {
    await resetClave(u, nuevaClave.value)
    claveDe.value = null
    aviso(`Clave de ${u.usuario} actualizada`, true)
  } catch (e) {
    aviso(e.message, false)
  }
}

async function reiniciar() {
  await reiniciarDemo()
  router.push('/login')
}
</script>

<style scoped>
.filtros { display: flex; gap: 0.8rem; align-items: flex-end; flex-wrap: wrap; }
.filtros .field { flex: 1; min-width: 180px; }
.bars { width: 100%; height: 140px; display: block; margin-top: 0.5rem; }
.ax { font-size: 7px; fill: var(--muted); }
.grid2 { display: grid; grid-template-columns: 1.6fr 1fr; gap: 1rem; }
.grid2 h3, .page > h3 { margin-bottom: 0.5rem; }
.grid2 .table-wrap { max-height: 360px; }
.hbar { height: 8px; background: var(--surface-2); border-radius: 4px; overflow: hidden; }
.hbar span { display: block; height: 100%; background: var(--primary-2); }
.log { max-height: 420px; }
tr.inactivo td { color: var(--muted); }
.alta, .contrato { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.8rem; }
.span-all { grid-column: 1 / -1; }
.acc { display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap; }
.acc-cell { display: flex; gap: 0.35rem; align-items: center; }
.clave { width: 130px; padding: 0.25rem 0.4rem; }
@media (max-width: 980px) {
  .grid2, .alta, .contrato { grid-template-columns: 1fr; }
}
</style>
