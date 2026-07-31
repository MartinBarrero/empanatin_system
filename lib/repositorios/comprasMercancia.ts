import type { SupabaseClient } from "@supabase/supabase-js";
import type { Configuracion } from "../calculos";
import { obtenerConfiguracionVigente } from "./registrosDiarios";

export type TipoMercancia = "carne" | "pollo" | "salsa";
export type BolsilloOrigen = "billetera" | "monedas" | "nu";

export interface CompraMercanciaInput {
  fecha: string;
  tipo: TipoMercancia;
  cantidad_paquetes: number;
  costo_total?: number;
  bolsillo_origen?: BolsilloOrigen | null;
}

export interface CompraMercancia {
  id: string;
  fecha: string;
  tipo: TipoMercancia;
  cantidad_paquetes: number;
  costo_total: number;
  bolsillo_origen: BolsilloOrigen | null;
}

function costoPorPaquete(tipo: TipoMercancia, config: Configuracion): number {
  if (tipo === "carne") return config.costo_paquete_carne;
  if (tipo === "pollo") return config.costo_paquete_pollo;
  return config.costo_paquete_salsa;
}

export async function crearCompra(
  client: SupabaseClient,
  input: CompraMercanciaInput
): Promise<CompraMercancia> {
  let costoTotal = input.costo_total;
  if (costoTotal === undefined) {
    const config = await obtenerConfiguracionVigente(client);
    costoTotal = costoPorPaquete(input.tipo, config) * input.cantidad_paquetes;
  }

  const { data, error } = await client
    .from("compras_mercancia")
    .insert({
      fecha: input.fecha,
      tipo: input.tipo,
      cantidad_paquetes: input.cantidad_paquetes,
      costo_total: costoTotal,
      bolsillo_origen: input.bolsillo_origen ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as CompraMercancia;
}

export async function listarCompras(client: SupabaseClient): Promise<CompraMercancia[]> {
  const { data, error } = await client
    .from("compras_mercancia")
    .select("*")
    .order("fecha", { ascending: false });

  if (error) throw error;
  return (data ?? []) as CompraMercancia[];
}
