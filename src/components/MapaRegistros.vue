<template>
  <div ref="el" class="mapa"></div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import L from 'leaflet'
import { num } from '../utils/format.js'

const props = defineProps({
  registros: { type: Array, required: true },
  seleccionado: { type: Object, default: null },
  extra: { type: Array, default: () => [] }, // puntos adicionales [{lat,lng,label,color}]
})
const emit = defineEmits(['seleccionar'])

const el = ref(null)
let map, capa, etiquetas, resaltado, capaExtra
const ZOOM_ETIQUETAS = 15
const renderer = L.canvas({ padding: 0.5 })

const color = (r) => (r.tipo === 'CBR' ? '#1f6fb2' : '#e07b16')
const titulo = (r) => `${num(r.valorTotal)} UF · ${r.tipo === 'CBR' ? r.año : 'Oferta'}`

function dibujar() {
  capa.clearLayers()
  for (const r of props.registros) {
    L.circleMarker([r.lat, r.lng], {
      renderer, radius: 5, color: '#fff', weight: 1, fillColor: color(r), fillOpacity: 0.9,
    })
      .bindTooltip(`<b>${r.tipologia}</b> · ${r.direccion}<br>${titulo(r)}`, { direction: 'top' })
      .on('click', () => emit('seleccionar', r))
      .addTo(capa)
  }
  actualizarEtiquetas()
}

// Títulos visibles sobre los puntos al acercarse (primera visualización).
function actualizarEtiquetas() {
  etiquetas.clearLayers()
  if (map.getZoom() < ZOOM_ETIQUETAS) return
  const b = map.getBounds()
  let n = 0
  for (const r of props.registros) {
    if (!b.contains([r.lat, r.lng])) continue
    if (++n > 250) break
    L.tooltip({ permanent: true, direction: 'right', offset: [6, 0], className: 'lbl', interactive: false })
      .setLatLng([r.lat, r.lng])
      .setContent(titulo(r))
      .addTo(etiquetas)
  }
}

function ajustar(lista = props.registros) {
  if (!map || !lista.length) return
  const b = L.latLngBounds(lista.map((r) => [r.lat, r.lng]))
  map.fitBounds(b, { padding: [30, 30], maxZoom: 15, animate: false })
}

function marcarSeleccion() {
  if (!map) return
  resaltado.clearLayers()
  const s = props.seleccionado
  if (!s) return
  L.circleMarker([s.lat, s.lng], { radius: 11, color: '#111', weight: 2.5, fill: false, interactive: false }).addTo(resaltado)
  if (!map.getBounds().contains([s.lat, s.lng])) map.panTo([s.lat, s.lng])
}

function dibujarExtra() {
  capaExtra.clearLayers()
  for (const p of props.extra) {
    L.circleMarker([p.lat, p.lng], { radius: p.radio || 8, color: '#fff', weight: 2, fillColor: p.color || '#c0392b', fillOpacity: 1 })
      .bindTooltip(p.label, { permanent: !!p.permanente, direction: 'top' })
      .addTo(capaExtra)
  }
}

onMounted(() => {
  map = L.map(el.value, { preferCanvas: true, zoomControl: true }).setView([-33.45, -70.65], 11)
  const base = {
    Calles: L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }),
    Gris: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', { maxNativeZoom: 16, maxZoom: 19, attribution: '© Esri' }),
    Satélite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: '© Esri' }),
  }
  base.Calles.addTo(map)
  L.control.layers(base, null, { position: 'topright' }).addTo(map)
  L.control.scale({ imperial: false }).addTo(map)
  capa = L.layerGroup().addTo(map)
  etiquetas = L.layerGroup().addTo(map)
  resaltado = L.layerGroup().addTo(map)
  capaExtra = L.layerGroup().addTo(map)
  map.on('moveend', actualizarEtiquetas)
  dibujar()
  dibujarExtra()
  ajustar(props.extra.length ? props.extra : props.registros)
})

onBeforeUnmount(() => {
  map?.off()
  map?.remove()
  map = null
})

watch(() => props.registros, () => map && dibujar())
watch(() => props.seleccionado, marcarSeleccion)
watch(() => props.extra, () => { if (!map) return; dibujarExtra(); if (props.extra.length) ajustar(props.extra) })

defineExpose({ ajustar, invalidar: () => map?.invalidateSize({ pan: false }) })
</script>

<style scoped>
.mapa { width: 100%; height: 100%; min-height: 300px; }
</style>
