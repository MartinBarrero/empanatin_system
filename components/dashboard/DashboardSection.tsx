import { LayoutDashboard } from "lucide-react";
import type { RegistroDiario } from "@/lib/repositorios/registrosDiarios";
import type { Fiado } from "@/lib/repositorios/fiados";
import type { StockActual } from "@/lib/repositorios/inventario";
import { calcularTotalesPorPeriodo, calcularUtilidadAcumulada } from "@/lib/dashboard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { UtilidadAcumuladaChart } from "./UtilidadAcumuladaChart";

interface Props {
  registros: RegistroDiario[];
  fiados: Fiado[];
  stock: StockActual;
  capital: number;
}

function formatoPesos(valor: number): string {
  return `$${Math.round(valor).toLocaleString("es-CO")}`;
}

export function DashboardSection({ registros, fiados, stock, capital }: Props) {
  const hoy = new Date().toISOString().slice(0, 10);
  const totales = calcularTotalesPorPeriodo(registros, hoy);
  const serieUtilidad = calcularUtilidadAcumulada(registros);
  const deudaPendiente = fiados
    .filter((f) => f.estado === "pendiente")
    .reduce((suma, f) => suma + (f.monto - f.monto_abonado), 0);

  const periodos: { titulo: string; ventas: string; utilidad: string; utilidadNumerica: number }[] = [
    {
      titulo: "Hoy",
      ventas: formatoPesos(totales.diario.ventas),
      utilidad: formatoPesos(totales.diario.utilidad),
      utilidadNumerica: totales.diario.utilidad,
    },
    {
      titulo: "Esta semana",
      ventas: formatoPesos(totales.semanal.ventas),
      utilidad: formatoPesos(totales.semanal.utilidad),
      utilidadNumerica: totales.semanal.utilidad,
    },
    {
      titulo: "Este mes",
      ventas: formatoPesos(totales.mensual.ventas),
      utilidad: formatoPesos(totales.mensual.utilidad),
      utilidadNumerica: totales.mensual.utilidad,
    },
  ];

  const otrasTarjetas: { titulo: string; valor: string; destacar?: boolean; valorNumerico?: number }[] = [
    { titulo: "Deudas pendientes", valor: formatoPesos(deudaPendiente), destacar: true, valorNumerico: -deudaPendiente },
    { titulo: "Stock carne", valor: `${stock.carne} unidades` },
    { titulo: "Stock pollo", valor: `${stock.pollo} unidades` },
  ];

  return (
    <section id="dashboard" className="mx-auto max-w-6xl px-6 py-16">
      <SectionHeading
        icon={LayoutDashboard}
        title="Dashboard"
        description="Totales del día, la semana y el mes, en un vistazo."
      />

      <div className="mb-8 grid gap-5 sm:grid-cols-3">
        {periodos.map((periodo) => (
          <div
            key={periodo.titulo}
            className="rounded-2xl border border-border/70 bg-surface p-5 shadow-lg shadow-black/20"
          >
            <p className="font-serif text-lg font-bold text-accent">{periodo.titulo}</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted">Ventas</p>
                <p className="mt-1 text-xl font-semibold text-foreground">{periodo.ventas}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Utilidad</p>
                <p
                  className={`mt-1 text-xl font-semibold ${
                    periodo.utilidadNumerica >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {periodo.utilidad}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8 rounded-2xl border border-border/70 bg-surface p-5 shadow-lg shadow-black/20">
        <p className="font-serif text-lg font-bold text-accent">Capital de reinversión</p>
        <p className="mt-4 text-2xl font-semibold text-foreground">{formatoPesos(capital)}</p>
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {otrasTarjetas.map((tarjeta) => (
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

      <UtilidadAcumuladaChart serie={serieUtilidad} />
    </section>
  );
}
