-- Renombra el bolsillo "Caja" a "Billetera" (ver Claude.md sección 3.8, 3.2).
-- No se toca 001_init.sql (histórico) — este archivo aplica el cambio sobre
-- una base ya inicializada.

alter table registros_diarios rename column monto_caja to monto_billetera;

update compras_mercancia set bolsillo_origen = 'billetera' where bolsillo_origen = 'caja';

alter table compras_mercancia drop constraint if exists compras_mercancia_bolsillo_origen_check;
alter table compras_mercancia add constraint compras_mercancia_bolsillo_origen_check
  check (bolsillo_origen in ('billetera', 'monedas', 'nu'));
