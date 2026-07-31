"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PuntoUtilidadAcumulada } from "@/lib/dashboard";

interface Props {
  serie: PuntoUtilidadAcumulada[];
}

export function UtilidadAcumuladaChart({ serie }: Props) {
  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <h3 className="mb-4 text-sm font-medium text-muted">Utilidad acumulada</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={serie}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2C2C30" />
          <XAxis dataKey="fecha" stroke="#A3A3A8" fontSize={12} />
          <YAxis stroke="#A3A3A8" fontSize={12} />
          <Tooltip
            contentStyle={{ background: "#1A1A1D", border: "1px solid #2C2C30", color: "#F5F5F0" }}
          />
          <Line type="monotone" dataKey="acumulado" stroke="#F2C230" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
