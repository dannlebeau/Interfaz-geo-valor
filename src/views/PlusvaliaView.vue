<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1>Plusvalía y evolución de precios</h1>
        <p class="muted">Mediana anual de UF/m² de transacciones inscritas en CBR, {{ AÑO_INICIO }}–{{ AÑO_ACTUAL }}.</p>
      </div>
      <button class="btn" @click="exportar">⬇ Exportar Excel</button>
    </div>

    <div class="card controles">
      <label class="field">Tipología
        <select v-model="tipologia">
          <option v-for="t in TIPOLOGIAS" :key="t">{{ t }}</option>
        </select>
      </label>
      <div v-for="(c, i) in comunas" :key="i" class="field-c">
        <label class="field">Comuna {{ i + 1 }}
          <select v-model="comunas[i]">
            <option value="">—</option>
            <option v-for="x in COMUNAS" :key="x.nombre">{{ x.nombre }}</option>
          </select>
        </label>
        <i :style="{ background: COLORES[i] }"></i>
      </div>
    </div>

    <div class="card">
      <LineChart :series="series" :alto="280" leyenda />
    </div>

    <div class="table-wrap">
      <table class="tbl">
        <thead>
          <tr>
            <th>Comuna</th>
            <th v-for="a in años" :key="a" class="num">{{ a }}</th>
            <th class="num">Var. total</th>
            <th class="num">Var. anual</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in series" :key="s.nombre">
            <td><i class="sw" :style="{ background: s.color }"></i>{{ s.nombre }}</td>
            <td v-for="p in s.data" :key="p.año" class="num">{{ p.valor == null ? '—' : num(p.valor, 1) }}</td>
            <td class="num"><b>{{ pct(s.var.total) }}</b></td>
            <td class="num">{{ pct(s.var.anual) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import LineChart from '../components/LineChart.vue'
import { COMUNAS, AÑO_INICIO, AÑO_ACTUAL } from '../data/comunas.js'
import { seriePlusvalia, variacion } from '../utils/analisis.js'
import { num, pct } from '../utils/format.js'
import { exportarExcel } from '../utils/exportar.js'
import { registrar } from '../store.js'

const TIPOLOGIAS = ['Departamento', 'Casa', 'Local comercial', 'Oficina', 'Galpón', 'Sitio', 'Parcela']
const COLORES = ['#1f6fb2', '#e07b16', '#2e8b57', '#8e44ad']

const tipologia = ref('Departamento')
const comunas = reactive(['Providencia', 'Ñuñoa', 'Santiago', 'La Florida'])

const series = computed(() =>
  comunas
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => c)
    .map(({ c, i }) => {
      const data = seriePlusvalia(c, tipologia.value)
      return { nombre: c, color: COLORES[i], data, var: variacion(data) }
    }),
)
const años = computed(() => series.value[0]?.data.map((d) => d.año) || [])

watch([tipologia, comunas], () => registrar('plusvalia', { comuna: comunas.filter(Boolean).join(', '), detalle: `Plusvalía ${tipologia.value}` }))

function exportar() {
  const filas = series.value.flatMap((s) => s.data.map((d) => ({ Comuna: s.nombre, Tipología: tipologia.value, Año: d.año, 'Mediana UF/m²': d.valor, 'N° transacciones': d.n })))
  exportarExcel(filas, `plusvalia_${tipologia.value}`, 'Plusvalía')
}
</script>

<style scoped>
.controles { display: flex; gap: 0.8rem; flex-wrap: wrap; align-items: flex-end; }
.controles > * { flex: 1; min-width: 160px; }
.field-c { display: flex; align-items: flex-end; gap: 0.35rem; }
.field-c .field { flex: 1; }
.field-c i { width: 12px; height: 34px; border-radius: 3px; }
.sw { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 0.4rem; }
</style>
