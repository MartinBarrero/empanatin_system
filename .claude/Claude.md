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
- Montos por bolsillo: `monto_billetera` (efectivo en mano), `monto_monedas`, `monto_nu`. **Ya no se ingresa un total manual** — `ingreso_total` se calcula automáticamente como la suma de los tres: `ingreso_total = monto_billetera + monto_monedas + monto_nu`. Este total ya incluye cualquier pago de fiado recibido ese día (la usuaria lo cuenta junto con lo demás, no se suma aparte).

No se pide diferenciar cuántas ventas fueron normales vs. promoción 2x$4.000 — la dueña es flexible con esto y no necesita un resultado exacto por ese lado.

**Importante:** `carne_llevada` y `pollo_llevada` ya incluyen las unidades regaladas y las fiadas — no se restan ni se suman aparte del stock. Es decir, si llevó 30 de carne, esas 30 salen del inventario sin importar si se vendieron, regalaron o fiaron.

### 3.3 Fórmula del día (el corazón del sistema)

```
costo_unit_carne = costo_paquete_carne / unidades_por_paquete
costo_unit_pollo = costo_paquete_pollo / unidades_por_paquete

costo_recuperado = (carne_llevada * costo_unit_carne) + (pollo_llevada * costo_unit_pollo)

ingreso_total = monto_billetera + monto_monedas + monto_nu   // calculado, no se ingresa manualmente

gasto_operativo = gasto_operativo_diario   // fijo, siempre se resta completo (confirmado por la usuaria: "siempre alcanza")

utilidad = ingreso_total - costo_recuperado - gasto_operativo
```

> Nota de migración: en la Fase 2 ya se implementó `ingreso_total` como campo manual con una validación de que los bolsillos cuadraran con él (`sumaBolsillosCuadra`). Ese enfoque queda obsoleto: ahora `ingreso_total` se deriva siempre de los tres montos de bolsillo, así que la validación de cuadre ya no es necesaria (no puede haber descuadre porque es la misma suma).

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
- Opcional (mejora): permitir indicar de qué bolsillo salió el dinero (Billetera/Monedas/Nu) para descontar ese saldo.

### 3.7 Fiados (cuentas por cobrar)

- Campos: nombre de la persona, cantidad de empanadas (opcional), monto en pesos, fecha de creación, estado (`pendiente` / `pagado`), fecha de pago.
- Se permiten abonos parciales (agregar un campo de monto abonado o registrar el fiado como una serie de abonos hasta llegar al monto total — a definir en el diseño de UI, pero el modelo de datos debe soportarlo).
- Cuando se marca como pagado, **no se suma automáticamente a `ingreso_total`** de ningún día — la usuaria ya lo cuenta manualmente el día que le pagan, dentro de su total contado.

### 3.8 Bolsillos (Billetera, Monedas, Nu)

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
  ingreso_total numeric not null default 0,  -- calculado: monto_billetera + monto_monedas + monto_nu
  monto_billetera numeric not null default 0,
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
  bolsillo_origen text, -- 'billetera' | 'monedas' | 'nu' (opcional)
  created_at timestamptz default now()
);
```

> Claude Code puede ajustar nombres/tipos si encuentra una forma más idiomática en Supabase, pero debe respetar la lógica de negocio de las secciones 3.3–3.8.

---

## 5. Arquitectura de página: una sola página con scroll (NO multi-ruta)

**Cambio importante de diseño:** en vez de páginas separadas con navegación/redirecciones, todo el sitio vive en `app/page.tsx` como una sola página larga, dividida en secciones con `id` (anclas), a las que se llega con scroll suave (`scroll-behavior: smooth`), no con `<Link href="/ruta">`.

Internamente el código sí puede (y debe) organizarse en componentes separados por carpeta/feature (ej. `components/registro/`, `components/fiados/`, etc.) para mantenibilidad — lo que cambia es que todos se renderizan dentro de la misma página, no en rutas independientes.

Secciones, en este orden:

1. **`#hero`** — Sección de bienvenida:
   - Logo de Empanatin (imagen ya provista en el proyecto) como elemento visual principal.
   - Título/eslogan de marca.
   - Botón principal: **"Registra tus ventas Martin"** — hace scroll suave hacia `#registro`.
   - Debajo, 3 botones/tarjetas de acceso directo (scroll suave, no redirección):
     - "Ver el Dashboard" → `#dashboard`
     - "Ver el stock" → `#stock`
     - "Ver las deudas" → `#fiados`

2. **`#registro`** — Registro diario, en dos columnas:
   - Izquierda: formulario de registro diario (carne/pollo llevada, regalos de carne, montos de billetera/monedas/nu, notas), con vista previa en vivo de costo recuperado/gasto operativo/utilidad.
   - Derecha: gráfica de ventas **solo de la semana actual**. Esta gráfica puede implementarse inicialmente con datos mock/estáticos (aún no es su fase de datos reales) — se conecta a datos reales de Supabase en una fase posterior.

3. **`#dashboard`** — Dashboard completo:
   - Ventas por día/semana/mes
   - Comparación carne vs. pollo (unidades llevadas)
   - Utilidad acumulada (línea de tiempo)
   - Capital disponible para reinversión
   - Total de deudas pendientes (fiados)
   - Saldos por bolsillo (Billetera/Monedas/Nu)
   - Totales: diario, semanal, mensual

4. **`#fiados`** — Fiados y deudas:
   - Lista de deudas pendientes y pagadas, con opción de marcar como pagado o abonar parcialmente, y registrar nuevas.

5. **`#stock`** — Stock e inventario:
   - Stock actual de paquetes/unidades de carne y pollo (calculado).
   - Botón para registrar compra de X cantidad de paquetes de carne o pollo (o salsa).

**Edición de un día ya registrado:** debe seguir siendo posible desde la sección `#registro` (buscar por fecha y editar sin duplicar). Como el capital, inventario y saldos son calculados (no mutables), esto se resuelve automáticamente al editar el registro base.

**Nota de migración:** la Fase 2 implementó `/registro-diario` como ruta independiente. Al pasar a página única, ese formulario debe moverse a un componente embebido en `#registro` dentro de `app/page.tsx` (se puede conservar la lógica de repositorios/acciones tal cual, solo cambia dónde se monta el componente).

---

## 6. Datos históricos

Se empieza desde cero — no hay migración de registros manuales anteriores.

---

## 7. Diseño visual

- **Dark mode**, tirando a negro pero no negro puro absoluto — usar un gris muy oscuro casi negro, no `#000000` plano.
- Nombre del proyecto: **Empanatin**, con **header centrado** (el texto/logo "Empanatin" va en el centro del header, no a la izquierda).
- Logo: usar la imagen del logo de Empanatin ya incluida en el proyecto como elemento visual principal del hero.
- **Sin color naranja/terracota** — el acento de marca es **dorado/amarillo** (inspirado en el logo).
- Verde para lo positivo/aprobado (utilidad, pagos al día, ganancias).
- Rojo para lo negativo/desaprobado (deudas pendientes, gastos, utilidad negativa).
- Botón principal (CTA del hero): texto exacto **"Registra tus ventas Martin"**.
- No incluir la tagline "Fácil, rápido y pensado para ti." (se descarta).

### Paleta propuesta

| Uso | Color | Hex |
|---|---|---|
| Fondo principal | Negro casi puro (gris muy oscuro) | `#0A0A0B` |
| Superficie / cards | Gris oscuro | `#1A1A1D` |
| Borde sutil | Gris medio oscuro | `#2C2C30` |
| Texto principal | Blanco hueso | `#F5F5F0` |
| Texto secundario | Gris claro | `#A3A3A8` |
| Acento de marca (Empanatin) | Dorado/amarillo (inspirado en el logo) | `#F2C230` |
| Positivo / utilidad / pagado | Verde | `#3DB56A` |
| Negativo / deuda / gasto | Rojo | `#E2554A` |
| Advertencia (opcional) | Ámbar (más apagado que el dorado de marca, para no confundir) | `#D9A441` |

Tipografía: una serif con carácter para títulos grandes (ej. Playfair Display o similar, como en la referencia visual) + una sans-serif moderna para el resto del texto (ej. Inter o system-ui).

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