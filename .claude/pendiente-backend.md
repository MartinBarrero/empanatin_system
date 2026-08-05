# Pendiente de backend tras el rediseño visual

Este documento resume los cambios de front hechos en esta sesión de diseño y qué falta en el backend (Supabase / server actions / repositorios) para que la página quede 100% funcional. Está pensado para que una sesión futura lo lea primero y sepa en qué trabajar.

Todos los cambios de esta sesión se hicieron sobre el branch `worktree-billetera-rediseno`, que ya está mergeado (fast-forward) en `main`.

## Resumen rápido (checklist)

- [x] Conectar el botón de eliminar (canasta) en fiados pagados a una acción real de borrado.
- [x] Decidir e implementar cómo funciona "Editar stock" — se implementó la **Opción A** (editar/borrar compras); el botón "Editar stock" ahora enlaza a `#historial-compras`.
- [x] Conectar el gráfico "Ventas de la semana actual" a datos reales (ya no usa `datosMock`).
- [ ] (Opcional, no bloqueante) Evaluar si vale la pena renombrar `monto_nu` → `monto_nequi` en base de datos para que coincida con el front, siguiendo el precedente de `002_rename_billetera.sql`.

Nada de lo de abajo requirió tocar base de datos todavía — todos los cambios de esta sesión fueron solo visuales (`components/**`, `app/layout.tsx`, `app/globals.css`, `tailwind.config.ts`). Los tres puntos con checkbox de arriba sí lo requieren.

---

## 1. Fiados: botón de eliminar en "Pagados" (falta backend)

**Dónde:** `components/fiados/FiadosPanel.tsx`, lista de "Pagados".

Se agregó un botón con ícono de canasta (`Trash2` de `lucide-react`) en cada fiado pagado. Hoy es puramente visual — el `<button>` no tiene `onClick`.

**Qué falta:**

1. `lib/repositorios/fiados.ts`: agregar `eliminarFiado(client, id): Promise<void>` que haga `client.from("fiados").delete().eq("id", id)`.
   - No hay ningún cálculo que dependa de fiados pagados (`deudaPendiente` en `DashboardSection.tsx` solo suma `estado === "pendiente"`), así que un borrado físico (hard delete) es seguro y no rompe ningún total.
2. `app/actions/fiados.ts`: agregar `eliminarFiadoAction(id: string)` siguiendo el mismo patrón que `registrarAbonoAction` (try/catch, `revalidatePath("/")`, devolver `{ ok: true } | { ok: false; error }`).
3. `components/fiados/FiadosPanel.tsx`: conectar el botón — `onClick` que llame la action dentro de un `startTransition`, quite el fiado del estado local (`setFiados`) si `ok`, y muestre el `mensaje` de error si falla. Vale la pena agregar un `window.confirm(...)` o similar antes de borrar, ya que es una acción destructiva.

---

## 2. Stock: botón "Editar stock" (falta decisión + backend)

**Dónde:** `components/stock/StockSection.tsx`, junto a las tarjetas de "Stock de carne" / "Stock de pollo".

Se agregó un botón "Editar stock" (ícono `Pencil`), también puramente visual por ahora.

**El problema de fondo:** el stock **no es un campo guardado**, es calculado (`lib/repositorios/inventario.ts`, función `obtenerStockActual`):

```
stock_tipo = SUM(compras_mercancia.cantidad_paquetes donde tipo) * unidades_por_paquete
           - SUM(registros_diarios.tipo_llevada)
```

No existe ningún campo "stock_carne" mutable que se pueda simplemente actualizar con un `UPDATE`. Por eso "editar el stock" necesita una decisión de diseño antes de picar código. Dos caminos razonables:

### Opción A — Corregir en la fuente (editar/borrar compras)
Dejar que la usuaria edite o borre una compra de mercancía ya registrada (ej. si puso mal la cantidad de paquetes). El stock se recalcula solo porque es una vista derivada.
- Agregar `actualizarCompra` y `eliminarCompra` en `lib/repositorios/comprasMercancia.ts`.
- Agregar las actions correspondientes en `app/actions/compras.ts`.
- En `components/stock/CompraMercanciaPanel.tsx`, agregar botones de editar/borrar en cada fila del "Historial de compras".
- Más simple de implementar y más honesto con el modelo de datos (no hay número "fantasma" que se pueda desincronizar de las compras/registros reales).

### Opción B — Ajuste manual de stock
Agregar una tabla nueva `ajustes_stock` (fecha, tipo, cantidad_unidades con signo, motivo opcional) como una entrada de corrección aparte, y sumarla en la fórmula de `obtenerStockActual`.
- Requiere una migración SQL nueva.
- Es más flexible (permite corregir sin tener que encontrar la compra exacta que causó el error), pero agrega una fuente de verdad más para mantener.

**Recomendación:** empezar por la Opción A — es la que mejor calza con "por si me equivoco llenandolo" (el error casi siempre va a estar en una compra mal registrada), y no agrega tablas nuevas. Si después de usarlo la usuaria sigue necesitando corregir el stock sin encontrar la compra exacta, ahí sí vale la pena la Opción B.

Cuando se decida el enfoque, el botón "Editar stock" en `StockSection.tsx` debe abrir el formulario/flujo correspondiente (probablemente un modal o un estado que muestre el historial de compras editable).

---

## 3. Gráfico "Ventas de la semana actual": sigue con datos de ejemplo

**Dónde:** `components/registro/VentasSemanaChart.tsx`.

El componente ya tenía este TODO desde antes de esta sesión de diseño (no es nuevo), pero queda pendiente para que la página esté 100% funcional:

```ts
// TODO: conectar a datos reales de `registros_diarios` filtrados por la
// semana actual (ver lib/repositorios/registrosDiarios.ts,
// listarRegistrosDiarios). Por ahora usa datos mock.
```

**Qué falta:**

1. `app/page.tsx` ya llama `listarRegistrosDiarios(supabase)` y guarda el resultado en `registros`, pero solo se lo pasa a `<DashboardSection />`. Hay que pasárselo también a `<RegistroSection registros={registros} ... />`.
2. En `RegistroSection.tsx`, pasar `registros` a `<VentasSemanaChart registros={registros} />`.
3. En `VentasSemanaChart.tsx`, convertir `registros` en el shape `{ dia: "Lun"|"Mar"|..., carne, pollo }[]` para la semana actual. Se puede reusar la lógica de `inicioDeSemana` que ya existe en `lib/dashboard.ts` (hoy es una función local no exportada — exportarla o duplicar el criterio ahí).
4. Quitar el mock (`datosMock`) y el aviso `"Datos de ejemplo — aún no conectado a tus ventas reales."` (con su color `text-warning`) una vez esté conectado.

---

## 4. Cambios visuales que NO requieren backend (contexto, no acción)

Por si se necesita el contexto completo del rediseño:

- **"Nu" → "Nequi"**: solo se cambió la etiqueta visible en `DashboardSection.tsx` y `RegistroDiarioForm.tsx`. Los nombres reales (`monto_nu`, `bolsillos.nu`, columna `monto_nu` en `registros_diarios`) siguen igual. Si en algún momento se quiere que el nombre interno coincida con "Nequi", sería una migración análoga a `supabase/migrations/002_rename_billetera.sql` (que ya renombró `monto_caja` → `monto_billetera`) — pero no es necesario para que la página funcione, es solo prolijidad.
- **"Monedas" oculto en el Dashboard**: se quitó la tarjeta de "Monedas" del apartado de Bolsillos en `DashboardSection.tsx`, pero el campo sigue totalmente activo — se sigue pidiendo en el formulario de registro diario (`RegistroDiarioForm.tsx`) y se sigue sumando en `obtenerSaldosBolsillos` (`lib/repositorios/bolsillos.ts`). Solo dejó de mostrarse como resumen.
- **Fiados sin campo "Empanadas"**: el formulario de creación de fiados ya no pide `cantidad_empanadas` — se sigue enviando como `null` a `crearFiadoAction`. La columna sigue existiendo y sigue siendo nullable (`supabase/migrations/001_init.sql`), así que no hace falta ninguna migración.
- **"Carne vs. pollo" fuera del Dashboard**: se quitó la tarjeta del Dashboard. La función `calcularComparacionCarnePollo` (`lib/dashboard.ts`) sigue existiendo y tiene tests (`lib/dashboard.test.ts`); solo dejó de usarse en la UI. No hace falta borrarla.
- Todo lo demás (colores del gráfico de barras, orden de Billetera/Nequi/Monedas en el formulario, layout de Carne/Pollo, centrado del formulario, cajitas de Hoy/Semana/Mes, etc.) es puramente estético — usa datos que ya existían y ya se calculan correctamente.
