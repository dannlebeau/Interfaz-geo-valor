// Genera informes imprimibles (ficha de propiedad e informe de tasación).
// Se abren en una ventana nueva y se descargan como PDF con "Guardar como PDF".
import { uf, clp, m2, fecha, fechaHora, pct, num, escapeHtml as e } from './format.js'

const CSS = `
  *{box-sizing:border-box} body{font:12px/1.45 system-ui,Segoe UI,Arial,sans-serif;color:#1d2433;margin:28px}
  h1{font-size:19px;margin:0 0 2px;color:#0f3d5e} h2{font-size:13px;margin:20px 0 6px;color:#0f3d5e;border-bottom:2px solid #0f3d5e;padding-bottom:3px;text-transform:uppercase;letter-spacing:.04em}
  .sub{color:#5a6475;margin-bottom:14px} table{width:100%;border-collapse:collapse} td,th{padding:5px 7px;border:1px solid #d8dde6;text-align:left;vertical-align:top}
  th{background:#eef2f7;width:36%;font-weight:600} thead th{width:auto} .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .big{font-size:26px;font-weight:700;color:#0f3d5e} .muted{color:#5a6475} .box{border:1px solid #d8dde6;border-radius:6px;padding:12px}
  .bar{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
  button{padding:8px 14px;border:0;border-radius:6px;background:#0f3d5e;color:#fff;font-weight:600;cursor:pointer}
  footer{margin-top:22px;color:#5a6475;font-size:10.5px;border-top:1px solid #d8dde6;padding-top:8px}
  @media print{.noprint{display:none} body{margin:12mm}}`

export function svgLinea(serie, w = 520, h = 160) {
  const pts = serie.filter((p) => p.valor != null)
  if (pts.length < 2) return '<p class="muted">Sin datos suficientes para graficar.</p>'
  const pad = { l: 40, r: 10, t: 10, b: 22 }
  const xs = (a) => pad.l + ((a - pts[0].año) / (pts.at(-1).año - pts[0].año)) * (w - pad.l - pad.r)
  const max = Math.max(...pts.map((p) => p.valor)) * 1.08
  const min = Math.min(...pts.map((p) => p.valor)) * 0.9
  const ys = (v) => pad.t + (1 - (v - min) / (max - min)) * (h - pad.t - pad.b)
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${xs(p.año).toFixed(1)},${ys(p.valor).toFixed(1)}`).join('')
  const ticks = [min, (min + max) / 2, max]
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" style="max-width:${w}px">
    ${ticks.map((t) => `<line x1="${pad.l}" x2="${w - pad.r}" y1="${ys(t)}" y2="${ys(t)}" stroke="#e3e7ee"/><text x="${pad.l - 4}" y="${ys(t) + 3}" font-size="9" text-anchor="end" fill="#5a6475">${num(t)}</text>`).join('')}
    <path d="${d}" fill="none" stroke="#1f6fb2" stroke-width="2"/>
    ${pts.map((p) => `<circle cx="${xs(p.año)}" cy="${ys(p.valor)}" r="2.6" fill="#1f6fb2"/><text x="${xs(p.año)}" y="${h - 6}" font-size="9" text-anchor="middle" fill="#5a6475">${p.año}</text>`).join('')}
  </svg>`
}

function abrir(titulo, cuerpo) {
  const w = window.open('', '_blank')
  if (!w) {
    alert('Habilite las ventanas emergentes para descargar el informe.')
    return
  }
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${e(titulo)}</title><style>${CSS}</style></head><body>
    <div class="bar noprint"><span class="muted">Use “Guardar como PDF” en el diálogo de impresión.</span><button onclick="print()">Descargar PDF</button></div>
    ${cuerpo}
    <footer>Generado por GeoValor el ${fechaHora(new Date().toISOString())}. Datos de transacciones según inscripciones en Conservadores de Bienes Raíces y ofertas publicadas en portales inmobiliarios. Valores en UF.</footer>
  </body></html>`)
  w.document.close()
}

const fila = (k, v) => `<tr><th>${e(k)}</th><td>${v}</td></tr>`

export function fichaPropiedad(r, serie, usuario) {
  const esCbr = r.tipo === 'CBR'
  abrir(`Ficha ${r.rol} – ${r.comuna}`, `
    <h1>Ficha resumen de propiedad</h1>
    <div class="sub">${esCbr ? 'Transacción inscrita en CBR' : 'Oferta de mercado'} · ${e(r.direccion)}, ${e(r.comuna)} · Consultado por ${e(usuario)}</div>
    <div class="grid">
      <div>
        <h2>Identificación</h2>
        <table>
          ${fila('Año', r.año)}
          ${fila('Región', e(r.region))}
          ${fila('Comuna', e(r.comuna))}
          ${fila('Dirección', e(r.direccion))}
          ${fila('Rol SII', e(r.rol))}
          ${fila('Destino según SII', e(r.destino))}
          ${fila('Tipología', e(r.tipologia))}
          ${fila('Zona', e(r.zona))}
          ${fila('Coordenadas', `${r.lat}, ${r.lng}`)}
        </table>
        <h2>${esCbr ? 'Registro' : 'Publicación'}</h2>
        <table>
          ${esCbr
            ? fila('Fecha inscripción', fecha(r.fecha)) + fila('Conservador', e(r.cbr)) + fila('Fojas / Número / Año', `${r.fojas} / ${r.numero} / ${r.añoInscripcion}`)
            : fila('Fecha publicación', fecha(r.fecha)) + fila('Fuente', e(r.portal)) + fila('Días publicada', r.diasPublicada)}
        </table>
      </div>
      <div>
        <h2>Valores y superficies</h2>
        <table>
          ${fila(esCbr ? 'Valor transacción total' : 'Precio publicado', `<b>${uf(r.valorTotal)}</b> <span class="muted">(${clp(r.valorTotal)})</span>`)}
          ${fila('Superficie terreno', m2(r.supTerreno))}
          ${fila('Superficie construcción', m2(r.supConstruccion))}
          ${fila('Valor terreno', uf(r.valorTerreno))}
          ${fila('Valor construcción', uf(r.valorConstruccion))}
          ${fila('UF/m²', num(r.ufM2, 1))}
          ${fila('Año construcción', r.añoConstruccion ?? '—')}
        </table>
        <h2>Normas urbanísticas</h2>
        <table>
          ${fila('Zona PRC', e(r.normas.zonaPRC))}
          ${fila('Usos permitidos', e(r.normas.usosPermitidos))}
          ${fila('Coef. constructibilidad', r.normas.coefConstructibilidad)}
          ${fila('Coef. ocupación de suelo', r.normas.coefOcupacion)}
          ${fila('Altura máxima', r.normas.alturaMaxima)}
          ${fila('Densidad máxima', r.normas.densidad)}
          ${fila('Subdivisión predial mínima', r.normas.subdivisionMinima)}
        </table>
      </div>
    </div>
    <h2>Plusvalía · ${e(r.tipologia)} en ${e(r.comuna)} (mediana UF/m², transacciones CBR)</h2>
    ${svgLinea(serie)}
  `)
}

export function informeTasacion(t) {
  const { entrada: i, resultado: r } = t
  abrir(`Tasación ${i.direccion}`, `
    <h1>Informe de tasación online (sin visita)</h1>
    <div class="sub">${e(i.direccion)}, ${e(i.comuna)} · Rol ${e(i.rol || '—')} · Solicitado por ${e(t.usuario)} el ${fechaHora(t.fecha)} · Folio ${t.id}</div>
    <div class="grid">
      <div class="box"><div class="muted">Valor comercial estimado</div><div class="big">${uf(r.valorUF)}</div>
        <div class="muted">${clp(r.valorUF)} · Rango ${uf(r.rangoMin)} – ${uf(r.rangoMax)}</div>
        <div class="muted">${num(r.ufM2, 1)} UF/m² sobre superficie ${r.superficieBase}</div></div>
      <table>
        ${fila('Tipología', e(i.tipologia))}
        ${fila('Sup. terreno / construcción', `${m2(i.supTerreno)} / ${m2(i.supConstruccion)}`)}
        ${fila('Año construcción', i.añoConstruccion || '—')}
        ${fila('Estado de conservación', e(i.estado))}
      </table>
    </div>
    <h2>1. Análisis de ventas reales (CBR)</h2>
    <p>${r.ventas.n} comparables (${e(r.ventas.criterio)}). Mediana actualizada: <b>${num(r.ventas.medianaM2, 1)} UF/m²</b>.
       Plusvalía anual de la tipología en la comuna: <b>${pct(r.ventas.plusvaliaAnual)}</b>.
       Ajustes aplicados: antigüedad ${pct(r.ajustes.edad)}, estado ${pct(r.ajustes.estado)}.</p>
    <table><thead><tr><th>Dirección</th><th>Rol</th><th>Fecha</th><th>Terreno</th><th>Constr.</th><th>Valor</th><th>UF/m²</th><th>UF/m² act.</th></tr></thead><tbody>
      ${r.ventas.comparables.map((c) => `<tr><td>${e(c.direccion)}</td><td>${e(c.rol)}</td><td>${fecha(c.fecha)}</td><td>${m2(c.supTerreno)}</td><td>${m2(c.supConstruccion)}</td><td>${uf(c.valorTotal)}</td><td>${num(c.ufM2, 1)}</td><td>${num(c.ufM2Actualizado, 1)}</td></tr>`).join('')}
    </tbody></table>
    <h2>2. Análisis de mercado (ofertas vigentes)</h2>
    <p>${r.mercado.n ? `${r.mercado.n} ofertas activas de la misma tipología. Mediana de oferta <b>${num(r.mercado.medianaM2, 1)} UF/m²</b>,
       brecha oferta/venta de <b>${pct(r.mercado.brecha)}</b>. Tiempo promedio de publicación: ${r.mercado.diasPromedio} días.` : 'Sin ofertas vigentes comparables en la comuna.'}</p>
    <h2>3. Análisis de rentabilidad</h2>
    <table>
      ${fila('Arriendo mensual estimado', `${num(r.rentabilidad.arriendoMensual, 1)} UF (${clp(r.rentabilidad.arriendoMensual)})`)}
      ${fila('Rentabilidad bruta anual', pct(r.rentabilidad.capRate))}
      ${fila('Rentabilidad neta anual (gastos ' + pct(r.rentabilidad.gastos) + ')', pct(r.rentabilidad.rentaNeta))}
      ${fila('Años de recuperación de la inversión', r.rentabilidad.añosRecupero)}
    </table>
    <p class="muted">Tasación de escritorio basada en información de mercado; no reemplaza una tasación con inspección del inmueble.</p>
  `)
}
