<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>Cobertura vigente</h1>
        <p class="muted">Comunas con registros disponibles para consulta y tasación online.</p>
      </div>
      <button class="btn" @click="exportar">⬇ Exportar listado Excel</button>
    </div>

    <div class="kpis">
      <div class="kpi"><div class="v">{{ filas.length }}</div><div class="l">Comunas con cobertura</div></div>
      <div class="kpi"><div class="v">{{ REGIONES.length }}</div><div class="l">Regiones</div></div>
      <div class="kpi"><div class="v">{{ num(totalCbr) }}</div><div class="l">Transacciones CBR</div></div>
      <div class="kpi"><div class="v">{{ num(totalOfertas) }}</div><div class="l">Ofertas de mercado</div></div>
    </div>

    <div class="grid">
      <div class="card mapa"><MapaRegistros :registros="[]" :extra="puntos" /></div>
      <div class="lista">
        <input v-model="q" placeholder="Filtrar comuna o región…" />
        <div class="table-wrap">
          <table class="tbl">
            <thead><tr><th>Región</th><th>Comuna</th><th class="num">CBR</th><th class="num">Ofertas</th><th>Período</th><th>Consulta</th><th>Tasación</th></tr></thead>
            <tbody>
              <tr v-for="f in visibles" :key="f.comuna">
                <td>{{ f.region }}</td><td><b>{{ f.comuna }}</b></td>
                <td class="num">{{ num(f.cbr) }}</td><td class="num">{{ num(f.ofertas) }}</td>
                <td>{{ f.desde }}–{{ f.hasta }}</td>
                <td><span class="tag on">Sí</span></td><td><span class="tag" :class="f.tasacion ? 'on' : 'off'">{{ f.tasacion ? 'Sí' : 'No' }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import MapaRegistros from '../components/MapaRegistros.vue'
import { COMUNAS, REGIONES } from '../data/comunas.js'
import { REGISTROS } from '../data/generate.js'
import { num } from '../utils/format.js'
import { exportarExcel } from '../utils/exportar.js'

const q = ref('')

const filas = COMUNAS.map((c) => {
  const regs = REGISTROS.filter((r) => r.comuna === c.nombre)
  const cbr = regs.filter((r) => r.tipo === 'CBR')
  const años = cbr.map((r) => r.año)
  return {
    region: c.region, comuna: c.nombre, lat: c.lat, lng: c.lng,
    cbr: cbr.length, ofertas: regs.length - cbr.length,
    desde: Math.min(...años), hasta: Math.max(...años),
    tasacion: cbr.length >= 30,
  }
})
const totalCbr = filas.reduce((s, f) => s + f.cbr, 0)
const totalOfertas = filas.reduce((s, f) => s + f.ofertas, 0)

const visibles = computed(() => {
  const t = q.value.toLowerCase()
  return filas.filter((f) => !t || f.comuna.toLowerCase().includes(t) || f.region.toLowerCase().includes(t))
})

const puntos = filas.map((f) => ({ lat: f.lat, lng: f.lng, color: '#1f6fb2', radio: 6, label: `<b>${f.comuna}</b><br>${num(f.cbr)} CBR · ${num(f.ofertas)} ofertas` }))

function exportar() {
  exportarExcel(
    filas.map((f) => ({
      Región: f.region, Comuna: f.comuna, 'Transacciones CBR': f.cbr, 'Ofertas de mercado': f.ofertas,
      'Año desde': f.desde, 'Año hasta': f.hasta, 'Servicio de consulta': 'Sí', 'Tasación online': f.tasacion ? 'Sí' : 'No',
    })),
    'cobertura_comunas',
    'Cobertura',
  )
}
</script>

<style scoped>
.grid { display: grid; grid-template-columns: 1fr 1.3fr; gap: 1rem; }
.mapa { padding: 0; overflow: hidden; height: 560px; }
.lista { display: flex; flex-direction: column; gap: 0.5rem; height: 560px; }
.lista .table-wrap { flex: 1; }
@media (max-width: 980px) {
  .grid { grid-template-columns: 1fr; }
  .mapa, .lista { height: 420px; }
}
</style>
