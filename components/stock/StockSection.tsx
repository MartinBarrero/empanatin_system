import type { StockActual } from "@/lib/repositorios/inventario";
import type { CompraMercancia } from "@/lib/repositorios/comprasMercancia";
import type { Configuracion } from "@/lib/calculos";
import { CompraMercanciaPanel } from "./CompraMercanciaPanel";

interface Props {
  stock: StockActual;
  compras: CompraMercancia[];
  config: Configuracion;
}

export function StockSection({ stock, compras, config }: Props) {
  return (
    <section id="stock" className="mx-auto max-w-4xl px-6 py-16">
      <h2 className="mb-8 font-serif text-3xl font-bold text-foreground">Stock y compras de mercancía</h2>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-md border border-border bg-surface p-4 text-center">
          <p className="text-xs text-muted">Stock de carne</p>
          <p className="mt-1 text-2xl font-semibold text-accent">{stock.carne} unidades</p>
        </div>
        <div className="rounded-md border border-border bg-surface p-4 text-center">
          <p className="text-xs text-muted">Stock de pollo</p>
          <p className="mt-1 text-2xl font-semibold text-success">{stock.pollo} unidades</p>
        </div>
      </div>

      <CompraMercanciaPanel comprasIniciales={compras} config={config} />
    </section>
  );
}
