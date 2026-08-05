import { HandCoins } from "lucide-react";
import type { Fiado } from "@/lib/repositorios/fiados";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FiadosPanel } from "./FiadosPanel";

interface Props {
  fiados: Fiado[];
}

export function FiadosSection({ fiados }: Props) {
  return (
    <section id="fiados" className="mx-auto max-w-4xl px-6 py-16">
      <SectionHeading
        icon={HandCoins}
        title="Fiados"
        description="Deudas pendientes y pagadas de tus clientes."
      />
      <FiadosPanel fiadosIniciales={fiados} />
    </section>
  );
}
