import { Package, Pencil } from "lucide-react";
import type { StockActual } from "@/lib/repositorios/inventario";
import type { CompraMercancia } from "@/lib/repositorios/comprasMercancia";
import type { Configuracion } from "@/lib/calculos";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CompraMercanciaPanel } from "./CompraMercanciaPanel";

interface Props {
  stock: StockActual;
  compras: CompraMercancia[];
  config: Configuracion;
}

export function StockSection({ stock, compras, config }: Props) {
  return (
    <section id="stock" className="mx-auto max-w-4xl px-6 py-16">
      <SectionHeading
        icon={Package}
        title="Stock y compras de mercancía"
        description="Inventario calculado y registro de compras."
      />

      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium text-muted">Inventario actual</p>
          <button
            type="button"
            title="Corregir el stock manualmente"
            className="inline-flex items-center gap-2 rounded-lg border border-accent px-3 py-1.5 text-sm text-accent transition hover:bg-accent/10"
          >
            <Pencil size={14} />
            Editar stock
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-surface p-4 text-center shadow-lg shadow-black/20">
            <p className="text-xs text-muted">Stock de carne</p>
            <p className="mt-1 text-2xl font-semibold text-accent">{stock.carne} unidades</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-surface p-4 text-center shadow-lg shadow-black/20">
            <p className="text-xs text-muted">Stock de pollo</p>
            <p className="mt-1 text-2xl font-semibold text-success">{stock.pollo} unidades</p>
          </div>
        </div>
      </div>

      <CompraMercanciaPanel comprasIniciales={compras} config={config} />
    </section>
  );
}
