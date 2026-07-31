-- Empanatin — esquema inicial
-- Ver Claude.md, sección 4 (Modelo de datos) y 3.1 (Datos de referencia).

create extension if not exists "pgcrypto";

create table configuracion (
  id int primary key default 1,
  costo_paquete_carne numeric not null default 26000,
  costo_paquete_pollo numeric not null default 28000,
  unidades_por_paquete int not null default 25,
  precio_venta_carne numeric not null default 2200,
  precio_venta_pollo numeric not null default 2200,
  promo_2x_carne numeric not null default 4000,
  costo_paquete_salsa numeric not null default 4000,
  gasto_operativo_diario numeric not null default 5000,
  constraint configuracion_singleton check (id = 1)
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
  estado text not null default 'pendiente' check (estado in ('pendiente', 'pagado')),
  fecha_pago date,
  registro_diario_id uuid references registros_diarios(id)
);

create table compras_mercancia (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  tipo text not null check (tipo in ('carne','pollo','salsa')),
  cantidad_paquetes int not null,
  costo_total numeric not null,
  bolsillo_origen text check (bolsillo_origen in ('caja','monedas','nu')),
  created_at timestamptz default now()
);

-- Valores por defecto (Claude.md, sección 3.1).
insert into configuracion (
  id,
  costo_paquete_carne,
  costo_paquete_pollo,
  unidades_por_paquete,
  precio_venta_carne,
  precio_venta_pollo,
  promo_2x_carne,
  costo_paquete_salsa,
  gasto_operativo_diario
) values (
  1,
  26000,
  28000,
  25,
  2200,
  2200,
  4000,
  4000,
  5000
);
