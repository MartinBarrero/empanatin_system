"use server";

import { supabase } from "@/lib/supabase";
import {
  DistribucionBolsillosInvalidaError,
  guardarRegistroDiario,
  obtenerRegistroPorFecha,
  type RegistroDiario,
  type RegistroDiarioInput,
} from "@/lib/repositorios/registrosDiarios";

export type GuardarRegistroResultado =
  | { ok: true; registro: RegistroDiario }
  | { ok: false; error: string };

export async function guardarRegistroDiarioAction(
  input: RegistroDiarioInput
): Promise<GuardarRegistroResultado> {
  try {
    const registro = await guardarRegistroDiario(supabase, input);
    return { ok: true, registro };
  } catch (error) {
    if (error instanceof DistribucionBolsillosInvalidaError) {
      return { ok: false, error: error.message };
    }
    console.error("Error al guardar el registro diario:", error);
    return {
      ok: false,
      error: "No se pudo guardar el registro. Intenta de nuevo.",
    };
  }
}

export async function buscarRegistroPorFechaAction(
  fecha: string
): Promise<RegistroDiario | null> {
  return obtenerRegistroPorFecha(supabase, fecha);
}
