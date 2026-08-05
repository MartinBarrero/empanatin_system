"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { calcularVentasSemana } from "@/lib/dashboard";
import type { RegistroDiario } from "@/lib/repositorios/registrosDiarios";

interface Props {
  registros: RegistroDiario[];
  fechaReferencia: string;
}

export function VentasSemanaChart({ registros, fechaReferencia }: Props) {
  const datos = calcularVentasSemana(registros, fechaReferencia);

  return (
    <div className="rounded-2xl border border-border/70 bg-surface p-5 shadow-lg shadow-black/20">
      <h3 className="mb-4 text-sm font-medium text-muted">Ventas de la semana actual</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={datos}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2C2C30" />
          <XAxis dataKey="dia" stroke="#A3A3A8" fontSize={12} />
          <YAxis stroke="#A3A3A8" fontSize={12} />
          <Tooltip
            contentStyle={{ background: "#1A1A1D", border: "1px solid #2C2C30", color: "#F5F5F0" }}
          />
          <Legend />
          <Bar dataKey="carne" name="Carne" fill="#F2C230" radius={[4, 4, 0, 0]} />
          <Bar dataKey="pollo" name="Pollo" fill="#F5F5F0" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
