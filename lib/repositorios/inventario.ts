import type { SupabaseClient } from "@supabase/supabase-js";
import { obtenerConfiguracionVigente } from "./registrosDiarios";

export interface StockActual {
  carne: number;
  pollo: number;
}

export async function obtenerStockActual(client: SupabaseClient): Promise<StockActual> {
  const [config, compras, registros] = await Promise.all([
    obtenerConfiguracionVigente(client),
    client.from("compras_mercancia").select("tipo,cantidad_paquetes"),
    client.from("registros_diarios").select("carne_llevada,pollo_llevada"),
  ]);

  if (compras.error) throw compras.error;
  if (registros.error) throw registros.error;

  const filasCompras = (compras.data ?? []) as { tipo: string; cantidad_paquetes: number }[];
  const filasRegistros = (registros.data ?? []) as {
    carne_llevada: number;
    pollo_llevada: number;
  }[];

  const paquetesCarne = filasCompras
    .filter((c) => c.tipo === "carne")
    .reduce((suma, c) => suma + c.cantidad_paquetes, 0);
  const paquetesPollo = filasCompras
    .filter((c) => c.tipo === "pollo")
    .reduce((suma, c) => suma + c.cantidad_paquetes, 0);

  const carneLlevadaTotal = filasRegistros.reduce((suma, r) => suma + r.carne_llevada, 0);
  const polloLlevadaTotal = filasRegistros.reduce((suma, r) => suma + r.pollo_llevada, 0);

  return {
    carne: paquetesCarne * config.unidades_por_paquete - carneLlevadaTotal,
    pollo: paquetesPollo * config.unidades_por_paquete - polloLlevadaTotal,
  };
}
