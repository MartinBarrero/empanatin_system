import type { SupabaseClient } from "@supabase/supabase-js";
import {
  calcularCostoRecuperado,
  calcularIngresoTotal,
  calcularUtilidad,
  type Configuracion,
} from "../calculos";

export interface RegistroDiarioInput {
  fecha: string; // YYYY-MM-DD
  carne_llevada: number;
  pollo_llevada: number;
  regalos_carne: number;
  monto_billetera: number;
  monto_monedas: number;
  monto_nu: number;
  notas: string | null;
}

export interface RegistroDiario extends RegistroDiarioInput {
  id: string;
  ingreso_total: number;
  costo_recuperado: number;
  gasto_operativo: number;
  utilidad: number;
  created_at: string;
}

export async function obtenerConfiguracionVigente(
  client: SupabaseClient
): Promise<Configuracion> {
  const { data, error } = await client
    .from("configuracion")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) throw error;
  return data as Configuracion;
}

export async function obtenerRegistroPorFecha(
  client: SupabaseClient,
  fecha: string
): Promise<RegistroDiario | null> {
  const { data, error } = await client
    .from("registros_diarios")
    .select("*")
    .eq("fecha", fecha)
    .maybeSingle();

  if (error) throw error;
  return (data as RegistroDiario | null) ?? null;
}

export async function guardarRegistroDiario(
  client: SupabaseClient,
  input: RegistroDiarioInput
): Promise<RegistroDiario> {
  const ingresoTotal = calcularIngresoTotal(
    input.monto_billetera,
    input.monto_monedas,
    input.monto_nu
  );

  const config = await obtenerConfiguracionVigente(client);
  const costoRecuperado = calcularCostoRecuperado(
    input.carne_llevada,
    input.pollo_llevada,
    config
  );
  const gastoOperativo = config.gasto_operativo_diario;
  const utilidad = calcularUtilidad(ingresoTotal, costoRecuperado, gastoOperativo);

  const { data, error } = await client
    .from("registros_diarios")
    .upsert(
      {
        fecha: input.fecha,
        carne_llevada: input.carne_llevada,
        pollo_llevada: input.pollo_llevada,
        regalos_carne: input.regalos_carne,
        ingreso_total: ingresoTotal,
        monto_billetera: input.monto_billetera,
        monto_monedas: input.monto_monedas,
        monto_nu: input.monto_nu,
        costo_recuperado: costoRecuperado,
        gasto_operativo: gastoOperativo,
        utilidad,
        notas: input.notas,
      },
      { onConflict: "fecha" }
    )
    .select()
    .single();

  if (error) throw error;
  return data as RegistroDiario;
}
