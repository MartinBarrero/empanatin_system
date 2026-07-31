"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import {
  crearCompra,
  type CompraMercancia,
  type CompraMercanciaInput,
} from "@/lib/repositorios/comprasMercancia";

export type CompraResultado =
  | { ok: true; compra: CompraMercancia }
  | { ok: false; error: string };

export async function crearCompraAction(
  input: CompraMercanciaInput
): Promise<CompraResultado> {
  try {
    const compra = await crearCompra(supabase, input);
    revalidatePath("/");
    return { ok: true, compra };
  } catch (error) {
    console.error("Error al registrar la compra:", error);
    return { ok: false, error: "No se pudo registrar la compra. Intenta de nuevo." };
  }
}
