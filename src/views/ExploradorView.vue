<template>
  <div class="explorador" :class="{ 'con-detalle': sel }">
    <!-- Filtros -->
    <aside class="filtros">
      <form class="buscar" @submit.prevent="buscarTexto">
        <input v-model="texto" placeholder="Buscar dirección o Rol SII…" />
        <button class="btn sm">Buscar</button>
      </form>

      <div class="tipos">
        <label :class="{ on: f.cbr }"><input v-model="f.cbr" type="checkbox" /><i class="dot cbr"></i>Transacciones CBR</label>
        <label :class="{ on: f.oferta }"><input v-model="f.oferta" type="checkbox" /><i class="dot oferta"></i>Ofertas de mercado</label>
      </div>

      <label class="field">Región
        <select v-model="f.region" @change="f.comuna = ''">
          <option value="">Todas</option>
          <option v-for="r in REGIONES" :key="r">{{ r }}</option>
        </select>
      </label>
      <label class="field">Comuna
        <select v-model="f.comuna">
          <option value="">Todas</option>
          <option v-for="c in comunasRegion" :key="c.nombre">{{ c.nombre }}</option>
        </select>
      </label>
      <div class="row">
        <label class="field">Zona
          <select v-model="f.zona"><option value="">Urbano y rural</option><option>Urbano</option><option>Rural</option></select>
        </label>
        <label class="field">Destino SII
          <select v-model="f.destino"><option value="">Todos</option><option v-for="d in DESTINOS" :key="d">{{ d }}</option></select>
        </label>
      </div>
      <div class="row">
        <label class="field">Año desde<input v-model.number="f.añoDesde" type="number" :min="AÑO_INICIO" :max="AÑO_ACTUAL" /></label>
        <label class="field">Año hasta<input v-model.number="f.añoHasta" type="number" :min="AÑO_INICIO" :max="AÑO_ACTUAL" /></label>
      </div>
      <div class="row">
        <label class="field">Fecha transacción desde<input v-model="f.fechaDesde" type="date" /></label>
        <label class="field">hasta<input v-model="f.fechaHasta" type="date" /></label>
      </div>
      <div class="row">
        <label class="field">Sup. terreno mín (m²)<input v-model.number="f.stMin" type="number" min="0" /></label>
        <label class="field">máx<input v-model.number="f.stMax" type="number" min="0" /></label>
      </div>
      <div class="row">
        <label class="field">Sup. edificada mín (m²)<input v-model.number="f.scMin" type="number" min="0" /></label>
        <label class="field">máx<input v-model.number="f.scMax" type="number" min="0" /></label>
      </div>
      <div class="row">
        <label class="field">Valor mín (UF)<input v-model.number="f.vMin" type="number" min="0" /></label>
        <label class="field">máx<input v-model.number="f.vMax" type="number" min="0" /></label>
      </div>
      <button class="btn light sm" type="button" @click="limpiar">Limpiar filtros</button>

      <div class="resumen card">
        <div class="r-num">{{ num(filtrados.length) }}</div>
        <div class="muted">registros encontrados</div>
        <div class="r-det">
          <span><i class="dot cbr"></i>{{ num(nCbr) }} CBR</span>
          <span><i class="dot oferta"></i>{{ num(filtrados.length - nCbr) }} ofertas</span>
        </div>
        <div v-if="medianaM2" class="muted">Mediana {{ num(medianaM2, 1) }} UF/m²</div>
        <div class="acciones">
          <button class="btn sm" :disabled="!filtrados.length" @click="exportar">⬇ Exportar Excel</button>
          <button class="btn light sm" @click="verTabla = !verTabla">{{ verTabla ? 'Ocultar' : 'Ver' }} tabla</button>
        </div>
      </div>
    </aside>

    <!-- Mapa -->
    <section class="centro">
      <MapaRegistros ref="mapa" :registros="filtrados" :seleccionado="sel" @seleccionar="abrir" />
      <div class="leyenda">
        <span><i class="dot cbr"></i>Transacción CBR</span>
        <span><i class="dot oferta"></i>Oferta</span>
        <span class="muted">Acerque el mapa para ver títulos</span>
      </div>
      <div v-if="verTabla" class="tabla">
        <div class="table-wrap">
          <table class="tbl">
            <thead><tr><th>Tipo</th><th>Año</th><th>Comuna</th><th>Dirección</th><th>Rol</th><th>Destino</th><th class="num">Terreno</th><th class="num">Constr.</th><th class="num">Valor UF</th><th class="num">UF/m²</th></tr></thead>
            <tbody>
              <tr v-for="r in filtrados.slice(0, 300)" :key="r.id" @click="abrir(r)" style="cursor:pointer">
                <td><span class="tag" :class="r.tipo === 'CBR' ? 'cbr' : 'oferta'">{{ r.tipo }}</span></td>
                <td>{{ r.año }}</td><td>{{ r.comuna }}</td><td>{{ r.direccion }}</td><td>{{ r.rol }}</td><td>{{ r.destino }}</td>
                <td class="num">{{ num(r.supTerreno) }}</td><td class="num">{{ num(r.supConstruccion) }}</td>
                <td class="num">{{ num(r.valorTotal) }}</td><td class="num">{{ num(r.ufM2, 1) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <small v-if="filtrados.length > 300">Mostrando 300 de {{ num(filtrados.length) }}. Exporte a Excel para obtener todos.</small>
      </div>
    </section>

    <!-- Ficha (segunda visualización) -->
    <aside v-if="sel" class="detalle">
      <div class="d-head">
        <div>
          <span class="tag" :class="sel.tipo === 'CBR' ? 'cbr' : 'oferta'">{{ sel.tipo === 'CBR' ? 'Transacción CBR' : 'Oferta de mercado' }}</span>
          <h2>{{ sel.direccion }}</h2>
          <div class="muted">{{ sel.comuna }}, {{ sel.region }}</div>
        </div>
        <button class="x" title="Cerrar" @click="sel = null">✕</button>
      </div>

      <div class="valor">
        <div class="muted">{{ sel.tipo === 'CBR' ? 'Valor transacción total' : 'Precio publicado' }}</div>
        <div class="v">{{ uf(sel.valorTotal) }}</div>
        <div class="muted">{{ clp(sel.valorTotal) }} · {{ num(sel.ufM2, 1) }} UF/m²</div>
      </div>

      <h3>Datos del inmueble y registro</h3>
      <dl>
        <dt>Año</dt><dd>{{ sel.año }}</dd>
        <dt>Rol SII</dt><dd>{{ sel.rol }}</dd>
        <dt>Destino SII</dt><dd>{{ sel.destino }}</dd>
        <dt>Tipología</dt><dd>{{ sel.tipologia }} · {{ sel.zona }}</dd>
        <template v-if="sel.tipo === 'CBR'">
          <dt>Fecha inscripción</dt><dd>{{ fecha(sel.fecha) }}</dd>
          <dt>Inscripción</dt><dd>Fs. {{ sel.fojas }} Nº {{ sel.numero }} / {{ sel.añoInscripcion }}</dd>
          <dt>Conservador</dt><dd>{{ sel.cbr }}</dd>
        </template>
        <template v-else>
          <dt>Fecha publicación</dt><dd>{{ fecha(sel.fecha) }}</dd>
          <dt>Fuente</dt><dd>{{ sel.portal }} · {{ sel.diasPublicada }} días</dd>
        </template>
        <dt>Sup. terreno</dt><dd>{{ m2(sel.supTerreno) }}</dd>
        <dt>Sup. construcción</dt><dd>{{ m2(sel.supConstruccion) }}</dd>
        <dt>Valor terreno</dt><dd>{{ uf(sel.valorTerreno) }}</dd>
        <dt>Valor construcción</dt><dd>{{ uf(sel.valorConstruccion) }}</dd>
      </dl>

      <h3>Normas urbanísticas</h3>
      <dl>
        <dt>Zona PRC</dt><dd>{{ sel.normas.zonaPRC }}</dd>
        <dt>Usos</dt><dd>{{ sel.normas.usosPermitidos }}</dd>
        <dt>Constructibilidad</dt><dd>{{ sel.normas.coefConstructibilidad }}</dd>
        <dt>Ocupación suelo</dt><dd>{{ sel.normas.coefOcupacion }}</dd>
        <dt>Altura máx.</dt><dd>{{ sel.normas.alturaMaxima }}</dd>
        <dt>Densidad</dt><dd>{{ sel.normas.densidad }}</dd>
      </dl>

      <h3>Plusvalía · {{ sel.tipologia }} en {{ sel.comuna }}</h3>
      <LineChart :series="[{ nombre: sel.tipologia, color: '#1f6fb2', data: serieSel }]" :alto="170" />
      <p class="muted var">Variación {{ serieSel[0].año }}–{{ serieSel.at(-1).año }}: <b>{{ pct(varSel.total) }}</b> · anual {{ pct(varSel.anual) }}</p>

      <div class="d-acc">
        <button class="btn" @click="descargarFicha">⬇ Descargar ficha (PDF)</button>
        <router-link class="btn light" :to="{ path: '/tasaciones', query: { desde: sel.id } }">Tasar similar</router-link>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch, nextTick } from 'vue'
import MapaRegistros from '../components/MapaRegistros.vue'
import LineChart from '../components/LineChart.vue'
import { REGISTROS } from '../data/generate.js'
import { COMUNAS, REGIONES, DESTINOS, AÑO_INICIO, AÑO_ACTUAL } from '../data/comunas.js'
import { num, uf, clp, m2, fecha, pct, mediana } from '../utils/format.js'
import { seriePlusvalia, variacion } from '../utils/analisis.js'
import { exportarExcel, filaRegistro } from '../utils/exportar.js'
import { fichaPropiedad } from '../utils/informe.js'
import { registrar, usuarioActual } from '../store.js'

const vacio = () => ({
  cbr: true, oferta: true, region: '', comuna: 'Providencia', zona: '', destino: '',
  añoDesde: AÑO_INICIO, añoHasta: AÑO_ACTUAL, fechaDesde: '', fechaHasta: '',
  stMin: null, stMax: null, scMin: null, scMax: null, vMin: null, vMax: null,
})
const f = reactive(vacio())
const texto = ref('')
const textoActivo = ref('')
const sel = ref(null)
const verTabla = ref(false)
const mapa = ref(null)

const comunasRegion = computed(() => COMUNAS.filter((c) => !f.region || c.region === f.region))

const filtrados = computed(() => {
  const q = textoActivo.value.toLowerCase()
  return REGISTROS.filter((r) =>
    ((r.tipo === 'CBR' && f.cbr) || (r.tipo === 'Oferta' && f.oferta)) &&
    (!f.region || r.region === f.region) &&
    (!f.comuna || r.comuna === f.comuna) &&
    (!f.zona || r.zona === f.zona) &&
    (!f.destino || r.destino === f.destino) &&
    (!f.añoDesde || r.año >= f.añoDesde) &&
    (!f.añoHasta || r.año <= f.añoHasta) &&
    (!f.fechaDesde || r.fecha >= f.fechaDesde) &&
    (!f.fechaHasta || r.fecha <= f.fechaHasta) &&
    (f.stMin == null || f.stMin === '' || r.supTerreno >= f.stMin) &&
    (f.stMax == null || f.stMax === '' || r.supTerreno <= f.stMax) &&
    (f.scMin == null || f.scMin === '' || r.supConstruccion >= f.scMin) &&
    (f.scMax == null || f.scMax === '' || r.supConstruccion <= f.scMax) &&
    (f.vMin == null || f.vMin === '' || r.valorTotal >= f.vMin) &&
    (f.vMax == null || f.vMax === '' || r.valorTotal <= f.vMax) &&
    (!q || r.direccion.toLowerCase().includes(q) || r.rol.includes(q)),
  )
})
const nCbr = computed(() => filtrados.value.filter((r) => r.tipo === 'CBR').length)
const medianaM2 = computed(() => mediana(filtrados.value.filter((r) => r.supConstruccion).map((r) => r.ufM2)))

const serieSel = computed(() => (sel.value ? seriePlusvalia(sel.value.comuna, sel.value.tipologia) : []))
const varSel = computed(() => variacion(serieSel.value))

watch(() => [f.comuna, f.region], ([comuna, region]) => {
  if (comuna || region) registrar('busqueda', { comuna: comuna || null, detalle: `Filtro ${comuna || region}` })
  nextTick(() => mapa.value?.ajustar())
}, { immediate: true })

watch(sel, () => nextTick(() => mapa.value?.invalidar()))

function buscarTexto() {
  textoActivo.value = texto.value.trim()
  if (!textoActivo.value) return
  registrar('busqueda', { comuna: f.comuna || null, direccion: textoActivo.value, detalle: `Búsqueda “${textoActivo.value}”` })
  nextTick(() => mapa.value?.ajustar())
}

function abrir(r) {
  sel.value = r
  registrar('ficha', { comuna: r.comuna, direccion: r.direccion, detalle: `Rol ${r.rol}` })
}

function limpiar() {
  Object.assign(f, vacio(), { comuna: '' })
  texto.value = ''
  textoActivo.value = ''
}

function exportar() {
  exportarExcel(filtrados.value.map(filaRegistro), `geovalor_${f.comuna || f.region || 'nacional'}_${new Date().toISOString().slice(0, 10)}`, 'Registros')
  registrar('exportar', { comuna: f.comuna || null, detalle: `Exportación Excel (${filtrados.value.length} registros)` })
}

function descargarFicha() {
  fichaPropiedad(sel.value, serieSel.value, usuarioActual.value.nombre)
  registrar('descarga', { comuna: sel.value.comuna, direccion: sel.value.direccion, detalle: `Ficha PDF rol ${sel.value.rol}` })
}
</script>

<style scoped>
.explorador { display: grid; grid-template-columns: 300px 1fr; grid-template-rows: 100%; height: 100%; overflow: hidden; }
.explorador.con-detalle { grid-template-columns: 300px 1fr 380px; }
.filtros, .detalle { background: var(--surface); overflow-y: auto; min-height: 0; padding: 0.9rem; display: flex; flex-direction: column; gap: 0.7rem; }
.filtros > *, .detalle > * { flex-shrink: 0; }
.filtros { border-right: 1px solid var(--border); }
.detalle { border-left: 1px solid var(--border); gap: 0.6rem; }
.buscar { display: flex; gap: 0.4rem; }
.tipos { display: flex; flex-direction: column; gap: 0.3rem; }
.tipos label { display: flex; align-items: center; gap: 0.45rem; padding: 0.4rem 0.55rem; border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-weight: 500; }
.tipos label.on { background: var(--surface-2); border-color: #b9cde0; }
.tipos input { width: auto; }
.dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 0.3rem; }
.dot.cbr { background: var(--cbr); }
.dot.oferta { background: var(--oferta); }
.resumen { padding: 0.8rem; text-align: center; }
.r-num { font-size: 1.8rem; font-weight: 700; color: var(--primary); line-height: 1; }
.r-det { display: flex; justify-content: center; gap: 1rem; margin: 0.4rem 0; font-size: 0.85rem; }
.acciones { display: flex; gap: 0.4rem; justify-content: center; margin-top: 0.6rem; flex-wrap: wrap; }

.centro { position: relative; display: flex; flex-direction: column; min-width: 0; min-height: 0; }
.centro :deep(.mapa) { flex: 1; height: auto; min-height: 0; }
.leyenda {
  position: absolute; left: 10px; bottom: 26px; z-index: 500; background: var(--surface); border-radius: 6px;
  padding: 0.35rem 0.6rem; font-size: 0.78rem; display: flex; gap: 0.8rem; box-shadow: var(--shadow);
}
.tabla { height: 38%; display: flex; flex-direction: column; padding: 0.5rem; background: var(--bg); border-top: 1px solid var(--border); }
.tabla .table-wrap { flex: 1; }

.d-head { display: flex; justify-content: space-between; gap: 0.5rem; }
.d-head h2 { margin-top: 0.35rem; }
.x { border: 0; background: none; font-size: 1.1rem; cursor: pointer; color: var(--muted); align-self: flex-start; }
.valor { background: var(--surface-2); border: 1px solid var(--border); border-radius: 6px; padding: 0.6rem 0.8rem; }
.valor .v { font-size: 1.6rem; font-weight: 700; color: var(--primary); }
dl { display: grid; grid-template-columns: 130px 1fr; gap: 0.25rem 0.6rem; margin: 0; font-size: 0.85rem; }
dt { color: var(--muted); }
dd { margin: 0; font-weight: 500; }
.var { font-size: 0.8rem; margin: 0; }
.d-acc { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.3rem; }
.d-acc .btn { text-decoration: none; }

@media (max-width: 980px) {
  .explorador, .explorador.con-detalle { grid-template-columns: 1fr; grid-template-rows: auto 60vh auto; height: auto; overflow: visible; }
}
</style>
