# GeoValor

Prototipo de una plataforma georreferenciada de ofertas del mercado inmobiliario, transacciones inscritas en Conservadores de Bienes Raíces (CBR) y tasaciones online. Responde a los Términos de Referencia de la División de Bienes Nacionales (Unidad de Fiscalización y Tasación).

> **Datos simulados.** Los registros (`src/data/generate.js`) se generan de forma determinística para la demostración. En producción se reemplazan por la API que entrega los datos reales de CBR, portales y SII.

## Ejecutar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
```

Credenciales de demostración:

| Rol | Usuario | Clave |
|---|---|---|
| Usuario General | `usuario1` … `usuario8` | `Demo2026!` |
| Usuario Administrador | `admin1` … `admin4` | `Admin2026!` |

## Cumplimiento de los TDR

| Requisito | Dónde se cumple |
|---|---|
| Plan anual de 12 meses desde la OC | Panel de registro › Contrato (vigencia y días restantes) |
| Filtros por comuna, año, fecha de transacción, sup. terreno y sup. edificada | Explorador, panel izquierdo (más región, zona, destino SII y valor) |
| Cobertura nacional, inmuebles urbanos y rurales | 59 comunas en 16 regiones; filtro Zona urbano/rural |
| 1ª visualización: puntos y títulos | Mapa con puntos CBR/oferta; títulos visibles desde zoom 15 |
| 2ª visualización: informe resumen descargable | Ficha lateral al hacer clic + "Descargar ficha (PDF)" con año, comuna, dirección, Rol SII, destino SII, fecha de inscripción, valor total, superficies, valor de terreno y construcción, y normas urbanísticas |
| Plusvalía / evolución de precios | Vista Plusvalía (compara hasta 4 comunas) y gráfico en cada ficha |
| Consulta ilimitada de ofertas y CBR | Sin límite de consultas; solo las tasaciones descuentan saldo |
| Exportar a Excel | Explorador, Plusvalía, Cobertura y Panel de registro (.xlsx) |
| Altas y bajas de usuarios en 1 día hábil (hasta el máximo ofertado) | Panel de registro › Usuarios (controla el cupo contratado) |
| Detalle de la cobertura por comunas | Vista Cobertura (listado y mapa, exportable) |
| Acceso con usuario y clave | Pantalla de ingreso; rutas protegidas |
| 4 Usuarios Administradores con panel de consultas y direcciones | Panel de registro › Actividad: consultas por usuario y por día, comunas y registro de direcciones consultadas |
| Bolsa de tasaciones online por Usuario General con análisis de mercado, de rentabilidad y de ventas reales | Vista Tasaciones: saldo por usuario, informe PDF con los tres análisis y los comparables en el mapa |

Los parámetros de la oferta (Usuarios Generales, tasaciones por usuario, vigencia) se configuran en Panel de registro › Contrato.

## Para pasar a producción

- Autenticación y datos en un backend (p. ej. Supabase/PostgreSQL + PostGIS). Hoy el estado vive en `localStorage` (`src/store.js`), por lo que el control de acceso es solo del lado del cliente.
- Reemplazar `REGISTROS` por consultas paginadas por bounding box.
- Generar el PDF en el servidor si se requiere un formato oficial.
