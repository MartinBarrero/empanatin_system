"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { hoyISO } from "@/lib/fecha";
import {
  crearFiado,
  eliminarFiado,
  registrarAbono,
  type Fiado,
  type FiadoInput,
} from "@/lib/repositorios/fiados";

export type FiadoResultado = { ok: true; fiado: Fiado } | { ok: false; error: string };
export type EliminarFiadoResultado = { ok: true } | { ok: false; error: string };

export async function crearFiadoAction(input: FiadoInput): Promise<FiadoResultado> {
  try {
    const fiado = await crearFiado(supabase, input);
    revalidatePath("/");
    return { ok: true, fiado };
  } catch (error) {
    console.error("Error al crear el fiado:", error);
    return { ok: false, error: "No se pudo registrar el fiado. Intenta de nuevo." };
  }
}

export async function registrarAbonoAction(
  id: string,
  montoAbono: number
): Promise<FiadoResultado> {
  try {
    const hoy = hoyISO();
    const fiado = await registrarAbono(supabase, id, montoAbono, hoy);
    revalidatePath("/");
    return { ok: true, fiado };
  } catch (error) {
    console.error("Error al registrar el abono:", error);
    return { ok: false, error: "No se pudo registrar el abono. Intenta de nuevo." };
  }
}

export async function eliminarFiadoAction(id: string): Promise<EliminarFiadoResultado> {
  try {
    await eliminarFiado(supabase, id);
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    console.error("Error al eliminar el fiado:", error);
    return { ok: false, error: "No se pudo eliminar el fiado. Intenta de nuevo." };
  }
}
