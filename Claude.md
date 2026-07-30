# Empanatin — Sistema de gestión de ventas

## 1. Resumen del proyecto

Empanatin es un emprendimiento universitario de venta de empanadas (carne y pollo). Este proyecto reemplaza el registro manual diario (papel + calculadora) por una aplicación web que:

- Calcula automáticamente utilidad diaria, costo de mercancía recuperado y capital disponible para reinversión.
- Lleva inventario de empanadas y control de compras de mercancía.
- Registra fiados (cuentas por cobrar) y regalos de dinámicas.
- Muestra un dashboard con totales diarios, semanales y mensuales.

**Usuario:** una sola persona (la dueña), uso principal desde computador. No se requiere autenticación por ahora (posible mejora futura con Supabase Auth).

---

## 2. Stack tecnológico

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend/DB:** Supabase (Postgres + cliente JS `@supabase/supabase-js`)
- **Gráficas:** Recharts
- **Despliegue:** Vercel (plan gratuito)
- **Diseño:** Dark mode (ver sección 7)

> Nota para Claude Code: usar Server Components donde tenga sentido, y Route Handlers o Server Actions para mutaciones (crear registro diario, registrar compra, marcar fiado como pagado, etc.). Evitar exponer lógica de cálculo solo en el cliente: los cálculos de utilidad/costos deben poder recalcularse de forma confiable en el servidor.

---

## 3. Reglas de negocio (CRÍTICO — leer con cuidado)

### 3.1 Datos de referencia (configurables, no hardcodeados)

| Concepto | Valor actual |
|---|---|
| Costo paquete empanada de carne (25 unidades) | $26.000 |
| Costo paquete empanada de pollo (25 unidades) | $28.000 |
| Costo paquete de salsas | $4.000 |
| Precio venta empanada de carne | $2.200 (promo 2x$4.000) |
| Precio venta empanada de pollo | $2.200 |
| Gasto operativo fijo diario | $5.000 |

Estos valores deben vivir en una tabla `configuracion` editable, **no** hardcodeados en el código, porque pueden cambiar con el tiempo. Los cálculos históricos ya guardados (`costo_recuperado`, `utilidad`) no deben recalcularse si la configuración cambia después — se guardan "congelados" al momento del registro.

Costo unitario = costo del paquete / 25 (carne: $1.040 c/u — pollo: $1.120 c/u).

### 3.2 Registro diario de ventas

Cada día la dueña ingresa:
- `carne_llevada`: cantidad de empanadas de carne que llevó ese día (dato **potencial**, no separado por tipo de venta/promo).
- `pollo_llevada`: cantidad de empanadas de pollo que llevó ese día.
- `regalos_carne`: cuántas de esas empanadas de carne se regalaron en dinámicas (informativo — **solo existen regalos de carne**, nunca de pollo).
- `ingreso_total`: dinero total contado al final del día (efectivo + transferencias). **Este total ya incluye cualquier pago de fiado recibido ese día** — no se debe sumar aparte.
- Distribución del ingreso entre bolsillos: `monto_caja`, `monto_monedas`, `monto_nu` (deben sumar `ingreso_total`).

No se pide diferenciar cuántas ventas fueron normales vs. promoción 2x$4.000 — la dueña es flexible con esto y no necesita un resultado exacto por ese lado.

**Importante:** `carne_llevada` y `pollo_llevada` ya incluyen las unidades regaladas y las fiadas — no se restan ni se suman aparte del stock. Es decir, si llevó 30 de carne, esas 30 salen del inventario sin importar si se vendieron, regalaron o fiaron.

### 3.3 Fórmula del día (el corazón del sistema)

```
costo_unit_carne = costo_paquete_carne / unidades_por_paquete
costo_unit_pollo = costo_paquete_pollo / unidades_por_paquete

costo_recuperado = (carne_llevada * costo_unit_carne) + (pollo_llevada * costo_unit_pollo)

gasto_operativo = gasto_operativo_diario   // fijo, siempre se resta completo (confirmado por la usuaria: "siempre alcanza")

utilidad = ingreso_total - costo_recuperado - gasto_operativo
```

Reglas clave confirmadas por la usuaria:
- El `costo_recuperado` **siempre** se acredita completo al capital de reinversión, sin importar si `ingreso_total` alcanzó a cubrirlo. Si no alcanza, lo que falta se descuenta de la utilidad del día (la utilidad puede, en teoría, dar negativa — aunque en la práctica la usuaria indica que normalmente sí alcanza).
- El gasto operativo de $5.000 se resta siempre completo (no parcial).

### 3.4 Capital de reinversión

- Aumenta cada día en `costo_recuperado`.
- Disminuye cuando se registra una compra de mercancía (`costo_total` de la compra).
- **Recomendación técnica:** no guardar esto como un solo número mutable. Calcularlo como una vista/consulta agregada:
  `capital_reinversion = SUM(registros_diarios.costo_recuperado) - SUM(compras_mercancia.costo_total)`
  Esto evita inconsistencias si más adelante se edita o borra un registro.

### 3.5 Inventario

- `stock_carne` y `stock_pollo` se calculan como:
  `stock_tipo = SUM(compras_mercancia.unidades donde tipo) - SUM(registros_diarios.tipo_llevada)`
- Las salsas **no llevan control de inventario** (solo se registra el gasto de compra), ya que se regalan sin seguimiento.

### 3.6 Compras de mercancía

- Evento independiente de las ventas diarias — se puede registrar cualquier día.
- Campos: fecha, tipo (`carne` / `pollo` / `salsa`), cantidad de paquetes, costo total (autocalculado con la configuración vigente, pero editable por si hay descuentos).
- Al registrar una compra: descuenta del capital de reinversión y aumenta el stock correspondiente (paquetes × 25 unidades para carne/pollo).
- Opcional (mejora): permitir indicar de qué bolsillo salió el dinero (Caja/Monedas/Nu) para descontar ese saldo.

### 3.7 Fiados (cuentas por cobrar)

- Campos: nombre de la persona, cantidad de empanadas (opcional), monto en pesos, fecha de creación, estado (`pendiente` / `pagado`), fecha de pago.
- Se permiten abonos parciales (agregar un campo de monto abonado o registrar el fiado como una serie de abonos hasta llegar al monto total — a definir en el diseño de UI, pero el modelo de datos debe soportarlo).
- Cuando se marca como pagado, **no se suma automáticamente a `ingreso_total`** de ningún día — la usuaria ya lo cuenta manualmente el día que le pagan, dentro de su total contado.

### 3.8 Bolsillos (Caja, Monedas, Nu)

- Se quiere ver cuánto hay acumulado en cada uno.
- `saldo_bolsillo = SUM(registros_diarios.monto_bolsillo correspondiente) - retiros registrados (ej. compras pagadas desde ese bolsillo)`

---

## 4. Modelo de datos propuesto (Supabase / Postgres)

```sql
create table configuracion (
  id int primary key default 1,
  costo_paquete_carne numeric not null default 26000,
  costo_paquete_pollo numeric not null default 28000,
  unidades_por_paquete int not null default 25,
  precio_venta_carne numeric not null default 2200,
  precio_venta_pollo numeric not null default 2200,
  promo_2x_carne numeric not null default 4000,
  costo_paquete_salsa numeric not null default 4000,
  gasto_operativo_diario numeric not null default 5000
);

create table registros_diarios (
  id uuid primary key default gen_random_uuid(),
  fecha date unique not null,
  carne_llevada int not null default 0,
  pollo_llevada int not null default 0,
  regalos_carne int not null default 0,
  ingreso_total numeric not null default 0,
  monto_caja numeric not null default 0,
  monto_monedas numeric not null default 0,
  monto_nu numeric not null default 0,
  costo_recuperado numeric not null,   -- congelado al momento del registro
  gasto_operativo numeric not null default 5000,
  utilidad numeric not null,           -- congelado al momento del registro
  notas text,
  created_at timestamptz default now()
);

create table fiados (
  id uuid primary key default gen_random_uuid(),
  fecha_creacion date not null,
  nombre_persona text not null,
  cantidad_empanadas int,
  monto numeric not null,
  monto_abonado numeric not null default 0,
  estado text not null default 'pendiente', -- 'pendiente' | 'pagado'
  fecha_pago date,
  registro_diario_id uuid references registros_diarios(id)
);

create table compras_mercancia (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  tipo text not null check (tipo in ('carne','pollo','salsa')),
  cantidad_paquetes int not null,
  costo_total numeric not null,
  bolsillo_origen text, -- 'caja' | 'monedas' | 'nu' (opcional)
  created_at timestamptz default now()
);
```

> Claude Code puede ajustar nombres/tipos si encuentra una forma más idiomática en Supabase, pero debe respetar la lógica de negocio de las secciones 3.3–3.8.

---

## 5. Pantallas / funcionalidades

1. **Registro diario** (formulario principal): ingresar carne/pollo llevada, regalos de carne, ingreso total, distribución en bolsillos, notas. Muestra en vivo el cálculo de costo recuperado, gasto operativo y utilidad antes de guardar.
2. **Fiados**: lista de deudas pendientes y pagadas, con opción de marcar como pagado o abonar parcialmente, y registrar nuevas.
3. **Compras de mercancía**: registrar compra de paquetes (carne/pollo/salsa), ver historial.
4. **Inventario**: stock actual de carne y pollo (calculado).
5. **Dashboard**: 
   - Ventas por día/semana/mes
   - Comparación carne vs. pollo (unidades llevadas)
   - Utilidad acumulada (línea de tiempo)
   - Capital disponible para reinversión
   - Total de deudas pendientes (fiados)
   - Saldos por bolsillo (Caja/Monedas/Nu)
   - Totales: diario, semanal, mensual
6. **Edición de un día ya registrado**: debe permitir corregir un registro pasado. Como el capital, inventario y saldos son calculados (no mutables), esto se resuelve automáticamente al editar el registro base — pero hay que tener cuidado con la UI para no permitir inconsistencias (ej. fecha duplicada).

---

## 6. Datos históricos

Se empieza desde cero — no hay migración de registros manuales anteriores.

---

## 7. Diseño visual

- **Dark mode**, pero no negro puro — usar tonos gris oscuro/azulado, no `#000000`.
- Nombre del proyecto: **Empanatin**.
- Verde para lo positivo/aprobado (utilidad, pagos al día, ganancias).
- Rojo para lo negativo/desaprobado (deudas pendientes, gastos, utilidad negativa).

### Paleta propuesta

| Uso | Color | Hex |
|---|---|---|
| Fondo principal | Gris oscuro azulado | `#12141A` |
| Superficie / cards | Gris oscuro un poco más claro | `#1C1F27` |
| Borde sutil | Gris medio | `#2A2E38` |
| Texto principal | Blanco hueso | `#EDEFF3` |
| Texto secundario | Gris claro | `#9BA1AE` |
| Acento de marca (Empanatin) | Terracota/naranja cálido (evoca masa horneada) | `#E08A4C` |
| Positivo / utilidad / pagado | Verde | `#3DB56A` |
| Negativo / deuda / gasto | Rojo | `#E2554A` |
| Advertencia (opcional) | Ámbar | `#E0B94C` |

Tipografía: una sans-serif moderna (ej. Inter o system-ui) — limpia y legible en modo oscuro.

---

## 8. Convenciones de desarrollo

- TypeScript estricto, evitar `any`.
- Toda la lógica de cálculo (sección 3.3) debe vivir en un módulo compartido (ej. `lib/calculos.ts`), testeable de forma aislada — no duplicarla en varios componentes.
- Variables de entorno para las credenciales de Supabase (`.env.local`, nunca commitear claves).
- Commits pequeños y descriptivos.
- Priorizar simplicidad: este es un sistema para una sola persona, no hace falta arquitectura excesiva.

---

## 9. Fuera de alcance (por ahora)

- Autenticación / login.
- Multiusuario.
- Versión mobile-first (aunque debe ser responsive básico).
- Migración de datos históricos.