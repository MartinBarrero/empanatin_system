import { LayoutDashboard } from "lucide-react";
import type { RegistroDiario } from "@/lib/repositorios/registrosDiarios";
import type { Fiado } from "@/lib/repositorios/fiados";
import type { StockActual } from "@/lib/repositorios/inventario";
import type { SaldosBolsillos } from "@/lib/repositorios/bolsillos";
import {
  calcularComparacionCarnePollo,
  calcularTotalesPorPeriodo,
  calcularUtilidadAcumulada,
} from "@/lib/dashboard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { UtilidadAcumuladaChart } from "./UtilidadAcumuladaChart";

interface Props {
  registros: RegistroDiario[];
  fiados: Fiado[];
  stock: StockActual;
  capital: number;
  bolsillos: SaldosBolsillos;
}

function formatoPesos(valor: number): string {
  return `$${Math.round(valor).toLocaleString("es-CO")}`;
}

export function DashboardSection({ registros, fiados, stock, capital, bolsillos }: Props) {
  const hoy = new Date().toISOString().slice(0, 10);
  const totales = calcularTotalesPorPeriodo(registros, hoy);
  const comparacion = calcularComparacionCarnePollo(registros);
  const serieUtilidad = calcularUtilidadAcumulada(registros);
  const deudaPendiente = fiados
    .filter((f) => f.estado === "pendiente")
    .reduce((suma, f) => suma + (f.monto - f.monto_abonado), 0);

  const tarjetas: { titulo: string; valor: string; destacar?: boolean; valorNumerico?: number }[] = [
    { titulo: "Ventas hoy", valor: formatoPesos(totales.diario.ventas) },
    { titulo: "Utilidad hoy", valor: formatoPesos(totales.diario.utilidad), destacar: true, valorNumerico: totales.diario.utilidad },
    { titulo: "Ventas esta semana", valor: formatoPesos(totales.semanal.ventas) },
    { titulo: "Utilidad esta semana", valor: formatoPesos(totales.semanal.utilidad), destacar: true, valorNumerico: totales.semanal.utilidad },
    { titulo: "Ventas este mes", valor: formatoPesos(totales.mensual.ventas) },
    { titulo: "Utilidad este mes", valor: formatoPesos(totales.mensual.utilidad), destacar: true, valorNumerico: totales.mensual.utilidad },
    { titulo: "Capital de reinversión", valor: formatoPesos(capital) },
    { titulo: "Deudas pendientes", valor: formatoPesos(deudaPendiente), destacar: true, valorNumerico: -deudaPendiente },
    { titulo: "Stock carne", valor: `${stock.carne} unidades` },
    { titulo: "Stock pollo", valor: `${stock.pollo} unidades` },
    { titulo: "Billetera", valor: formatoPesos(bolsillos.billetera) },
    { titulo: "Monedas", valor: formatoPesos(bolsillos.monedas) },
    { titulo: "Nu", valor: formatoPesos(bolsillos.nu) },
  ];

  return (
    <section id="dashboard" className="mx-auto max-w-6xl px-6 py-16">
      <SectionHeading
        icon={LayoutDashboard}
        title="Dashboard"
        description="Totales del día, la semana y el mes, en un vistazo."
      />

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tarjetas.map((tarjeta) => (
          <div
            key={tarjeta.titulo}
            className="rounded-2xl border border-border/70 bg-surface p-4 shadow-lg shadow-black/20 transition hover:border-accent/40"
          >
            <p className="text-xs text-muted">{tarjeta.titulo}</p>
            <p
              className={`mt-1 text-xl font-semibold ${
                tarjeta.destacar
                  ? (tarjeta.valorNumerico ?? 0) >= 0
                    ? "text-success"
                    : "text-danger"
                  : "text-foreground"
              }`}
            >
              {tarjeta.valor}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-surface p-5 shadow-lg shadow-black/20">
          <h3 className="mb-4 text-sm font-medium text-muted">Carne vs. pollo (unidades llevadas)</h3>
          <dl className="grid grid-cols-2 gap-4 text-center">
            <div>
              <dt className="text-xs text-muted">Carne</dt>
              <dd className="text-2xl font-semibold text-accent">{comparacion.carne}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Pollo</dt>
              <dd className="text-2xl font-semibold text-success">{comparacion.pollo}</dd>
            </div>
          </dl>
        </div>
        <UtilidadAcumuladaChart serie={serieUtilidad} />
      </div>
    </section>
  );
}
