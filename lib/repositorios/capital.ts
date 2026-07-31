import type { SupabaseClient } from "@supabase/supabase-js";

export async function obtenerCapitalReinversion(client: SupabaseClient): Promise<number> {
  const [registros, compras] = await Promise.all([
    client.from("registros_diarios").select("costo_recuperado"),
    client.from("compras_mercancia").select("costo_total"),
  ]);

  if (registros.error) throw registros.error;
  if (compras.error) throw compras.error;

  const filasRegistros = (registros.data ?? []) as { costo_recuperado: number }[];
  const filasCompras = (compras.data ?? []) as { costo_total: number }[];

  const totalRecuperado = filasRegistros.reduce((suma, r) => suma + r.costo_recuperado, 0);
  const totalGastado = filasCompras.reduce((suma, c) => suma + c.costo_total, 0);

  return totalRecuperado - totalGastado;
}
