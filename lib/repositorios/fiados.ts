import type { SupabaseClient } from "@supabase/supabase-js";

export interface FiadoInput {
  fecha_creacion: string; // YYYY-MM-DD
  nombre_persona: string;
  cantidad_empanadas: number | null;
  monto: number;
}

export interface Fiado extends FiadoInput {
  id: string;
  monto_abonado: number;
  estado: "pendiente" | "pagado";
  fecha_pago: string | null;
  registro_diario_id: string | null;
}

export class FiadoNoEncontradoError extends Error {
  constructor(id: string) {
    super(`No existe un fiado con id ${id}.`);
    this.name = "FiadoNoEncontradoError";
  }
}

export async function crearFiado(client: SupabaseClient, input: FiadoInput): Promise<Fiado> {
  const { data, error } = await client
    .from("fiados")
    .insert({
      fecha_creacion: input.fecha_creacion,
      nombre_persona: input.nombre_persona,
      cantidad_empanadas: input.cantidad_empanadas,
      monto: input.monto,
      monto_abonado: 0,
      estado: "pendiente",
      fecha_pago: null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Fiado;
}

export async function listarFiados(
  client: SupabaseClient,
  estado?: "pendiente" | "pagado"
): Promise<Fiado[]> {
  const base = client.from("fiados").select("*").order("fecha_creacion", { ascending: false });
  const { data, error } = await (estado ? base.eq("estado", estado) : base);

  if (error) throw error;
  return (data ?? []) as Fiado[];
}

export async function registrarAbono(
  client: SupabaseClient,
  id: string,
  montoAbono: number,
  hoy: string
): Promise<Fiado> {
  const { data: fiadoData, error: errorBusqueda } = await client
    .from("fiados")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (errorBusqueda) throw errorBusqueda;
  if (!fiadoData) throw new FiadoNoEncontradoError(id);

  const fiadoActual = fiadoData as Fiado;
  const nuevoAbonado = fiadoActual.monto_abonado + montoAbono;
  const pagado = nuevoAbonado >= fiadoActual.monto;

  const { data, error } = await client
    .from("fiados")
    .update({
      monto_abonado: nuevoAbonado,
      estado: pagado ? "pagado" : "pendiente",
      fecha_pago: pagado ? hoy : null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Fiado;
}
