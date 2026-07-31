import type { Fiado } from "@/lib/repositorios/fiados";
import { FiadosPanel } from "./FiadosPanel";

interface Props {
  fiados: Fiado[];
}

export function FiadosSection({ fiados }: Props) {
  return (
    <section id="fiados" className="mx-auto max-w-4xl px-6 py-16">
      <h2 className="mb-8 font-serif text-3xl font-bold text-foreground">Fiados</h2>
      <FiadosPanel fiadosIniciales={fiados} />
    </section>
  );
}
