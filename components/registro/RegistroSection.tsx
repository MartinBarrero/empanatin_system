import { ClipboardList } from "lucide-react";
import type { Configuracion } from "@/lib/calculos";
import type { RegistroDiario } from "@/lib/repositorios/registrosDiarios";
import { SectionHeading } from "@/components/ui/SectionHeading";
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
      <SectionHeading
        icon={ClipboardList}
        title="Registro diario"
        description="Ingresa lo que llevaste hoy y ve la utilidad calculada al instante."
      />
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
