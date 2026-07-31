import type { SupabaseClient } from "@supabase/supabase-js";

export interface SaldosBolsillos {
  billetera: number;
  monedas: number;
  nu: number;
}

export async function obtenerSaldosBolsillos(client: SupabaseClient): Promise<SaldosBolsillos> {
  const [registros, compras] = await Promise.all([
    client.from("registros_diarios").select("monto_billetera,monto_monedas,monto_nu"),
    client.from("compras_mercancia").select("bolsillo_origen,costo_total"),
  ]);

  if (registros.error) throw registros.error;
  if (compras.error) throw compras.error;

  const filasRegistros = (registros.data ?? []) as {
    monto_billetera: number;
    monto_monedas: number;
    monto_nu: number;
  }[];
  const filasCompras = (compras.data ?? []) as {
    bolsillo_origen: string | null;
    costo_total: number;
  }[];

  const saldos: SaldosBolsillos = {
    billetera: filasRegistros.reduce((suma, r) => suma + r.monto_billetera, 0),
    monedas: filasRegistros.reduce((suma, r) => suma + r.monto_monedas, 0),
    nu: filasRegistros.reduce((suma, r) => suma + r.monto_nu, 0),
  };

  for (const compra of filasCompras) {
    if (compra.bolsillo_origen === "billetera") saldos.billetera -= compra.costo_total;
    else if (compra.bolsillo_origen === "monedas") saldos.monedas -= compra.costo_total;
    else if (compra.bolsillo_origen === "nu") saldos.nu -= compra.costo_total;
  }

  return saldos;
}
