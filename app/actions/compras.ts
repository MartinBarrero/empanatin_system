"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import {
  actualizarCompra,
  crearCompra,
  eliminarCompra,
  type CompraMercancia,
  type CompraMercanciaInput,
} from "@/lib/repositorios/comprasMercancia";

export type CompraResultado =
  | { ok: true; compra: CompraMercancia }
  | { ok: false; error: string };
export type EliminarCompraResultado = { ok: true } | { ok: false; error: string };

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

export async function actualizarCompraAction(
  id: string,
  input: CompraMercanciaInput
): Promise<CompraResultado> {
  try {
    const compra = await actualizarCompra(supabase, id, input);
    revalidatePath("/");
    return { ok: true, compra };
  } catch (error) {
    console.error("Error al actualizar la compra:", error);
    return { ok: false, error: "No se pudo actualizar la compra. Intenta de nuevo." };
  }
}

export async function eliminarCompraAction(id: string): Promise<EliminarCompraResultado> {
  try {
    await eliminarCompra(supabase, id);
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    console.error("Error al eliminar la compra:", error);
    return { ok: false, error: "No se pudo eliminar la compra. Intenta de nuevo." };
  }
}
