import type { Configuracion } from "@/lib/calculos";
import type { RegistroDiario } from "@/lib/repositorios/registrosDiarios";
import { RegistroDiarioForm } from "./RegistroDiarioForm";
import { VentasSemanaChart } from "./VentasSemanaChart";

interface Props {
  config: Configuracion;
  fechaInicial: string;
  registroInicial: RegistroDiario | null;
}

export function RegistroSection({ config, fechaInicial, registroInicial }: Props) {
  return (
    <section id="registro" className="mx-auto max-w-6xl px-6 py-16">
      <h2 className="mb-8 font-serif text-3xl font-bold text-foreground">Registro diario</h2>
      <div className="grid gap-8 lg:grid-cols-2">
        <RegistroDiarioForm
          config={config}
          fechaInicial={fechaInicial}
          registroInicial={registroInicial}
        />
        <VentasSemanaChart />
      </div>
    </section>
  );
}
