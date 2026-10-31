<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>Tasaciones online</h1>
        <p class="muted">Tasación sin visita con análisis de mercado, análisis de rentabilidad y análisis de ventas reales (CBR).</p>
      </div>
      <div v-if="!esAdmin" class="bolsa card">
        <div class="muted">Bolsa de tasaciones</div>
        <div><b>{{ saldoTasaciones }}</b> disponibles de {{ state.contrato.bolsaTasaciones }}</div>
        <div class="barra"><span :style="{ width: `${(saldoTasaciones / state.contrato.bolsaTasaciones) * 100}%` }"></span></div>
      </div>
    </div>

    <div class="tabs">
      <button :class="{ active: tab === 'nueva' }" @click="tab = 'nueva'">Nueva tasación</button>
      <button :class="{ active: tab === 'historial' }" @click="tab = 'historial'">{{ esAdmin ? 'Todas las tasaciones' : 'Mis tasaciones' }} ({{ historial.length }})</button>
    </div>

    <template v-if="tab === 'nueva'">
      <form class="card form" @submit.prevent="pedirConfirmacion">
        <label class="field">Comuna
          <select v-model="e.comuna" required><option v-for="c in COMUNAS" :key="c.nombre">{{ c.nombre }}</option></select>
        </label>
        <label class="field span2">Dirección<input v-model="e.direccion" required placeholder="Calle, número, depto." /></label>
        <label class="field">Rol SII (opcional)<input v-model="e.rol" placeholder="1234-56" /></label>
        <label class="field">Tipología
          <select v-model="e.tipologia"><option v-for="t in TIPOLOGIAS" :key="t">{{ t }}</option></select>
        </label>
        <label class="field">Sup. terreno (m²)<input v-model.number="e.supTerreno" type="number" min="1" required /></label>
        <label class="field">Sup. construcción (m²)<input v-model.number="e.supConstruccion" type="number" min="0" :required="requiereConst" /></label>
        <label class="field">Año construcción<input v-model.number="e.añoConstruccion" type="number" min="1850" :max="AÑO_ACTUAL" /></label>
        <label class="field">Estado de conservación
          <select v-model="e.estado"><option>Excelente</option><option>Bueno</option><option>Regular</option><option>Malo</option></select>
        </label>
        <div class="span-all acc">
          <div v-if="error" class="alert err">{{ error }}</div>
          <template v-if="confirmando">
            <div class="alert info">Esta tasación descontará 1 de sus {{ saldoTasaciones }} tasaciones disponibles. ¿Continuar?</div>
            <button type="button" class="btn ok" @click="ejecutar">Confirmar y tasar</button>
            <button type="button" class="btn light" @click="confirmando = false">Cancelar</button>
          </template>
          <button v-else class="btn" :disabled="!esAdmin && saldoTasaciones <= 0">
            {{ !esAdmin && saldoTasaciones <= 0 ? 'Sin tasaciones disponibles' : 'Generar tasación' }}
          </button>
        </div>
      </form>

      <template v-if="actual">
        <div class="resultado">
          <div class="card principal">
            <div class="muted">Valor comercial estimado · {{ actual.entrada.direccion }}, {{ actual.entrada.comuna }}</div>
            <div class="big">{{ uf(r.valorUF) }}</div>
            <div class="muted">{{ clp(r.valorUF) }} · rango {{ uf(r.rangoMin) }} – {{ uf(r.rangoMax) }} · {{ num(r.ufM2, 1) }} UF/m² {{ r.superficieBase }}</div>
            <button class="btn" @click="informeTasacion(actual)">⬇ Descargar informe (PDF)</button>
          </div>
          <div class="card">
            <h3>Análisis de mercado</h3>
            <p v-if="r.mercado.n">{{ r.mercado.n }} ofertas vigentes · mediana <b>{{ num(r.mercado.medianaM2, 1) }} UF/m²</b><br />
              Brecha oferta/venta <b>{{ pct(r.mercado.brecha) }}</b> · {{ r.mercado.diasPromedio }} días promedio publicadas</p>
            <p v-else class="muted">Sin ofertas comparables vigentes.</p>
          </div>
          <div class="card">
            <h3>Análisis de rentabilidad</h3>
            <p>Arriendo estimado <b>{{ num(r.rentabilidad.arriendoMensual, 1) }} UF/mes</b> ({{ clp(r.rentabilidad.arriendoMensual) }})<br />
              Rentab. bruta {{ pct(r.rentabilidad.capRate) }} · neta {{ pct(r.rentabilidad.rentaNeta) }} · recupero {{ r.rentabilidad.añosRecupero }} años</p>
          </div>
          <div class="card">
            <h3>Análisis de ventas reales</h3>
            <p>{{ r.ventas.n }} comparables CBR ({{ r.ventas.criterio }})<br />
              Mediana actualizada <b>{{ num(r.ventas.medianaM2, 1) }} UF/m²</b> · plusvalía {{ pct(r.ventas.plusvaliaAnual) }}/año<br />
              Ajustes: antigüedad {{ pct(r.ajustes.edad) }}, estado {{ pct(r.ajustes.estado) }}</p>
          </div>
        </div>
        <div class="comparables">
          <div class="mapa-c card"><MapaRegistros :registros="[]" :extra="puntosComparables" /></div>
          <div class="table-wrap">
            <table class="tbl">
              <thead><tr><th>#</th><th>Dirección</th><th>Fecha</th><th class="num">Terreno</th><th class="num">Constr.</th><th class="num">Valor UF</th><th class="num">UF/m² act.</th></tr></thead>
              <tbody>
                <tr v-for="(c, i) in r.ventas.comparables" :key="c.id">
                  <td>{{ i + 1 }}</td><td>{{ c.direccion }}</td><td>{{ fecha(c.fecha) }}</td>
                  <td class="num">{{ num(c.supTerreno) }}</td><td class="num">{{ num(c.supConstruccion) }}</td>
                  <td class="num">{{ num(c.valorTotal) }}</td><td class="num">{{ num(c.ufM2Actualizado, 1) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </template>

    <div v-else class="table-wrap">
      <table class="tbl">
        <thead><tr><th>Folio</th><th>Fecha</th><th v-if="esAdmin">Usuario</th><th>Comuna</th><th>Dirección</th><th>Tipología</th><th class="num">Valor UF</th><th></th></tr></thead>
        <tbody>
          <tr v-for="t in historial" :key="t.id">
            <td>{{ t.id }}</td><td>{{ fechaHora(t.fecha) }}</td><td v-if="esAdmin">{{ t.usuario }}</td>
            <td>{{ t.entrada.comuna }}</td><td>{{ t.entrada.direccion }}</td><td>{{ t.entrada.tipologia }}</td>
            <td class="num">{{ num(t.resultado.valorUF) }}</td>
            <td><button class="btn sm light" @click="verTasacion(t)">Ver</button> <button class="btn sm light" @click="informeTasacion(t)">PDF</button></td>
          </tr>
          <tr v-if="!historial.length"><td colspan="8" class="muted">Aún no hay tasaciones.</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import MapaRegistros from '../components/MapaRegistros.vue'
import { COMUNAS, AÑO_ACTUAL } from '../data/comunas.js'
import { REGISTROS } from '../data/generate.js'
import { tasar } from '../utils/analisis.js'
import { informeTasacion } from '../utils/informe.js'
import { num, uf, clp, pct, fecha, fechaHora } from '../utils/format.js'
import { state, esAdmin, saldoTasaciones, usuarioActual, guardarTasacion } from '../store.js'

const TIPOLOGIAS = ['Departamento', 'Casa', 'Local comercial', 'Oficina', 'Galpón', 'Sitio', 'Parcela']
const route = useRoute()

const e = reactive({
  comuna: 'Providencia', direccion: '', rol: '', tipologia: 'Departamento',
  supTerreno: 40, supConstruccion: 75, añoConstruccion: 2012, estado: 'Bueno',
})
const origen = REGISTROS.find((r) => r.id === +route.query.desde)
if (origen) {
  Object.assign(e, {
    comuna: origen.comuna, direccion: origen.direccion, rol: origen.rol, tipologia: origen.tipologia,
    supTerreno: origen.supTerreno, supConstruccion: origen.supConstruccion, añoConstruccion: origen.añoConstruccion,
  })
}

const tab = ref('nueva')
const error = ref('')
const confirmando = ref(false)
const actual = ref(null)
const r = computed(() => actual.value?.resultado)
const requiereConst = computed(() => !['Sitio', 'Parcela'].includes(e.tipologia))

const historial = computed(() => (esAdmin.value ? state.tasaciones : state.tasaciones.filter((t) => t.userId === usuarioActual.value.id)))

const puntosComparables = computed(() => {
  if (!r.value) return []
  return r.value.ventas.comparables.map((c, i) => ({
    lat: c.lat, lng: c.lng, color: '#1f6fb2', radio: 7, permanente: true,
    label: `${i + 1}`,
  }))
})

function pedirConfirmacion() {
  error.value = ''
  if (esAdmin.value) return ejecutar()
  confirmando.value = true
}

function ejecutar() {
  confirmando.value = false
  try {
    const resultado = tasar({ ...e })
    actual.value = guardarTasacion({ ...e }, resultado)
  } catch (err) {
    error.value = err.message
  }
}

function verTasacion(t) {
  actual.value = t
  tab.value = 'nueva'
}
</script>

<style scoped>
.bolsa { padding: 0.6rem 0.9rem; min-width: 220px; }
.barra { height: 6px; background: var(--surface-2); border-radius: 3px; margin-top: 0.35rem; overflow: hidden; }
.barra span { display: block; height: 100%; background: var(--primary-2); }
.form { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.8rem; }
.span2 { grid-column: span 2; }
.span-all { grid-column: 1 / -1; }
.acc { display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap; }
.resultado { display: grid; grid-template-columns: 1.3fr 1fr 1fr 1fr; gap: 0.8rem; }
.resultado p { margin: 0.4rem 0 0; font-size: 0.88rem; line-height: 1.5; }
.principal { display: flex; flex-direction: column; gap: 0.35rem; align-items: flex-start; }
.big { font-size: 2rem; font-weight: 700; color: var(--primary); }
.comparables { display: grid; grid-template-columns: 1fr 1.2fr; gap: 0.8rem; }
.mapa-c { padding: 0; overflow: hidden; height: 360px; }
.comparables .table-wrap { max-height: 360px; }
@media (max-width: 980px) {
  .form, .resultado, .comparables { grid-template-columns: 1fr; }
  .span2 { grid-column: auto; }
}
</style>
