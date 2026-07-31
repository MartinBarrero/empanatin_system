"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { crearFiado, registrarAbono, type Fiado, type FiadoInput } from "@/lib/repositorios/fiados";

export type FiadoResultado = { ok: true; fiado: Fiado } | { ok: false; error: string };

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
    const hoy = new Date().toISOString().slice(0, 10);
    const fiado = await registrarAbono(supabase, id, montoAbono, hoy);
    revalidatePath("/");
    return { ok: true, fiado };
  } catch (error) {
    console.error("Error al registrar el abono:", error);
    return { ok: false, error: "No se pudo registrar el abono. Intenta de nuevo." };
  }
}
