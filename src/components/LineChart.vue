<template>
  <div class="chart">
    <svg :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="none" @mouseleave="hover = null">
      <g v-for="t in ticks" :key="t">
        <line :x1="P.l" :x2="W - P.r" :y1="y(t)" :y2="y(t)" class="grid" />
        <text :x="P.l - 6" :y="y(t) + 4" text-anchor="end" class="ax">{{ num(t) }}</text>
      </g>
      <text v-for="a in años" :key="a" :x="x(a)" :y="H - 6" text-anchor="middle" class="ax">{{ a }}</text>
      <g v-for="s in validas" :key="s.nombre">
        <path :d="path(s)" :stroke="s.color" fill="none" stroke-width="2.2" stroke-linejoin="round" />
        <circle v-for="p in s.data.filter((d) => d.valor != null)" :key="p.año" :cx="x(p.año)" :cy="y(p.valor)" r="3" :fill="s.color" />
      </g>
      <rect v-for="a in años" :key="'h' + a" :x="x(a) - paso / 2" :y="P.t" :width="paso" :height="H - P.t - P.b" fill="transparent" @mouseenter="hover = a" />
      <line v-if="hover" :x1="x(hover)" :x2="x(hover)" :y1="P.t" :y2="H - P.b" class="cursor" />
    </svg>
    <div v-if="hover" class="tip" :style="{ left: `${(x(hover) / W) * 100}%` }">
      <strong>{{ hover }}</strong>
      <div v-for="s in validas" :key="s.nombre">
        <i :style="{ background: s.color }"></i>{{ s.nombre }}: {{ valorEn(s, hover) }}
      </div>
    </div>
    <div v-if="validas.length > 1 || leyenda" class="legend">
      <span v-for="s in validas" :key="s.nombre"><i :style="{ background: s.color }"></i>{{ s.nombre }}</span>
    </div>
    <p v-if="!validas.length" class="muted empty">Sin datos suficientes para graficar.</p>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { num } from '../utils/format.js'

const props = defineProps({
  series: { type: Array, required: true }, // [{ nombre, color, data: [{ año, valor }] }]
  alto: { type: Number, default: 220 },
  unidad: { type: String, default: 'UF/m²' },
  leyenda: Boolean,
})

const W = 600
const H = computed(() => props.alto)
const P = { l: 44, r: 12, t: 12, b: 24 }
const hover = ref(null)

const validas = computed(() => props.series.filter((s) => s.data.some((d) => d.valor != null)))
const años = computed(() => [...new Set(props.series.flatMap((s) => s.data.map((d) => d.año)))].sort())
const valores = computed(() => validas.value.flatMap((s) => s.data.map((d) => d.valor).filter((v) => v != null)))
const min = computed(() => Math.min(...valores.value) * 0.9)
const max = computed(() => Math.max(...valores.value) * 1.06)
const ticks = computed(() => (valores.value.length ? [0, 0.25, 0.5, 0.75, 1].map((k) => min.value + k * (max.value - min.value)) : []))
const paso = computed(() => (W - P.l - P.r) / Math.max(1, años.value.length - 1))

const x = (a) => P.l + (años.value.indexOf(a) / Math.max(1, años.value.length - 1)) * (W - P.l - P.r)
const y = (v) => P.t + (1 - (v - min.value) / (max.value - min.value || 1)) * (H.value - P.t - P.b)
const path = (s) => s.data.filter((d) => d.valor != null).map((d, i) => `${i ? 'L' : 'M'}${x(d.año)},${y(d.valor)}`).join('')
const valorEn = (s, a) => {
  const v = s.data.find((d) => d.año === a)?.valor
  return v == null ? 's/d' : `${num(v, 1)} ${props.unidad}`
}
</script>

<style scoped>
.chart { position: relative; }
svg { width: 100%; height: auto; display: block; overflow: visible; }
.grid { stroke: #e6eaf0; }
.cursor { stroke: #9aa6b6; stroke-dasharray: 3 3; }
.ax { font-size: 10px; fill: var(--muted); }
.tip {
  position: absolute; top: 0; transform: translateX(-50%); background: var(--surface); border: 1px solid var(--border);
  border-radius: 6px; padding: 0.35rem 0.55rem; font-size: 0.75rem; box-shadow: var(--shadow); pointer-events: none; white-space: nowrap; z-index: 2;
}
.legend { display: flex; flex-wrap: wrap; gap: 0.8rem; font-size: 0.78rem; margin-top: 0.4rem; }
i { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 0.3rem; vertical-align: -1px; }
.empty { text-align: center; }
</style>
