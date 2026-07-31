import { supabase } from "@/lib/supabase";
import {
  obtenerConfiguracionVigente,
  obtenerRegistroPorFecha,
} from "@/lib/repositorios/registrosDiarios";
import { RegistroDiarioForm } from "./RegistroDiarioForm";

// Depende de la fecha actual y del estado vigente en Supabase — no se puede
// cachear como página estática.
export const dynamic = "force-dynamic";

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function RegistroDiarioPage() {
  const fechaInicial = hoyISO();

  const [config, registroInicial] = await Promise.all([
    obtenerConfiguracionVigente(supabase),
    obtenerRegistroPorFecha(supabase, fechaInicial),
  ]);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h2 className="mb-6 text-xl font-semibold text-foreground">Registro diario</h2>
      <RegistroDiarioForm
        config={config}
        fechaInicial={fechaInicial}
        registroInicial={registroInicial}
      />
    </div>
  );
}
